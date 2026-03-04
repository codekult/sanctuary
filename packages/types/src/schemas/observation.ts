import { z } from "zod";
import { lifeStageEnum, observationStatusEnum } from "../enums.js";

export const observationSchema = z.object({
  id: z.string().uuid(),
  taxonId: z.string().uuid(),
  individualId: z.string().uuid().nullable(),
  observerId: z.string().uuid(),
  observedAt: z.coerce.date(),
  latitude: z.string().nullable(),
  longitude: z.string().nullable(),
  coordinateAccuracy: z.number().int().nullable(),
  description: z.string().nullable(),
  individualCount: z.number().int().nullable(),
  lifeStage: lifeStageEnum.nullable(),
  status: observationStatusEnum,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Observation = z.infer<typeof observationSchema>;

export const createObservationSchema = observationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateObservation = z.infer<typeof createObservationSchema>;

export const updateObservationSchema = createObservationSchema.partial();
export type UpdateObservation = z.infer<typeof updateObservationSchema>;
