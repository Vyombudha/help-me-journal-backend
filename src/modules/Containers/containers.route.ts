import type { AppEnv } from "../../shared/types/hono.js";
import { ContainerController } from "./containers.controller.js";
import { Hono } from "hono";

const ContainersRouter = new Hono<AppEnv>();
const ProjectContainersRouter = new Hono<AppEnv>();

// Mounted at /containers/
ContainersRouter.get("/:containerId", ...ContainerController.get);

ContainersRouter.patch("/:containerId", ...ContainerController.updateTitle);
ContainersRouter.delete("/:containerId", ...ContainerController.delete);

// Mounted at /projects/:projectId/containers
ProjectContainersRouter.get("/", ...ContainerController.getAll);
ProjectContainersRouter.post("/", ...ContainerController.new);

export { ContainersRouter, ProjectContainersRouter };
