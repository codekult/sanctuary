import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const taxa = pgTable("taxa", {
  id: uuid("id").primaryKey().defaultRandom(),
  scientificName: text("scientific_name").notNull(),
  commonNameEn: text("common_name_en"),
  commonNameEs: text("common_name_es"),
  taxonRank: text("taxon_rank").notNull(),
  kingdom: text("kingdom").notNull(),
  phylum: text("phylum"),
  class: text("class"),
  order: text("order"),
  family: text("family"),
  genus: text("genus"),
  specificEpithet: text("specific_epithet"),
  externalId: text("external_id"),
  externalSource: text("external_source"),
  descriptionEn: text("description_en"),
  descriptionEs: text("description_es"),
  conservationStatus: text("conservation_status"),
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
