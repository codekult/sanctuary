import { z } from "zod";

export const propertySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  descriptionEn: z.string().nullable(),
  descriptionEs: z.string().nullable(),
  latitude: z.string(),
  longitude: z.string(),
  timezone: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Property = z.infer<typeof propertySchema>;

export const updatePropertySchema = propertySchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

export type UpdateProperty = z.infer<typeof updatePropertySchema>;
