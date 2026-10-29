import ProjectsService from "./workspaces.service.js";

import { createFactory } from "hono/factory";
import type { AppEnv } from "../../shared/types/hono.js";
import { sValidator } from "@hono/standard-validator";
import {
  NewWorkspaceSchema,
  UpdateWorkspaceSchema,
  WorkspaceIdParamSchema,
  type NewWorkspaceInput,
  type UpdateWorkspaceInput,
} from "./workspaces.schema.js";
import type { Workspace } from "../../../generated/prisma/client.js";

const factory = createFactory<AppEnv>();

const newWorkspace = factory.createHandlers(
  sValidator("json", NewWorkspaceSchema),
  async (c) => {
    const userId = c.get("userId");
    const body: NewWorkspaceInput = c.req.valid("json");
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

const getAllWorkspaces = factory.createHandlers(async (c) => {
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

const getWorkspace = factory.createHandlers(
  sValidator("param", WorkspaceIdParamSchema), // add this
  async (c) => {
    const userId = c.get("userId");
    const { workspaceId } = c.req.valid("param");
    const workspace: Workspace = await ProjectsService.get(userId, workspaceId);

    return c.json(
      {
        success: true,
        data: workspace,
      },
      200,
    );
  },
);

const updateWorkspaceName = factory.createHandlers(
  sValidator("param", WorkspaceIdParamSchema),
  sValidator("json", UpdateWorkspaceSchema),
  async (c) => {
    const userId = c.get("userId");
    const { workspaceId } = c.req.valid("param");
    const body: UpdateWorkspaceInput = c.req.valid("json");

    const updatedWorkspace: Workspace = await ProjectsService.updateName(
      userId,
      workspaceId,
      body.newName,
      body.newDescription,
    );

    return c.json(
      {
        success: true,
        data: updatedWorkspace,
      },
      200,
    );
  },
);
const deleteWorkspace = factory.createHandlers(
  sValidator("param", WorkspaceIdParamSchema),
  async (c) => {
    const userId = c.get("userId");
    const { workspaceId } = c.req.valid("param");
    await ProjectsService.delete(userId, workspaceId);

    return c.json(
      {
        success: true,
        data: null,
      },
      200,
    );
  },
);

export const WorkspacesController = {
  new: newWorkspace,
  get: getWorkspace,
  getAll: getAllWorkspaces,
  updateName: updateWorkspaceName,
  delete: deleteWorkspace,
};
