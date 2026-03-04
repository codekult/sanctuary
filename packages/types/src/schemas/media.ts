import { z } from "zod";
import { mediaTypeEnum } from "../enums.js";

export const mediaSchema = z.object({
  id: z.string().uuid(),
  observationId: z.string().uuid().nullable(),
  individualId: z.string().uuid().nullable(),
  url: z.string().url(),
  thumbnailUrl: z.string().url().nullable(),
  type: mediaTypeEnum,
  captionEn: z.string().nullable(),
  captionEs: z.string().nullable(),
  takenAt: z.coerce.date().nullable(),
  sortOrder: z.number().int(),
  createdAt: z.coerce.date(),
});

export type Media = z.infer<typeof mediaSchema>;

export const createMediaSchema = mediaSchema.omit({
  id: true,
  createdAt: true,
});

export type CreateMedia = z.infer<typeof createMediaSchema>;
