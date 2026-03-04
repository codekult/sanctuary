import { z } from "zod";
import { eq, sql, gte, lte } from "drizzle-orm";
import { observations, media, phenologyEvents } from "@sanctuary/db/schema";
import { createObservationSchema, updateObservationSchema } from "@sanctuary/types";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";

function stripCoordinates<T extends { latitude: string | null; longitude: string | null }>(
  item: T,
  isAuthenticated: boolean,
): T {
  if (isAuthenticated) return item;
  return { ...item, latitude: null, longitude: null };
}

export const observationRouter = router({
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        taxonId: z.string().uuid().optional(),
        individualId: z.string().uuid().optional(),
        observerId: z.string().uuid().optional(),
        dateFrom: z.coerce.date().optional(),
        dateTo: z.coerce.date().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.taxonId) conditions.push(eq(observations.taxonId, input.taxonId));
      if (input.individualId) conditions.push(eq(observations.individualId, input.individualId));
      if (input.observerId) conditions.push(eq(observations.observerId, input.observerId));
      if (input.dateFrom) conditions.push(gte(observations.observedAt, input.dateFrom));
      if (input.dateTo) conditions.push(lte(observations.observedAt, input.dateTo));

      const where =
        conditions.length > 0
          ? sql`${sql.join(
              conditions.map((c) => sql`(${c})`),
              sql` AND `,
            )}`
          : undefined;

      const results = await ctx.db
        .select()
        .from(observations)
        .where(where)
        .limit(input.limit)
        .offset(input.offset);

      return results.map((r) => stripCoordinates(r, !!ctx.session));
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [observation] = await ctx.db
        .select()
        .from(observations)
        .where(eq(observations.id, input.id));

      if (!observation) return null;

      const mediaItems = await ctx.db.select().from(media).where(eq(media.observationId, input.id));

      const events = await ctx.db
        .select()
        .from(phenologyEvents)
        .where(eq(phenologyEvents.observationId, input.id));

      return {
        ...stripCoordinates(observation, !!ctx.session),
        media: mediaItems,
        phenologyEvents: events,
      };
    }),

  create: protectedProcedure.input(createObservationSchema).mutation(async ({ ctx, input }) => {
    const [observation] = await ctx.db.insert(observations).values(input).returning();
    return observation;
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), data: updateObservationSchema }))
    .mutation(async ({ ctx, input }) => {
      const [observation] = await ctx.db
        .update(observations)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(observations.id, input.id))
        .returning();
      return observation;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(observations).where(eq(observations.id, input.id));
      return { success: true };
    }),
});
