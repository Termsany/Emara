import { eq, and } from "drizzle-orm";
import {
  db,
  projectsTable,
  projectStagesTable,
  approvalsTable,
  paymentsTable,
  fileAssetsTable,
  boqItemsTable,
  quotationsTable,
  commentsTable,
} from "@workspace/db";
import type { AuthUser } from "./auth";

export const STAFF_ROLES = [
  "admin",
  "sales",
  "designer",
  "draftsman",
  "qs",
  "accountant",
] as const;

export function isClient(user: AuthUser | undefined): boolean {
  return user?.role === "client";
}

export function isStaff(user: AuthUser | undefined): boolean {
  return !!user && user.role !== "client";
}

export async function clientOwnsProject(
  user: AuthUser,
  projectId: number,
): Promise<boolean> {
  if (user.clientId == null) return false;
  const [row] = await db
    .select({ id: projectsTable.id })
    .from(projectsTable)
    .where(
      and(
        eq(projectsTable.id, projectId),
        eq(projectsTable.clientId, user.clientId),
      ),
    )
    .limit(1);
  return !!row;
}

export async function canAccessProject(
  user: AuthUser,
  projectId: number,
): Promise<boolean> {
  if (isStaff(user)) return true;
  return clientOwnsProject(user, projectId);
}

async function projectIdForStage(stageId: number): Promise<number | null> {
  const [row] = await db
    .select({ projectId: projectStagesTable.projectId })
    .from(projectStagesTable)
    .where(eq(projectStagesTable.id, stageId))
    .limit(1);
  return row?.projectId ?? null;
}

async function projectIdForApproval(approvalId: number): Promise<number | null> {
  const [row] = await db
    .select({ projectId: approvalsTable.projectId })
    .from(approvalsTable)
    .where(eq(approvalsTable.id, approvalId))
    .limit(1);
  return row?.projectId ?? null;
}

async function projectIdForPayment(paymentId: number): Promise<number | null> {
  const [row] = await db
    .select({ projectId: paymentsTable.projectId })
    .from(paymentsTable)
    .where(eq(paymentsTable.id, paymentId))
    .limit(1);
  return row?.projectId ?? null;
}

async function projectIdForFile(fileId: number): Promise<number | null> {
  const [row] = await db
    .select({ projectId: fileAssetsTable.projectId })
    .from(fileAssetsTable)
    .where(eq(fileAssetsTable.id, fileId))
    .limit(1);
  return row?.projectId ?? null;
}

async function projectIdForBoq(itemId: number): Promise<number | null> {
  const [row] = await db
    .select({ projectId: boqItemsTable.projectId })
    .from(boqItemsTable)
    .where(eq(boqItemsTable.id, itemId))
    .limit(1);
  return row?.projectId ?? null;
}

async function projectIdForQuotation(quotationId: number): Promise<number | null> {
  const [row] = await db
    .select({ projectId: quotationsTable.projectId })
    .from(quotationsTable)
    .where(eq(quotationsTable.id, quotationId))
    .limit(1);
  return row?.projectId ?? null;
}

async function projectIdForComment(commentId: number): Promise<number | null> {
  const [row] = await db
    .select({ projectId: commentsTable.projectId })
    .from(commentsTable)
    .where(eq(commentsTable.id, commentId))
    .limit(1);
  return row?.projectId ?? null;
}

export const projectIdLookup = {
  stage: projectIdForStage,
  approval: projectIdForApproval,
  payment: projectIdForPayment,
  file: projectIdForFile,
  boq: projectIdForBoq,
  quotation: projectIdForQuotation,
  comment: projectIdForComment,
};
