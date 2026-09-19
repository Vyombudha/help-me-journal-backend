import { Router } from "express";

import { validateSchema } from "../../shared/middleware/validator.middleware.js";
import { ProjectsController } from "./projects.controller.js";
import { asyncHandler } from "../../shared/middleware/asyncHandler.middleware.js";
import {
  newProjectSchema,
  projectIdParamSchema,
  updateProjectSchema,
} from "./projects.schema.js";

const ProjectsRouter = Router();

ProjectsRouter.get("/", asyncHandler(ProjectsController.getAll));

ProjectsRouter.post(
  "/",
  validateSchema(newProjectSchema, "body"),
  asyncHandler(ProjectsController.new),
);

ProjectsRouter.get(
  "/:projectId",
  validateSchema(projectIdParamSchema, "params"),
  asyncHandler(ProjectsController.get),
);

ProjectsRouter.patch(
  "/:projectId",
  validateSchema(projectIdParamSchema, "params"),
  validateSchema(updateProjectSchema, "body"),
  asyncHandler(ProjectsController.updateName),
);

ProjectsRouter.delete(
  "/:projectId",
  validateSchema(projectIdParamSchema, "params"),
  asyncHandler(ProjectsController.delete),
);

export { ProjectsRouter };
