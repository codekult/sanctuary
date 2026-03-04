import { z } from "zod";
import { eq, ilike, or, sql } from "drizzle-orm";
import { taxa, individuals } from "@sanctuary/db/schema";
import { createTaxonSchema, updateTaxonSchema } from "@sanctuary/types";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";

export const taxonRouter = router({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        kingdom: z.string().optional(),
        rank: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.kingdom) conditions.push(eq(taxa.kingdom, input.kingdom));
      if (input.rank) conditions.push(eq(taxa.taxonRank, input.rank));
      if (input.search) {
        conditions.push(
          or(
            ilike(taxa.scientificName, `%${input.search}%`),
            ilike(taxa.commonNameEn, `%${input.search}%`),
            ilike(taxa.commonNameEs, `%${input.search}%`),
          ),
        );
      }

      const where = conditions.length > 0
        ? sql`${sql.join(conditions.map((c) => sql`(${c})`), sql` AND `)}`
        : undefined;

      const results = await ctx.db
        .select()
        .from(taxa)
        .where(where)
        .limit(input.limit)
        .offset(input.offset);

      return results;
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [taxon] = await ctx.db
        .select()
        .from(taxa)
        .where(eq(taxa.id, input.id));

      if (!taxon) return null;

      const [count] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(individuals)
        .where(eq(individuals.taxonId, input.id));

      return { ...taxon, individualsCount: count?.count ?? 0 };
    }),

  create: protectedProcedure
    .input(createTaxonSchema)
    .mutation(async ({ ctx, input }) => {
      const [taxon] = await ctx.db.insert(taxa).values(input).returning();
      return taxon;
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), data: updateTaxonSchema }))
    .mutation(async ({ ctx, input }) => {
      const [taxon] = await ctx.db
        .update(taxa)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(taxa.id, input.id))
        .returning();
      return taxon;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(taxa).where(eq(taxa.id, input.id));
      return { success: true };
    }),

  searchExternal: publicProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const response = await fetch(
        `https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(input.query)}&per_page=10`,
      );
      const data = await response.json() as INatAutocompleteResponse;
      return data.results.map(mapINatTaxon);
    }),

  importFromExternal: protectedProcedure
    .input(z.object({ externalId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(
        `https://api.inaturalist.org/v1/taxa/${input.externalId}`,
      );
      const data = await response.json() as INatTaxonResponse;
      const result = data.results[0];
      if (!result) return null;

      const mapped = mapINatTaxon(result);
      const [taxon] = await ctx.db
        .insert(taxa)
        .values(mapped)
        .returning();
      return taxon;
    }),
});

interface INatTaxon {
  id: number;
  name: string;
  rank: string;
  preferred_common_name?: string;
  names?: Array<{ name: string; locale: string }>;
  ancestors?: Array<{ rank: string; name: string }>;
  default_photo?: { medium_url?: string };
  conservation_status?: { status?: string };
  wikipedia_summary?: string;
}

interface INatAutocompleteResponse {
  results: INatTaxon[];
}

interface INatTaxonResponse {
  results: INatTaxon[];
}

function mapINatTaxon(result: INatTaxon) {
  const ancestors = result.ancestors ?? [];
  const findAncestor = (rank: string) =>
    ancestors.find((a) => a.rank === rank)?.name ?? null;

  const spanishName =
    result.names?.find((n) => n.locale === "es")?.name ?? null;

  return {
    scientificName: result.name,
    commonNameEn: result.preferred_common_name ?? null,
    commonNameEs: spanishName,
    taxonRank: result.rank,
    kingdom: findAncestor("kingdom") ?? "Unknown",
    phylum: findAncestor("phylum"),
    class: findAncestor("class"),
    order: findAncestor("order"),
    family: findAncestor("family"),
    genus: findAncestor("genus"),
    specificEpithet: result.rank === "species" ? result.name.split(" ")[1] ?? null : null,
    externalId: String(result.id),
    externalSource: "inaturalist",
    descriptionEn: result.wikipedia_summary ?? null,
    descriptionEs: null,
    conservationStatus: result.conservation_status?.status ?? null,
    thumbnailUrl: result.default_photo?.medium_url ?? null,
  };
}
