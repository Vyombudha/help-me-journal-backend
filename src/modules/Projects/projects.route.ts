import { Router } from "express";

import { validateSchema } from "../../shared/middleware/validator.middleware.js";
import { ProjectsController } from "./projects.controller.js";
import {
  newProjectSchema,
  projectIdParamSchema,
  updateProjectSchema,
} from "./projects.schema.js";

const ProjectsRouter = Router();

ProjectsRouter.get("/", ProjectsController.getAll);

ProjectsRouter.post(
  "/",
  validateSchema(newProjectSchema, "body"),
  ProjectsController.new,
);

ProjectsRouter.get(
  "/:projectId",
  validateSchema(projectIdParamSchema, "params"),
  ProjectsController.get,
);

ProjectsRouter.patch(
  "/:projectId",
  validateSchema(projectIdParamSchema, "params"),
  validateSchema(updateProjectSchema, "body"),
  ProjectsController.updateName,
);

ProjectsRouter.delete(
  "/:projectId",
  validateSchema(projectIdParamSchema, "params"),
  ProjectsController.delete,
);

export { ProjectsRouter };
