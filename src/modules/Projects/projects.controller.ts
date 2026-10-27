import ProjectsService from "./projects.service.js";
import {
  NewProjectSchema,
  ProjectIdParamSchema,
  UpdateProjectSchema,
  type NewProjectInput,
  type UpdateProjectInput,
} from "./projects.schema.js";
import { createFactory } from "hono/factory";
import type { AppEnv } from "../../shared/types/hono.js";
import { sValidator } from "@hono/standard-validator";

const factory = createFactory<AppEnv>();

const newProject = factory.createHandlers(
  sValidator("json", NewProjectSchema),
  async (c) => {
    const userId = c.get("userId");
    const body: NewProjectInput = c.req.valid("json");
    const newProject = await ProjectsService.new(
      userId,
      body.name,
      body.description,
    );
    return c.json(
      {
        success: true,
        data: newProject,
      },
      200,
    );
  },
);

const getAllProjects = factory.createHandlers(async (c) => {
  const userId = c.get("userId");
  const projects = await ProjectsService.getAll(userId);
  return c.json(
    {
      success: true,
      data: projects,
    },
    200,
  );
});

const getProject = factory.createHandlers(
  sValidator("param", ProjectIdParamSchema), // add this
  async (c) => {
    const userId = c.get("userId");
    const { projectId } = c.req.valid("param");
    const project = await ProjectsService.get(userId, projectId);

    return c.json(
      {
        success: true,
        data: project,
      },
      200,
    );
  },
);

const updateProjectName = factory.createHandlers(
  sValidator("param", ProjectIdParamSchema),
  sValidator("json", UpdateProjectSchema),
  async (c) => {
    const userId = c.get("userId");
    const { projectId } = c.req.valid("param");
    const body: UpdateProjectInput = c.req.valid("json");

    const updatedProject = await ProjectsService.updateName(
      userId,
      projectId,
      body.newName,
      body.newDescription,
    );

    return c.json(
      {
        success: true,
        data: updatedProject,
      },
      200,
    );
  },
);
const deleteProject = factory.createHandlers(
  sValidator("param", ProjectIdParamSchema),
  async (c) => {
    const userId = c.get("userId");
    const { projectId } = c.req.valid("param");
    await ProjectsService.delete(userId, projectId);

    return c.json(
      {
        success: true,
        data: null,
      },
      200,
    );
  },
);

export const ProjectsController = {
  new: newProject,
  get: getProject,
  getAll: getAllProjects,
  updateName: updateProjectName,
  delete: deleteProject,
};
