import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { media } from "@sanctuary/db/schema";
import { createMediaSchema } from "@sanctuary/types";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";

export const mediaRouter = router({
  list: publicProcedure
    .input(
      z.object({
        observationId: z.string().uuid().optional(),
        individualId: z.string().uuid().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.observationId)
        conditions.push(eq(media.observationId, input.observationId));
      if (input.individualId)
        conditions.push(eq(media.individualId, input.individualId));

      const where = conditions.length > 0
        ? sql`${sql.join(conditions.map((c) => sql`(${c})`), sql` AND `)}`
        : undefined;

      return ctx.db.select().from(media).where(where);
    }),

  create: protectedProcedure
    .input(createMediaSchema)
    .mutation(async ({ ctx, input }) => {
      const [item] = await ctx.db.insert(media).values(input).returning();
      return item;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(media).where(eq(media.id, input.id));
      return { success: true };
    }),

  reorder: protectedProcedure
    .input(
      z.object({
        items: z.array(
          z.object({ id: z.string().uuid(), sortOrder: z.number().int() }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      for (const item of input.items) {
        await ctx.db
          .update(media)
          .set({ sortOrder: item.sortOrder })
          .where(eq(media.id, item.id));
      }
      return { success: true };
    }),
});
