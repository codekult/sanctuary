import { pgTable, uuid, text, date, timestamp } from "drizzle-orm/pg-core";
import { individuals } from "./individual.js";
import { observations } from "./observation.js";
import { phenologyEventTypes } from "./phenology-event-type.js";

export const phenologyEvents = pgTable("phenology_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  individualId: uuid("individual_id").references(() => individuals.id),
  observationId: uuid("observation_id").references(() => observations.id),
  eventTypeId: uuid("event_type_id").notNull().references(() => phenologyEventTypes.id),
  observedAt: date("observed_at").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
