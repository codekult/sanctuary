import { z } from "zod";
import { eq, ilike, or, sql, asc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { taxa, individuals } from "@sanctuary/db/schema";
import { createTaxonSchema, updateTaxonSchema, taxonRankEnum } from "@sanctuary/types";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";

function buildTaxaConditions(input: { kingdom?: string; rank?: string; search?: string }) {
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
  return conditions.length > 0
    ? sql`${sql.join(
        conditions.map((c) => sql`(${c})`),
        sql` AND `,
      )}`
    : undefined;
}

export const taxonRouter = router({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(25),
        offset: z.number().min(0).default(0),
        kingdom: z.string().optional(),
        rank: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = buildTaxaConditions(input);

      const [items, [countResult]] = await Promise.all([
        ctx.db
          .select()
          .from(taxa)
          .where(where)
          .orderBy(asc(taxa.scientificName))
          .limit(input.limit)
          .offset(input.offset),
        ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(taxa)
          .where(where),
      ]);

      return { items, total: countResult?.count ?? 0 };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [taxon] = await ctx.db.select().from(taxa).where(eq(taxa.id, input.id));

      if (!taxon) return null;

      const [count] = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(individuals)
        .where(eq(individuals.taxonId, input.id));

      return { ...taxon, individualsCount: count?.count ?? 0 };
    }),

  create: protectedProcedure.input(createTaxonSchema).mutation(async ({ ctx, input }) => {
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

  searchExternal: protectedProcedure
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ input }) => {
      const response = await fetch(
        `https://api.inaturalist.org/v1/taxa/autocomplete?q=${encodeURIComponent(input.query)}&per_page=10`,
      );
      if (!response.ok) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "Failed to search iNaturalist. Please try again later.",
        });
      }
      const data = (await response.json()) as INatAutocompleteResponse;
      return data.results.map(mapINatTaxon);
    }),

  importFromExternal: protectedProcedure
    .input(z.object({ externalId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const response = await fetch(`https://api.inaturalist.org/v1/taxa/${input.externalId}`);
      if (!response.ok) {
        throw new TRPCError({
          code: "BAD_GATEWAY",
          message: "Failed to fetch taxon from iNaturalist. Please try again later.",
        });
      }
      const data = (await response.json()) as INatTaxonResponse;
      const result = data.results[0];
      if (!result) return null;

      // Check for existing taxon with same external ID
      const [existing] = await ctx.db
        .select({ id: taxa.id })
        .from(taxa)
        .where(
          sql`${taxa.externalId} = ${String(result.id)} AND ${taxa.externalSource} = 'inaturalist'`,
        );
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "This taxon has already been imported.",
        });
      }

      const mapped = mapINatTaxon(result);

      // Validate that the rank is supported
      const rankParse = taxonRankEnum.safeParse(mapped.taxonRank);
      if (!rankParse.success) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Unsupported taxon rank "${mapped.taxonRank}". Only standard ranks are supported.`,
        });
      }

      const [taxon] = await ctx.db
        .insert(taxa)
        .values({ ...mapped, taxonRank: rankParse.data })
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
  const findAncestor = (rank: string) => ancestors.find((a) => a.rank === rank)?.name ?? null;

  const spanishName = result.names?.find((n) => n.locale === "es")?.name ?? null;

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
    specificEpithet: result.rank === "species" ? (result.name.split(" ")[1] ?? null) : null,
    externalId: String(result.id),
    externalSource: "inaturalist",
    descriptionEn: result.wikipedia_summary ?? null,
    descriptionEs: null,
    conservationStatus: result.conservation_status?.status ?? null,
    thumbnailUrl: result.default_photo?.medium_url ?? null,
  };
}
