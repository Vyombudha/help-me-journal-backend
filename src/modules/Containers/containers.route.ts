import { Router } from "express";
import { validateSchema } from "../../shared/middleware/validator.middleware.js";
import {
  containerIdParamSchema,
  newContainerSchema,
  updateContainerSchema,
} from "./containers.schema.js";
import { ContainerController } from "./containers.controller.js";
import { projectIdParamSchema } from "../Projects/projects.schema.js";

const ContainersRouter = Router();
const ProjectContainersRouter = Router({ mergeParams: true });

// Mounted at /containers/
ContainersRouter.get(
  "/:containerId",
  validateSchema(containerIdParamSchema, "params"),
  ContainerController.get,
);

ContainersRouter.patch(
  "/:containerId",
  validateSchema(containerIdParamSchema, "params"),
  validateSchema(updateContainerSchema),
  ContainerController.updateTitle,
);
ContainersRouter.delete(
  "/:containerId",
  validateSchema(containerIdParamSchema, "params"),
  ContainerController.delete,
);

// Mounted at /projects/:projectId/containers
ProjectContainersRouter.get(
  "/",
  validateSchema(projectIdParamSchema, "params"),
  ContainerController.getAll,
);
ProjectContainersRouter.post(
  "/",
  validateSchema(projectIdParamSchema, "params"),
  validateSchema(newContainerSchema),
  ContainerController.new,
);

export { ContainersRouter, ProjectContainersRouter };
