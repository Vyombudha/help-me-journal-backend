import { ProjectsRouter } from "./modules/Projects/index.js";
import { apiLimiter, requireAuth } from "./shared/middleware/index.js";
import {
  ContainersRouter,
  ProjectContainersRouter,
} from "./modules/Containers/containers.route.js";
import { clerkMiddleware } from "@clerk/hono";
import { errorHandler } from "./shared/middleware/errorHandler.middleware.js";

import { Hono } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./shared/types/hono.js";

const app = new Hono<AppEnv>();

const FRONTEND_URL = [process.env.FRONTEND_URL, "http://localhost:5173"].filter(
  (url): url is string => Boolean(url),
);

app.use(
  cors({
    origin: FRONTEND_URL,
    maxAge: 600,
  }),
);

app.get("/health", (c) => c.json({ ok: true }));
app.use(clerkMiddleware());
app.use(requireAuth);
app.use(apiLimiter);
app.route("/api/v1/projects", ProjectsRouter);
app.route("/api/v1/projects/:projectId/containers", ProjectContainersRouter);
app.route("/api/v1/containers", ContainersRouter);
app.onError(errorHandler);
app.notFound((c) =>
  c.json(
    {
      success: false,
      message: `Route ${c.req.method} ${c.req.path} not found`,
    },
    404,
  ),
);

export default { port: 3000, fetch: app.fetch };
