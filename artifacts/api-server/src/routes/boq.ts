import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import {
  db,
  boqItemsTable,
  projectsTable,
  clientsTable,
} from "@workspace/db";
import {
  CreateBoqItemBody,
  CreateBoqItemParams,
  DeleteBoqItemParams,
  ListProjectBoqParams,
  UpdateBoqItemBody,
  UpdateBoqItemParams,
} from "@workspace/api-zod";
import { requireAuth, requireRole } from "../lib/auth";

const router: IRouter = Router();
const staffOnly = requireRole("admin", "sales", "designer", "draftsman", "qs", "accountant");

router.get(
  "/projects/:projectId/boq",
  requireAuth,
  staffOnly,
  async (req, res): Promise<void> => {
    const params = ListProjectBoqParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const rows = await db
      .select()
      .from(boqItemsTable)
      .where(eq(boqItemsTable.projectId, params.data.projectId))
      .orderBy(desc(boqItemsTable.createdAt));
    res.json(rows);
  },
);

router.post(
  "/projects/:projectId/boq",
  requireAuth,
  requireRole("admin", "qs"),
  async (req, res): Promise<void> => {
    const params = CreateBoqItemParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = CreateBoqItemBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const totalPrice = parsed.data.quantity * parsed.data.unitPrice;
    const [row] = await db
      .insert(boqItemsTable)
      .values({
        projectId: params.data.projectId,
        category: parsed.data.category,
        itemName: parsed.data.itemName,
        description: parsed.data.description ?? null,
        unit: parsed.data.unit,
        quantity: parsed.data.quantity,
        unitPrice: parsed.data.unitPrice,
        totalPrice,
        supplierName: parsed.data.supplierName ?? null,
        executionStage: parsed.data.executionStage ?? null,
        notes: parsed.data.notes ?? null,
      })
      .returning();
    res.status(201).json(row);
  },
);

router.get("/boq", requireAuth, staffOnly, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: boqItemsTable.id,
      projectId: boqItemsTable.projectId,
      category: boqItemsTable.category,
      itemName: boqItemsTable.itemName,
      description: boqItemsTable.description,
      unit: boqItemsTable.unit,
      quantity: boqItemsTable.quantity,
      unitPrice: boqItemsTable.unitPrice,
      totalPrice: boqItemsTable.totalPrice,
      supplierName: boqItemsTable.supplierName,
      executionStage: boqItemsTable.executionStage,
      notes: boqItemsTable.notes,
      createdAt: boqItemsTable.createdAt,
      projectName: projectsTable.projectName,
      clientName: clientsTable.name,
    })
    .from(boqItemsTable)
    .innerJoin(projectsTable, eq(projectsTable.id, boqItemsTable.projectId))
    .innerJoin(clientsTable, eq(clientsTable.id, projectsTable.clientId))
    .orderBy(desc(boqItemsTable.createdAt));
  res.json(rows);
});

router.patch(
  "/boq-items/:id",
  requireAuth,
  requireRole("admin", "qs"),
  async (req, res): Promise<void> => {
    const params = UpdateBoqItemParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = UpdateBoqItemBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [existing] = await db
      .select()
      .from(boqItemsTable)
      .where(eq(boqItemsTable.id, params.data.id))
      .limit(1);
    if (!existing) {
      res.status(404).json({ error: "BOQ item not found" });
      return;
    }
    const quantity = parsed.data.quantity ?? existing.quantity;
    const unitPrice = parsed.data.unitPrice ?? existing.unitPrice;
    const update: Record<string, unknown> = {
      ...parsed.data,
      totalPrice: quantity * unitPrice,
    };
    const [row] = await db
      .update(boqItemsTable)
      .set(update)
      .where(eq(boqItemsTable.id, params.data.id))
      .returning();
    res.json(row);
  },
);

router.delete(
  "/boq-items/:id",
  requireAuth,
  requireRole("admin", "qs"),
  async (req, res): Promise<void> => {
    const params = DeleteBoqItemParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    await db.delete(boqItemsTable).where(eq(boqItemsTable.id, params.data.id));
    res.sendStatus(204);
  },
);

export default router;
