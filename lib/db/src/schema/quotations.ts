import {
  pgTable,
  text,
  serial,
  timestamp,
  integer,
  doublePrecision,
} from "drizzle-orm/pg-core";

export const quotationsTable = pgTable("quotations", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().unique(),
  areaSqm: doublePrecision("area_sqm").notNull(),
  pricePerSqm: doublePrecision("price_per_sqm").notNull(),
  designSubtotal: doublePrecision("design_subtotal").notNull(),
  shopDrawingPrice: doublePrecision("shop_drawing_price").notNull().default(0),
  supervisionPrice: doublePrecision("supervision_price").notNull().default(0),
  discount: doublePrecision("discount").notNull().default(0),
  tax: doublePrecision("tax").notNull().default(0),
  finalTotal: doublePrecision("final_total").notNull(),
  status: text("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Quotation = typeof quotationsTable.$inferSelect;
export type InsertQuotation = typeof quotationsTable.$inferInsert;
