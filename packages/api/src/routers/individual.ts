import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { individuals, observations } from "@sanctuary/db/schema";
import { createIndividualSchema, updateIndividualSchema } from "@sanctuary/types";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";

function stripCoordinates<T extends { latitude: string | null; longitude: string | null }>(
  item: T,
  isAuthenticated: boolean,
): T {
  if (isAuthenticated) return item;
  return { ...item, latitude: null, longitude: null };
}

export const individualRouter = router({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        taxonId: z.string().uuid().optional(),
        status: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.taxonId) conditions.push(eq(individuals.taxonId, input.taxonId));
      if (input.status) conditions.push(eq(individuals.status, input.status));

      const where =
        conditions.length > 0
          ? sql`${sql.join(
              conditions.map((c) => sql`(${c})`),
              sql` AND `,
            )}`
          : undefined;

      const results = await ctx.db
        .select()
        .from(individuals)
        .where(where)
        .limit(input.limit)
        .offset(input.offset);

      return results.map((r) => stripCoordinates(r, !!ctx.session));
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [individual] = await ctx.db
        .select()
        .from(individuals)
        .where(eq(individuals.id, input.id));

      if (!individual) return null;

      const history = await ctx.db
        .select()
        .from(observations)
        .where(eq(observations.individualId, input.id));

      return {
        ...stripCoordinates(individual, !!ctx.session),
        observations: history.map((o) => stripCoordinates(o, !!ctx.session)),
      };
    }),

  create: protectedProcedure.input(createIndividualSchema).mutation(async ({ ctx, input }) => {
    const [individual] = await ctx.db.insert(individuals).values(input).returning();
    return individual;
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), data: updateIndividualSchema }))
    .mutation(async ({ ctx, input }) => {
      const [individual] = await ctx.db
        .update(individuals)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(individuals.id, input.id))
        .returning();
      return individual;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(individuals).where(eq(individuals.id, input.id));
      return { success: true };
    }),
});
