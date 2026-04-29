import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

export const projectStagesTable = pgTable("project_stages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  stageName: text("stage_name").notNull(),
  stageKey: text("stage_key").notNull(),
  order: integer("order").notNull(),
  status: text("status").notNull().default("not_started"),
  assignedToId: integer("assigned_to_id"),
  startDate: timestamp("start_date", { withTimezone: true }),
  dueDate: timestamp("due_date", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  requiresClientApproval: boolean("requires_client_approval").notNull().default(false),
  notes: text("notes"),
});

export type ProjectStage = typeof projectStagesTable.$inferSelect;
export type InsertProjectStage = typeof projectStagesTable.$inferInsert;
