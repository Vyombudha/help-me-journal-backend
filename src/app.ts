import "dotenv/config";
import express from "express";
import { clerkMiddleware } from "@clerk/express";
import { ProjectsRouter } from "./modules/Projects/index.js";
import { requireAuth } from "./shared/middleware/index.js";
import {
  ContainersRouter,
  ProjectContainersRouter,
} from "./modules/Containers/containers.route.js";
import {
  ContainerEntriesRouter,
  EntriesRouter,
} from "./modules/Entries/entries.route.js";
import { globalErrorHandler } from "./shared/middleware/errorHandler.middleware.js";
import helmet from "helmet";
import cors from "cors";

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";
app.use(
  cors({
    origin: FRONTEND_URL,
  }),
);

app.use(helmet());
app.use(clerkMiddleware());
app.use(express.json());
app.use(requireAuth);
app.use("/api/v1/projects", ProjectsRouter);
app.use("/api/v1/projects/:projectId/containers", ProjectContainersRouter);
app.use("/api/v1/containers", ContainersRouter);
app.use("/api/v1/containers/:containerId/entries", ContainerEntriesRouter);
app.use("/api/v1/entries", EntriesRouter);

app.use(globalErrorHandler);

export default app;
