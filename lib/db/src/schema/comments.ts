import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

export const commentsTable = pgTable("comments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  stageId: integer("stage_id"),
  approvalId: integer("approval_id"),
  userId: integer("user_id").notNull(),
  commentText: text("comment_text").notNull(),
  isInternal: boolean("is_internal").notNull().default(false),
  revisionNumber: integer("revision_number"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Comment = typeof commentsTable.$inferSelect;
export type InsertComment = typeof commentsTable.$inferInsert;
