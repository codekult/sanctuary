import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const phenologyEventTypes = pgTable("phenology_event_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameEn: text("name_en").notNull(),
  nameEs: text("name_es"),
  appliesTo: text("applies_to"),
  color: text("color"),
  icon: text("icon"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
