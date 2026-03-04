import { z } from "zod";

export const taxonRankEnum = z.enum([
  "kingdom",
  "phylum",
  "class",
  "order",
  "family",
  "genus",
  "species",
  "subspecies",
  "variety",
]);
export type TaxonRank = z.infer<typeof taxonRankEnum>;

export const individualStatusEnum = z.enum(["alive", "dead", "unknown", "removed"]);
export type IndividualStatus = z.infer<typeof individualStatusEnum>;

export const sexEnum = z.enum(["male", "female", "unknown"]);
export type Sex = z.infer<typeof sexEnum>;

export const lifeStageEnum = z.enum(["egg", "larva", "juvenile", "adult", "unknown"]);
export type LifeStage = z.infer<typeof lifeStageEnum>;

export const observationStatusEnum = z.enum(["draft", "published"]);
export type ObservationStatus = z.infer<typeof observationStatusEnum>;

export const mediaTypeEnum = z.enum(["image", "audio", "video"]);
export type MediaType = z.infer<typeof mediaTypeEnum>;

export const userRoleEnum = z.enum(["admin", "contributor"]);
export type UserRole = z.infer<typeof userRoleEnum>;

export const phenologyAppliesToEnum = z.enum(["all", "animalia", "plantae", "fungi"]);
export type PhenologyAppliesTo = z.infer<typeof phenologyAppliesToEnum>;
