import { Router, type IRouter } from "express";
import { and, eq, sql, inArray } from "drizzle-orm";
import {
  db,
  projectsTable,
  clientsTable,
  projectStagesTable,
} from "@workspace/db";
import {
  CreateProjectBody,
  GetProjectParams,
  UpdateProjectBody,
  UpdateProjectParams,
  DeleteProjectParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { DEFAULT_STAGES } from "../lib/stages";

const router: IRouter = Router();

async function clientFilterIds(req: Express.Request): Promise<number[] | null> {
  if (req.user?.role === "client" && req.user.clientId != null) {
    return [req.user.clientId];
  }
  return null;
}

router.get("/projects", requireAuth, async (req, res): Promise<void> => {
  const filter = await clientFilterIds(req);
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
    .orderBy(sql`${projectsTable.createdAt} DESC`);
  const rows = filter
    ? await baseQuery.where(inArray(projectsTable.clientId, filter))
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
        progressPercent: c.total > 0 ? Math.round((c.done / c.total) * 100) : 0,
      };
    }),
  );
});

router.post("/projects", requireAuth, async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [project] = await db
    .insert(projectsTable)
    .values({
      clientId: parsed.data.clientId,
      projectName: parsed.data.projectName,
      projectType: parsed.data.projectType,
      location: parsed.data.location ?? null,
      areaSqm: parsed.data.areaSqm,
      designStyle: parsed.data.designStyle,
      scopeType: parsed.data.scopeType,
      budget: parsed.data.budget ?? null,
      status: parsed.data.status,
      startDate: parsed.data.startDate ?? null,
      expectedEndDate: parsed.data.expectedEndDate ?? null,
      notes: parsed.data.notes ?? null,
    })
    .returning();
  await db.insert(projectStagesTable).values(
    DEFAULT_STAGES.map((s) => ({
      projectId: project.id,
      stageName: s.name,
      stageKey: s.key,
      order: s.order,
      status: "not_started",
      requiresClientApproval: s.requiresClientApproval,
    })),
  );
  res.status(201).json(project);
});

router.get("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const filter = await clientFilterIds(req);
  const where = filter
    ? and(
        eq(projectsTable.id, params.data.id),
        inArray(projectsTable.clientId, filter),
      )
    : eq(projectsTable.id, params.data.id);
  const [row] = await db
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
    .where(where)
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  const stages = await db
    .select({ status: projectStagesTable.status })
    .from(projectStagesTable)
    .where(eq(projectStagesTable.projectId, row.id));
  const stagesTotal = stages.length;
  const stagesCompleted = stages.filter(
    (s) => s.status === "completed" || s.status === "approved",
  ).length;
  res.json({
    ...row,
    stagesTotal,
    stagesCompleted,
    progressPercent:
      stagesTotal > 0 ? Math.round((stagesCompleted / stagesTotal) * 100) : 0,
  });
});

router.patch("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db
    .update(projectsTable)
    .set(parsed.data)
    .where(eq(projectsTable.id, params.data.id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(row);
});

router.delete("/projects/:id", requireAuth, async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(projectsTable).where(eq(projectsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
