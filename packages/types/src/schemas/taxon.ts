import { z } from "zod";
import { taxonRankEnum, kingdomEnum } from "../enums.js";

export const taxonSchema = z.object({
  id: z.string().uuid(),
  scientificName: z.string().min(1),
  commonNameEn: z.string().nullable(),
  commonNameEs: z.string().nullable(),
  taxonRank: taxonRankEnum,
  kingdom: kingdomEnum,
  phylum: z.string().nullable(),
  class: z.string().nullable(),
  order: z.string().nullable(),
  family: z.string().nullable(),
  genus: z.string().nullable(),
  specificEpithet: z.string().nullable(),
  externalId: z.string().nullable(),
  externalSource: z.string().nullable(),
  descriptionEn: z.string().nullable(),
  descriptionEs: z.string().nullable(),
  conservationStatus: z.string().nullable(),
  thumbnailUrl: z.string().url().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Taxon = z.infer<typeof taxonSchema>;

export const createTaxonSchema = taxonSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateTaxon = z.infer<typeof createTaxonSchema>;

export const updateTaxonSchema = createTaxonSchema.partial();
export type UpdateTaxon = z.infer<typeof updateTaxonSchema>;
