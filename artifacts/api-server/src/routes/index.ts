import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import clientsRouter from "./clients";
import projectsRouter from "./projects";
import stagesRouter from "./stages";
import quotationsRouter from "./quotations";
import filesRouter from "./files";
import approvalsRouter from "./approvals";
import commentsRouter from "./comments";
import boqRouter from "./boq";
import paymentsRouter from "./payments";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(clientsRouter);
router.use(projectsRouter);
router.use(stagesRouter);
router.use(quotationsRouter);
router.use(filesRouter);
router.use(approvalsRouter);
router.use(commentsRouter);
router.use(boqRouter);
router.use(paymentsRouter);
router.use(dashboardRouter);

export default router;
