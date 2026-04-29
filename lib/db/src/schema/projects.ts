import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  doublePrecision,
} from "drizzle-orm/pg-core";

export const projectsTable = pgTable("projects", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull(),
  projectName: text("project_name").notNull(),
  projectType: text("project_type").notNull(),
  location: text("location"),
  areaSqm: doublePrecision("area_sqm").notNull(),
  designStyle: text("design_style").notNull(),
  scopeType: text("scope_type").notNull(),
  budget: doublePrecision("budget"),
  status: text("status").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }),
  expectedEndDate: timestamp("expected_end_date", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Project = typeof projectsTable.$inferSelect;
export type InsertProject = typeof projectsTable.$inferInsert;
