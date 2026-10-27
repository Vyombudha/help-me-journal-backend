import { ProjectsRouter } from "./modules/Projects/index.js";
import { apiLimiter } from "./shared/middleware/index.js";
import {
  ContainersRouter,
  ProjectContainersRouter,
} from "./modules/Containers/containers.route.js";
import { clerkMiddleware } from "@clerk/hono";
import { errorHandler } from "./shared/middleware/errorHandler.middleware.js";
import { requireAuth } from "./shared/middleware/auth.middleware.js";

import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import { cors } from "hono/cors";
import type { AppEnv } from "./shared/types/hono.js";

const FRONTEND_URL = [process.env.FRONTEND_URL, "http://localhost:5173"].filter(
  (url): url is string => Boolean(url),
);

export const createApp = (
  clerkAuth: MiddlewareHandler<AppEnv> = clerkMiddleware(),
  requireAuthentication: MiddlewareHandler<AppEnv> = requireAuth,
) => {
  const app = new Hono<AppEnv>();

  app.use(
    cors({
      origin: FRONTEND_URL,
      maxAge: 600,
    }),
  );

  app.get("/health", (c) => c.json({ ok: true }));
  app.use(clerkAuth);
  app.use(requireAuthentication);
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

  return app;
};

const app = createApp();

export default app;
