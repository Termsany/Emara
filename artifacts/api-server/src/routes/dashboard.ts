import { Router, type IRouter } from "express";
import { alias } from "drizzle-orm/pg-core";
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  lt,
  ne,
  notInArray,
  sql,
  type SQL,
} from "drizzle-orm";
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
import { isClient } from "../lib/authz";

const router: IRouter = Router();

async function getClientProjectIds(clientId: number): Promise<number[]> {
  const rows = await db
    .select({ id: projectsTable.id })
    .from(projectsTable)
    .where(eq(projectsTable.clientId, clientId));
  return rows.map((r) => r.id);
}

router.get(
  "/dashboard/stats",
  requireAuth,
  async (req, res): Promise<void> => {
    const clientScope =
      isClient(req.user) && req.user!.clientId != null
        ? req.user!.clientId
        : null;
    const projectIds =
      clientScope != null ? await getClientProjectIds(clientScope) : null;

    if (projectIds && projectIds.length === 0) {
      res.json({
        totalClients: 0,
        activeProjects: 0,
        pendingApprovals: 0,
        pendingPayments: 0,
        totalQuoted: 0,
        totalPaid: 0,
        overdueStages: 0,
      });
      return;
    }

    const projectFilter = projectIds
      ? inArray(projectsTable.id, projectIds)
      : undefined;
    const stageProjectFilter = projectIds
      ? inArray(projectStagesTable.projectId, projectIds)
      : undefined;
    const approvalProjectFilter = projectIds
      ? inArray(approvalsTable.projectId, projectIds)
      : undefined;
    const paymentProjectFilter = projectIds
      ? inArray(paymentsTable.projectId, projectIds)
      : undefined;
    const quotationProjectFilter = projectIds
      ? inArray(quotationsTable.projectId, projectIds)
      : undefined;

    const [{ count: totalClients }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(clientsTable)
      .where(clientScope != null ? eq(clientsTable.id, clientScope) : (sql`true` as SQL));

    const [{ count: activeProjects }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(projectsTable)
      .where(
        and(
          notInArray(projectsTable.status, ["completed", "cancelled"]),
          projectFilter,
        ),
      );

    const [{ count: pendingApprovals }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(approvalsTable)
      .where(and(eq(approvalsTable.status, "pending"), approvalProjectFilter));

    const [{ count: pendingPayments }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(paymentsTable)
      .where(and(eq(paymentsTable.status, "pending"), paymentProjectFilter));

    const [{ sum: totalQuoted }] = await db
      .select({
        sum: sql<number>`cast(coalesce(sum(${quotationsTable.finalTotal}), 0) as float8)`,
      })
      .from(quotationsTable)
      .where(quotationProjectFilter);

    const [{ sum: totalPaid }] = await db
      .select({
        sum: sql<number>`cast(coalesce(sum(${paymentsTable.amount}), 0) as float8)`,
      })
      .from(paymentsTable)
      .where(and(eq(paymentsTable.status, "paid"), paymentProjectFilter));

    const now = new Date();
    const [{ count: overdueStages }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(projectStagesTable)
      .where(
        and(
          lt(projectStagesTable.dueDate, now),
          ne(projectStagesTable.status, "completed"),
          ne(projectStagesTable.status, "approved"),
          stageProjectFilter,
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
  async (req, res): Promise<void> => {
    const clientScope =
      isClient(req.user) && req.user!.clientId != null
        ? req.user!.clientId
        : null;
    const baseQuery = db
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
    const rows =
      clientScope != null
        ? await baseQuery.where(eq(projectsTable.clientId, clientScope))
        : await baseQuery;
    if (rows.length === 0) {
      res.json([]);
      return;
    }
    const projectIds = rows.map((r) => r.id);
    const stages = await db
      .select({
        projectId: projectStagesTable.projectId,
        status: projectStagesTable.status,
      })
      .from(projectStagesTable)
      .where(inArray(projectStagesTable.projectId, projectIds));
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
  async (req, res): Promise<void> => {
    const clientScope =
      isClient(req.user) && req.user!.clientId != null
        ? req.user!.clientId
        : null;
    const baseQuery = db
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
      .orderBy(desc(approvalsTable.requestedAt))
      .limit(10);
    const where =
      clientScope != null
        ? and(
            eq(approvalsTable.status, "pending"),
            eq(projectsTable.clientId, clientScope),
          )
        : eq(approvalsTable.status, "pending");
    const rows = await baseQuery.where(where);
    const filtered =
      clientScope != null
        ? rows.map((r) => ({ ...r, internalComment: null }))
        : rows;
    res.json(filtered);
  },
);

router.get(
  "/dashboard/upcoming-payments",
  requireAuth,
  async (req, res): Promise<void> => {
    const clientScope =
      isClient(req.user) && req.user!.clientId != null
        ? req.user!.clientId
        : null;
    const baseQuery = db
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
      .orderBy(asc(paymentsTable.dueDate))
      .limit(10);
    const where =
      clientScope != null
        ? and(
            eq(paymentsTable.status, "pending"),
            eq(projectsTable.clientId, clientScope),
          )
        : eq(paymentsTable.status, "pending");
    const rows = await baseQuery.where(where);
    res.json(rows);
  },
);

router.get(
  "/dashboard/overdue-stages",
  requireAuth,
  async (req, res): Promise<void> => {
    const clientScope =
      isClient(req.user) && req.user!.clientId != null
        ? req.user!.clientId
        : null;
    const now = new Date();
    const baseQuery = db
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
      .orderBy(asc(projectStagesTable.dueDate))
      .limit(10);
    const where =
      clientScope != null
        ? and(
            lt(projectStagesTable.dueDate, now),
            ne(projectStagesTable.status, "completed"),
            ne(projectStagesTable.status, "approved"),
            eq(projectsTable.clientId, clientScope),
          )
        : and(
            lt(projectStagesTable.dueDate, now),
            ne(projectStagesTable.status, "completed"),
            ne(projectStagesTable.status, "approved"),
          );
    const rows = await baseQuery.where(where);
    void boqItemsTable;
    res.json(rows);
  },
);

export default router;
