import { Router, type IRouter } from "express";
import { alias } from "drizzle-orm/pg-core";
import { desc, eq, sql } from "drizzle-orm";
import {
  db,
  approvalsTable,
  projectsTable,
  clientsTable,
  projectStagesTable,
  usersTable,
} from "@workspace/db";
import {
  ListProjectApprovalsParams,
  RequestApprovalBody,
  RequestApprovalParams,
  RespondToApprovalBody,
  RespondToApprovalParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { canAccessProject, isClient, isStaff, projectIdLookup, clientOwnsProject } from "../lib/authz";

const router: IRouter = Router();

const requesters = alias(usersTable, "requesters");

const approvalSelect = {
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
};

function approvalQuery() {
  return db
    .select(approvalSelect)
    .from(approvalsTable)
    .innerJoin(projectsTable, eq(projectsTable.id, approvalsTable.projectId))
    .innerJoin(clientsTable, eq(clientsTable.id, projectsTable.clientId))
    .innerJoin(
      projectStagesTable,
      eq(projectStagesTable.id, approvalsTable.stageId),
    )
    .innerJoin(requesters, eq(requesters.id, approvalsTable.requestedById));
}

router.get(
  "/projects/:projectId/approvals",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = ListProjectApprovalsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!(await canAccessProject(req.user!, params.data.projectId))) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
    const rows = await approvalQuery()
      .where(eq(approvalsTable.projectId, params.data.projectId))
      .orderBy(desc(approvalsTable.requestedAt));
    const filtered = isClient(req.user)
      ? rows.map((r) => ({ ...r, internalComment: null }))
      : rows;
    res.json(filtered);
  },
);

router.post(
  "/projects/:projectId/approvals",
  requireAuth,
  async (req, res): Promise<void> => {
    if (!isStaff(req.user)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const params = RequestApprovalParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = RequestApprovalBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [row] = await db
      .insert(approvalsTable)
      .values({
        projectId: params.data.projectId,
        stageId: parsed.data.stageId,
        requestedById: req.user!.id,
        status: "pending",
        internalComment: parsed.data.internalComment ?? null,
      })
      .returning();
    await db
      .update(projectStagesTable)
      .set({ status: "waiting_client_approval" })
      .where(eq(projectStagesTable.id, parsed.data.stageId));
    res.status(201).json(row);
  },
);

router.get("/approvals", requireAuth, async (req, res): Promise<void> => {
  const baseQuery = approvalQuery().orderBy(desc(approvalsTable.requestedAt));
  let rows;
  if (isClient(req.user) && req.user!.clientId != null) {
    rows = await baseQuery.where(eq(projectsTable.clientId, req.user!.clientId));
  } else {
    rows = await baseQuery;
  }
  const filtered = isClient(req.user)
    ? rows.map((r) => ({ ...r, internalComment: null }))
    : rows;
  res.json(filtered);
});

router.post(
  "/approvals/:id/respond",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = RespondToApprovalParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = RespondToApprovalBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const projectId = await projectIdLookup.approval(params.data.id);
    if (projectId == null) {
      res.status(404).json({ error: "Approval not found" });
      return;
    }
    if (isClient(req.user)) {
      if (!(await clientOwnsProject(req.user!, projectId))) {
        res.status(404).json({ error: "Approval not found" });
        return;
      }
    }
    const [updated] = await db
      .update(approvalsTable)
      .set({
        status: parsed.data.status,
        clientComment: parsed.data.clientComment ?? null,
        approvedById: req.user!.id,
        respondedAt: new Date(),
      })
      .where(eq(approvalsTable.id, params.data.id))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Approval not found" });
      return;
    }
    if (parsed.data.status === "approved") {
      await db
        .update(projectStagesTable)
        .set({ status: "approved", completedAt: new Date() })
        .where(eq(projectStagesTable.id, updated.stageId));
    } else if (parsed.data.status === "revision_required") {
      await db
        .update(projectStagesTable)
        .set({ status: "revision_required" })
        .where(eq(projectStagesTable.id, updated.stageId));
    } else if (parsed.data.status === "rejected") {
      await db
        .update(projectStagesTable)
        .set({ status: "revision_required" })
        .where(eq(projectStagesTable.id, updated.stageId));
    }
    const [row] = await approvalQuery().where(eq(approvalsTable.id, updated.id));
    const result = isClient(req.user)
      ? { ...row, internalComment: null }
      : row;
    res.json(result);
  },
);

void sql; // unused import guard
export default router;
