import { pgTable, uuid, text, integer, timestamp } from "drizzle-orm/pg-core";
import { observations } from "./observation.js";
import { individuals } from "./individual.js";

export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  observationId: uuid("observation_id").references(() => observations.id),
  individualId: uuid("individual_id").references(() => individuals.id),
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  type: text("type").notNull().default("image"),
  captionEn: text("caption_en"),
  captionEs: text("caption_es"),
  takenAt: timestamp("taken_at", { withTimezone: true }),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
