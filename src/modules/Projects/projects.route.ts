import { Hono } from "hono";
import type { AppEnv } from "../../shared/types/hono.js";
import { ProjectsController } from "./projects.controller.js";
const ProjectsRouter = new Hono<AppEnv>();

ProjectsRouter.get("/", ...ProjectsController.getAll);

ProjectsRouter.post("/", ...ProjectsController.new);

ProjectsRouter.get("/:projectId", ...ProjectsController.get);

ProjectsRouter.patch("/:projectId", ...ProjectsController.updateName);

ProjectsRouter.delete("/:projectId", ...ProjectsController.delete);

export { ProjectsRouter };
