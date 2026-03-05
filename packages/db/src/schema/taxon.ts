import { pgTable, uuid, text, timestamp, index, uniqueIndex } from "drizzle-orm/pg-core";

export const taxa = pgTable(
  "taxa",
  {
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
  },
  (table) => [
    index("taxa_kingdom_idx").on(table.kingdom),
    index("taxa_taxon_rank_idx").on(table.taxonRank),
    index("taxa_scientific_name_idx").on(table.scientificName),
    uniqueIndex("taxa_external_id_source_idx").on(table.externalId, table.externalSource),
  ],
);
