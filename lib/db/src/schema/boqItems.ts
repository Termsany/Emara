import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  doublePrecision,
} from "drizzle-orm/pg-core";

export const boqItemsTable = pgTable("boq_items", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  category: text("category").notNull(),
  itemName: text("item_name").notNull(),
  description: text("description"),
  unit: text("unit").notNull(),
  quantity: doublePrecision("quantity").notNull(),
  unitPrice: doublePrecision("unit_price").notNull(),
  totalPrice: doublePrecision("total_price").notNull(),
  supplierName: text("supplier_name"),
  executionStage: text("execution_stage"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type BoqItem = typeof boqItemsTable.$inferSelect;
export type InsertBoqItem = typeof boqItemsTable.$inferInsert;
