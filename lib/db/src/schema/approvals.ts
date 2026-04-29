import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

export const approvalsTable = pgTable("approvals", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  stageId: integer("stage_id").notNull(),
  requestedById: integer("requested_by_id").notNull(),
  approvedById: integer("approved_by_id"),
  status: text("status").notNull().default("pending"),
  clientComment: text("client_comment"),
  internalComment: text("internal_comment"),
  requestedAt: timestamp("requested_at", { withTimezone: true }).notNull().defaultNow(),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
});

export type Approval = typeof approvalsTable.$inferSelect;
export type InsertApproval = typeof approvalsTable.$inferInsert;
