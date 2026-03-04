import { z } from "zod";
import { individualStatusEnum, sexEnum } from "../enums.js";

export const individualSchema = z.object({
  id: z.string().uuid(),
  taxonId: z.string().uuid(),
  nickname: z.string().nullable(),
  descriptionEn: z.string().nullable(),
  descriptionEs: z.string().nullable(),
  latitude: z.string().nullable(),
  longitude: z.string().nullable(),
  firstObservedDate: z.string().nullable(),
  status: individualStatusEnum,
  sex: sexEnum.nullable(),
  markers: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Individual = z.infer<typeof individualSchema>;

export const createIndividualSchema = individualSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateIndividual = z.infer<typeof createIndividualSchema>;

export const updateIndividualSchema = createIndividualSchema.partial();
export type UpdateIndividual = z.infer<typeof updateIndividualSchema>;
