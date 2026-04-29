import { Router, type IRouter } from "express";
import { alias } from "drizzle-orm/pg-core";
import { and, asc, desc, eq, lt, ne, notInArray, sql } from "drizzle-orm";
import {
  db,
  approvalsTable,
  boqItemsTable,
  clientsTable,
  paymentsTable,
  projectStagesTable,
  projectsTable,
  quotationsTable,
  usersTable,
} from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get(
  "/dashboard/stats",
  requireAuth,
  async (_req, res): Promise<void> => {
    const [{ count: totalClients }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(clientsTable);
    const [{ count: activeProjects }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(projectsTable)
      .where(notInArray(projectsTable.status, ["completed", "cancelled"]));
    const [{ count: pendingApprovals }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(approvalsTable)
      .where(eq(approvalsTable.status, "pending"));
    const [{ count: pendingPayments }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(paymentsTable)
      .where(eq(paymentsTable.status, "pending"));
    const [{ sum: totalQuoted }] = await db
      .select({
        sum: sql<number>`cast(coalesce(sum(${quotationsTable.finalTotal}), 0) as float8)`,
      })
      .from(quotationsTable);
    const [{ sum: totalPaid }] = await db
      .select({
        sum: sql<number>`cast(coalesce(sum(${paymentsTable.amount}), 0) as float8)`,
      })
      .from(paymentsTable)
      .where(eq(paymentsTable.status, "paid"));
    const now = new Date();
    const [{ count: overdueStages }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(projectStagesTable)
      .where(
        and(
          lt(projectStagesTable.dueDate, now),
          ne(projectStagesTable.status, "completed"),
          ne(projectStagesTable.status, "approved"),
        ),
      );
    res.json({
      totalClients,
      activeProjects,
      pendingApprovals,
      pendingPayments,
      totalQuoted,
      totalPaid,
      overdueStages,
    });
  },
);

router.get(
  "/dashboard/recent-projects",
  requireAuth,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select({
        id: projectsTable.id,
        clientId: projectsTable.clientId,
        projectName: projectsTable.projectName,
        projectType: projectsTable.projectType,
        location: projectsTable.location,
        areaSqm: projectsTable.areaSqm,
        designStyle: projectsTable.designStyle,
        scopeType: projectsTable.scopeType,
        budget: projectsTable.budget,
        status: projectsTable.status,
        startDate: projectsTable.startDate,
        expectedEndDate: projectsTable.expectedEndDate,
        notes: projectsTable.notes,
        createdAt: projectsTable.createdAt,
        clientName: clientsTable.name,
      })
      .from(projectsTable)
      .innerJoin(clientsTable, eq(clientsTable.id, projectsTable.clientId))
      .orderBy(desc(projectsTable.createdAt))
      .limit(8);
    if (rows.length === 0) {
      res.json([]);
      return;
    }
    const stages = await db
      .select({
        projectId: projectStagesTable.projectId,
        status: projectStagesTable.status,
      })
      .from(projectStagesTable);
    const counts = new Map<number, { total: number; done: number }>();
    for (const s of stages) {
      const c = counts.get(s.projectId) ?? { total: 0, done: 0 };
      c.total += 1;
      if (s.status === "completed" || s.status === "approved") c.done += 1;
      counts.set(s.projectId, c);
    }
    res.json(
      rows.map((r) => {
        const c = counts.get(r.id) ?? { total: 0, done: 0 };
        return {
          ...r,
          progressPercent:
            c.total > 0 ? Math.round((c.done / c.total) * 100) : 0,
        };
      }),
    );
  },
);

const requesters = alias(usersTable, "requesters");

router.get(
  "/dashboard/pending-approvals",
  requireAuth,
  async (_req, res): Promise<void> => {
    const rows = await db
      .select({
        id: approvalsTable.id,
        projectId: approvalsTable.projectId,
        projectName: projectsTable.projectName,
        clientName: clientsTable.name,
        stageId: approvalsTable.stageId,
        stageName: projectStagesTable.stageName,
        requestedById: approvalsTable.requestedById,
        requestedByName: requesters.name,
        approvedById: approvalsTable.approvedById,
        status: approvalsTable.status,
        clientComment: approvalsTable.clientComment,
        internalComment: approvalsTable.internalComment,
        requestedAt: approvalsTable.requestedAt,
        respondedAt: approvalsTable.respondedAt,
      })
      .from(approvalsTable)
      .innerJoin(projectsTable, eq(projectsTable.id, approvalsTable.projectId))
      .innerJoin(clientsTable, eq(clientsTable.id, projectsTable.clientId))
      .innerJoin(
        projectStagesTable,
        eq(projectStagesTable.id, approvalsTable.stageId),
      )
      .innerJoin(requesters, eq(requesters.id, approvalsTable.requestedById))
      .where(eq(approvalsTable.status, "pending"))
      .orderBy(desc(approvalsTable.requestedAt))
      .limit(10);
    res.json(rows);
  },
);

router.get(
  "/dashboard/upcoming-payments",
  requireAuth,
  async (_req, res): Promise<void> => {
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
      .where(eq(paymentsTable.status, "pending"))
      .orderBy(asc(paymentsTable.dueDate))
      .limit(10);
    res.json(rows);
  },
);

router.get(
  "/dashboard/overdue-stages",
  requireAuth,
  async (_req, res): Promise<void> => {
    const now = new Date();
    const rows = await db
      .select({
        id: projectStagesTable.id,
        projectId: projectStagesTable.projectId,
        stageName: projectStagesTable.stageName,
        stageKey: projectStagesTable.stageKey,
        order: projectStagesTable.order,
        status: projectStagesTable.status,
        assignedToId: projectStagesTable.assignedToId,
        startDate: projectStagesTable.startDate,
        dueDate: projectStagesTable.dueDate,
        completedAt: projectStagesTable.completedAt,
        requiresClientApproval: projectStagesTable.requiresClientApproval,
        notes: projectStagesTable.notes,
        assignedToName: usersTable.name,
        projectName: projectsTable.projectName,
        clientName: clientsTable.name,
      })
      .from(projectStagesTable)
      .innerJoin(
        projectsTable,
        eq(projectsTable.id, projectStagesTable.projectId),
      )
      .innerJoin(clientsTable, eq(clientsTable.id, projectsTable.clientId))
      .leftJoin(usersTable, eq(usersTable.id, projectStagesTable.assignedToId))
      .where(
        and(
          lt(projectStagesTable.dueDate, now),
          ne(projectStagesTable.status, "completed"),
          ne(projectStagesTable.status, "approved"),
        ),
      )
      .orderBy(asc(projectStagesTable.dueDate))
      .limit(10);
    // boqItemsTable not needed; appease tsc
    void boqItemsTable;
    res.json(rows);
  },
);

export default router;
