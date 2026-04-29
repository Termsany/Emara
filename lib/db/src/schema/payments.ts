import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  doublePrecision,
} from "drizzle-orm/pg-core";

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  title: text("title").notNull(),
  amount: doublePrecision("amount").notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }),
  paidDate: timestamp("paid_date", { withTimezone: true }),
  status: text("status").notNull().default("pending"),
  paymentType: text("payment_type").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Payment = typeof paymentsTable.$inferSelect;
export type InsertPayment = typeof paymentsTable.$inferInsert;
