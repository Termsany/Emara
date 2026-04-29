import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import {
  db,
  paymentsTable,
  projectsTable,
  clientsTable,
} from "@workspace/db";
import {
  CreatePaymentBody,
  CreatePaymentParams,
  DeletePaymentParams,
  ListProjectPaymentsParams,
  UpdatePaymentBody,
  UpdatePaymentParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get(
  "/projects/:projectId/payments",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = ListProjectPaymentsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const rows = await db
      .select()
      .from(paymentsTable)
      .where(eq(paymentsTable.projectId, params.data.projectId))
      .orderBy(desc(paymentsTable.createdAt));
    res.json(rows);
  },
);

router.post(
  "/projects/:projectId/payments",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = CreatePaymentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = CreatePaymentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [row] = await db
      .insert(paymentsTable)
      .values({
        projectId: params.data.projectId,
        title: parsed.data.title,
        amount: parsed.data.amount,
        dueDate: parsed.data.dueDate ?? null,
        paymentType: parsed.data.paymentType,
        status: "pending",
        notes: parsed.data.notes ?? null,
      })
      .returning();
    res.status(201).json(row);
  },
);

router.get("/payments", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: paymentsTable.id,
      projectId: paymentsTable.projectId,
      title: paymentsTable.title,
      amount: paymentsTable.amount,
      dueDate: paymentsTable.dueDate,
      paidDate: paymentsTable.paidDate,
      status: paymentsTable.status,
      paymentType: paymentsTable.paymentType,
      notes: paymentsTable.notes,
      createdAt: paymentsTable.createdAt,
      projectName: projectsTable.projectName,
      clientName: clientsTable.name,
    })
    .from(paymentsTable)
    .innerJoin(projectsTable, eq(projectsTable.id, paymentsTable.projectId))
    .innerJoin(clientsTable, eq(clientsTable.id, projectsTable.clientId))
    .orderBy(desc(paymentsTable.createdAt));
  res.json(rows);
});

router.patch(
  "/payments/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = UpdatePaymentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = UpdatePaymentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const update: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.status === "paid" && !parsed.data.paidDate) {
      update.paidDate = new Date();
    }
    const [row] = await db
      .update(paymentsTable)
      .set(update)
      .where(eq(paymentsTable.id, params.data.id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }
    res.json(row);
  },
);

router.delete(
  "/payments/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = DeletePaymentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    await db.delete(paymentsTable).where(eq(paymentsTable.id, params.data.id));
    res.sendStatus(204);
  },
);

export default router;
