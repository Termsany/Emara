import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, projectStagesTable, usersTable } from "@workspace/db";
import {
  ListProjectStagesParams,
  UpdateStageBody,
  UpdateStageParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { canAccessProject, isStaff, projectIdLookup } from "../lib/authz";

const router: IRouter = Router();

router.get(
  "/projects/:projectId/stages",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = ListProjectStagesParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!(await canAccessProject(req.user!, params.data.projectId))) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
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
      })
      .from(projectStagesTable)
      .leftJoin(usersTable, eq(usersTable.id, projectStagesTable.assignedToId))
      .where(eq(projectStagesTable.projectId, params.data.projectId))
      .orderBy(asc(projectStagesTable.order));
    res.json(rows);
  },
);

router.patch(
  "/stages/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    if (!isStaff(req.user)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    const params = UpdateStageParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const projectId = await projectIdLookup.stage(params.data.id);
    if (projectId == null) {
      res.status(404).json({ error: "Stage not found" });
      return;
    }
    const parsed = UpdateStageBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const update: Record<string, unknown> = { ...parsed.data };
    if (
      parsed.data.status === "completed" ||
      parsed.data.status === "approved"
    ) {
      update.completedAt = new Date();
    }
    const [row] = await db
      .update(projectStagesTable)
      .set(update)
      .where(eq(projectStagesTable.id, params.data.id))
      .returning();
    if (!row) {
      res.status(404).json({ error: "Stage not found" });
      return;
    }
    const [withName] = await db
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
      })
      .from(projectStagesTable)
      .leftJoin(usersTable, eq(usersTable.id, projectStagesTable.assignedToId))
      .where(eq(projectStagesTable.id, row.id))
      .limit(1);
    res.json(withName);
  },
);

export default router;
