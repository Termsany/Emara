import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, quotationsTable } from "@workspace/db";
import {
  GetProjectQuotationParams,
  UpsertProjectQuotationBody,
  UpsertProjectQuotationParams,
  UpdateQuotationStatusBody,
  UpdateQuotationStatusParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

function calcTotals(input: {
  areaSqm: number;
  pricePerSqm: number;
  shopDrawingPrice: number;
  supervisionPrice: number;
  discount: number;
  tax: number;
}) {
  const designSubtotal = input.areaSqm * input.pricePerSqm;
  const subtotal =
    designSubtotal +
    input.shopDrawingPrice +
    input.supervisionPrice -
    input.discount;
  const finalTotal = subtotal + input.tax;
  return { designSubtotal, finalTotal };
}

router.get(
  "/projects/:projectId/quotation",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = GetProjectQuotationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const [row] = await db
      .select()
      .from(quotationsTable)
      .where(eq(quotationsTable.projectId, params.data.projectId))
      .limit(1);
    res.json(row ?? null);
  },
);

router.put(
  "/projects/:projectId/quotation",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = UpsertProjectQuotationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = UpsertProjectQuotationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const totals = calcTotals(parsed.data);
    const [existing] = await db
      .select()
      .from(quotationsTable)
      .where(eq(quotationsTable.projectId, params.data.projectId))
      .limit(1);
    let row;
    if (existing) {
      [row] = await db
        .update(quotationsTable)
        .set({
          areaSqm: parsed.data.areaSqm,
          pricePerSqm: parsed.data.pricePerSqm,
          shopDrawingPrice: parsed.data.shopDrawingPrice,
          supervisionPrice: parsed.data.supervisionPrice,
          discount: parsed.data.discount,
          tax: parsed.data.tax,
          designSubtotal: totals.designSubtotal,
          finalTotal: totals.finalTotal,
        })
        .where(eq(quotationsTable.projectId, params.data.projectId))
        .returning();
    } else {
      [row] = await db
        .insert(quotationsTable)
        .values({
          projectId: params.data.projectId,
          areaSqm: parsed.data.areaSqm,
          pricePerSqm: parsed.data.pricePerSqm,
          shopDrawingPrice: parsed.data.shopDrawingPrice,
          supervisionPrice: parsed.data.supervisionPrice,
          discount: parsed.data.discount,
          tax: parsed.data.tax,
          designSubtotal: totals.designSubtotal,
          finalTotal: totals.finalTotal,
          status: "draft",
        })
        .returning();
    }
    res.json(row);
  },
);

router.patch(
  "/quotations/:id/status",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = UpdateQuotationStatusParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = UpdateQuotationStatusBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [row] = await db
      .update(quotationsTable)
      .set({ status: parsed.data.status })
      .where(eq(quotationsTable.id, params.data.id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Quotation not found" });
      return;
    }
    res.json(row);
  },
);

export default router;
