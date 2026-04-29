import { Router, type IRouter } from "express";
import { asc, eq } from "drizzle-orm";
import { db, commentsTable, usersTable } from "@workspace/db";
import {
  CreateProjectCommentBody,
  CreateProjectCommentParams,
  ListProjectCommentsParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get(
  "/projects/:projectId/comments",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = ListProjectCommentsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const rows = await db
      .select({
        id: commentsTable.id,
        projectId: commentsTable.projectId,
        stageId: commentsTable.stageId,
        approvalId: commentsTable.approvalId,
        userId: commentsTable.userId,
        userName: usersTable.name,
        userRole: usersTable.role,
        commentText: commentsTable.commentText,
        isInternal: commentsTable.isInternal,
        revisionNumber: commentsTable.revisionNumber,
        createdAt: commentsTable.createdAt,
      })
      .from(commentsTable)
      .innerJoin(usersTable, eq(usersTable.id, commentsTable.userId))
      .where(eq(commentsTable.projectId, params.data.projectId))
      .orderBy(asc(commentsTable.createdAt));
    const filtered =
      req.user?.role === "client" ? rows.filter((r) => !r.isInternal) : rows;
    res.json(filtered);
  },
);

router.post(
  "/projects/:projectId/comments",
  requireAuth,
  async (req, res): Promise<void> => {
    const params = CreateProjectCommentParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    const parsed = CreateProjectCommentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [row] = await db
      .insert(commentsTable)
      .values({
        projectId: params.data.projectId,
        stageId: parsed.data.stageId ?? null,
        approvalId: parsed.data.approvalId ?? null,
        userId: req.user!.id,
        commentText: parsed.data.commentText,
        isInternal: parsed.data.isInternal,
      })
      .returning();
    res.status(201).json(row);
  },
);

export default router;
