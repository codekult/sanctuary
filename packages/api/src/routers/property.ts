import { eq } from "drizzle-orm";
import { z } from "zod";
import { properties } from "@sanctuary/db/schema";
import { updatePropertySchema } from "@sanctuary/types";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";

export const propertyRouter = router({
  get: publicProcedure.query(async ({ ctx }) => {
    const [property] = await ctx.db.select().from(properties).limit(1);
    return property ?? null;
  }),

  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), data: updatePropertySchema }))
    .mutation(async ({ ctx, input }) => {
      const [property] = await ctx.db
        .update(properties)
        .set({ ...input.data, updatedAt: new Date() })
        .where(eq(properties.id, input.id))
        .returning();
      return property;
    }),
});
