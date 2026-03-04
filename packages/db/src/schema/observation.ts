import { pgTable, uuid, text, numeric, integer, timestamp } from "drizzle-orm/pg-core";
import { taxa } from "./taxon.js";
import { individuals } from "./individual.js";
import { users } from "./user.js";

export const observations = pgTable("observations", {
  id: uuid("id").primaryKey().defaultRandom(),
  taxonId: uuid("taxon_id").notNull().references(() => taxa.id),
  individualId: uuid("individual_id").references(() => individuals.id),
  observerId: uuid("observer_id").notNull().references(() => users.id),
  observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  coordinateAccuracy: integer("coordinate_accuracy"),
  description: text("description"),
  individualCount: integer("individual_count"),
  lifeStage: text("life_stage"),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
