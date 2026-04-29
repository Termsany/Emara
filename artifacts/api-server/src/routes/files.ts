import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import {
  db,
  fileAssetsTable,
  projectsTable,
  usersTable,
} from "@workspace/db";
import {
  CreateProjectFileBody,
  CreateProjectFileParams,
  DeleteFileParams,
  ListProjectFilesParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

const fileSelect = {
  id: fileAssetsTable.id,
  projectId: fileAssetsTable.projectId,
  projectName: projectsTable.projectName,
  stageId: fileAssetsTable.stageId,
  uploadedById: fileAssetsTable.uploadedById,
  uploadedByName: usersTable.name,
  fileName: fileAssetsTable.fileName,
  fileUrl: fileAssetsTable.fileUrl,
  fileType: fileAssetsTable.fileType,
  category: fileAssetsTable.category,
  version: fileAssetsTable.version,
  isPublic: fileAssetsTable.isPublic,
  notes: fileAssetsTable.notes,
  createdAt: fileAssetsTable.createdAt,
};

router.get(
  "/projects/:projectId/files",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = ListProjectFilesParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const rows = await db
      .select(fileSelect)
      .from(fileAssetsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, fileAssetsTable.projectId))
      .leftJoin(usersTable, eq(usersTable.id, fileAssetsTable.uploadedById))
      .where(eq(fileAssetsTable.projectId, params.data.projectId))
      .orderBy(desc(fileAssetsTable.createdAt));
    const filtered =
      req.user?.role === "client"
        ? rows.filter((r) => r.isPublic)
        : rows;
    res.json(filtered);
  },
);

router.post(
  "/projects/:projectId/files",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = CreateProjectFileParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = CreateProjectFileBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [row] = await db
      .insert(fileAssetsTable)
      .values({
        projectId: params.data.projectId,
        stageId: parsed.data.stageId ?? null,
        uploadedById: req.user!.id,
        fileName: parsed.data.fileName,
        fileUrl: parsed.data.fileUrl,
        fileType: parsed.data.fileType ?? null,
        category: parsed.data.category,
        version: parsed.data.version,
        isPublic: parsed.data.isPublic,
        notes: parsed.data.notes ?? null,
      })
      .returning();
    res.status(201).json(row);
  },
);

router.get("/files", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db
    .select(fileSelect)
    .from(fileAssetsTable)
    .leftJoin(projectsTable, eq(projectsTable.id, fileAssetsTable.projectId))
    .leftJoin(usersTable, eq(usersTable.id, fileAssetsTable.uploadedById))
    .orderBy(desc(fileAssetsTable.createdAt));
  res.json(rows);
});

router.delete(
  "/files/:id",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = DeleteFileParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    await db.delete(fileAssetsTable).where(eq(fileAssetsTable.id, params.data.id));
    res.sendStatus(204);
  },
);

export default router;
