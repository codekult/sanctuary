import { z } from "zod";
import { phenologyAppliesToEnum } from "../enums.js";

export const phenologyEventTypeSchema = z.object({
  id: z.string().uuid(),
  nameEn: z.string().min(1),
  nameEs: z.string().nullable(),
  appliesTo: phenologyAppliesToEnum.nullable(),
  color: z.string().nullable(),
  icon: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export type PhenologyEventType = z.infer<typeof phenologyEventTypeSchema>;

export const createPhenologyEventTypeSchema = phenologyEventTypeSchema.omit({
  id: true,
  createdAt: true,
});

export type CreatePhenologyEventType = z.infer<typeof createPhenologyEventTypeSchema>;

export const updatePhenologyEventTypeSchema = createPhenologyEventTypeSchema.partial();
export type UpdatePhenologyEventType = z.infer<typeof updatePhenologyEventTypeSchema>;

export const phenologyEventSchema = z.object({
  id: z.string().uuid(),
  individualId: z.string().uuid().nullable(),
  observationId: z.string().uuid().nullable(),
  eventTypeId: z.string().uuid(),
  observedAt: z.string(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
});

export type PhenologyEvent = z.infer<typeof phenologyEventSchema>;

export const createPhenologyEventSchema = phenologyEventSchema.omit({
  id: true,
  createdAt: true,
});

export type CreatePhenologyEvent = z.infer<typeof createPhenologyEventSchema>;
