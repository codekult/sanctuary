import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { phenologyEvents, phenologyEventTypes } from "@sanctuary/db/schema";
import {
  createPhenologyEventSchema,
  createPhenologyEventTypeSchema,
  updatePhenologyEventTypeSchema,
} from "@sanctuary/types";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";

export const phenologyRouter = router({
  listEvents: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
        individualId: z.string().uuid().optional(),
        eventTypeId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.individualId) conditions.push(eq(phenologyEvents.individualId, input.individualId));
      if (input.eventTypeId) conditions.push(eq(phenologyEvents.eventTypeId, input.eventTypeId));

      const where =
        conditions.length > 0
          ? sql`${sql.join(
              conditions.map((c) => sql`(${c})`),
              sql` AND `,
            )}`
          : undefined;

      return ctx.db
        .select()
        .from(phenologyEvents)
        .where(where)
        .limit(input.limit)
        .offset(input.offset);
    }),

  createEvent: protectedProcedure
    .input(createPhenologyEventSchema)
    .mutation(async ({ ctx, input }) => {
      const [event] = await ctx.db.insert(phenologyEvents).values(input).returning();
      return event;
    }),

  listEventTypes: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.select().from(phenologyEventTypes);
  }),

  createEventType: protectedProcedure
    .input(createPhenologyEventTypeSchema)
    .mutation(async ({ ctx, input }) => {
      const [eventType] = await ctx.db.insert(phenologyEventTypes).values(input).returning();
      return eventType;
    }),

  updateEventType: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: updatePhenologyEventTypeSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [eventType] = await ctx.db
        .update(phenologyEventTypes)
        .set(input.data)
        .where(eq(phenologyEventTypes.id, input.id))
        .returning();
      return eventType;
    }),
});
