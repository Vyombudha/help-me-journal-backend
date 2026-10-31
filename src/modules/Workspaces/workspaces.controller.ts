import { WorkspacesService } from "./workspaces.service.js";

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
import { Workspace } from "../../../db/schema.js";

const factory = createFactory<AppEnv>();

const newWorkspace = factory.createHandlers(
  sValidator("json", NewWorkspaceSchema),
  async (c) => {
    const db = c.get("db");
    const userId = c.get("userId");
    const body: NewWorkspaceInput = c.req.valid("json");
    const newProject = await WorkspacesService.new(
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
  const data: Workspace[] =
    await WorkspacesService.getAllOrCreateDefault(userId);

  return c.json(
    {
      success: true,
      data,
    },
    200,
  );
});

const getWorkspace = factory.createHandlers(
  sValidator("param", WorkspaceIdParamSchema),
  async (c) => {
    const userId = c.get("userId");
    const { workspaceId } = c.req.valid("param");
    const workspace: Workspace = await WorkspacesService.get(
      userId,
      workspaceId,
    );

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

    const updatedWorkspace: Workspace = await WorkspacesService.updateName(
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
    await WorkspacesService.delete(userId, workspaceId);

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
