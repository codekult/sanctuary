import { pgTable, uuid, text, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { taxa } from "./taxon.js";

export const individuals = pgTable("individuals", {
  id: uuid("id").primaryKey().defaultRandom(),
  taxonId: uuid("taxon_id").notNull().references(() => taxa.id),
  nickname: text("nickname"),
  descriptionEn: text("description_en"),
  descriptionEs: text("description_es"),
  latitude: numeric("latitude", { precision: 10, scale: 7 }),
  longitude: numeric("longitude", { precision: 10, scale: 7 }),
  firstObservedDate: date("first_observed_date"),
  status: text("status").notNull().default("alive"),
  sex: text("sex"),
  markers: text("markers"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
