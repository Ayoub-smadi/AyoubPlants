import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import categoriesRouter from "./categories.js";
import plantsRouter from "./plants.js";
import ordersRouter from "./orders.js";
import reportsRouter from "./reports.js";
import usersRouter from "./users.js";
import storageRouter from "./storage.js";
import uploadRouter from "./upload.js";

const router = Router();

router.use("/", healthRouter);
router.use("/auth", authRouter);
router.use("/categories", categoriesRouter);
router.use("/plants", plantsRouter);
router.use("/orders", ordersRouter);
router.use("/reports", reportsRouter);
router.use("/users", usersRouter);
router.use("/storage", storageRouter);
router.use("/", uploadRouter);

export default router;
