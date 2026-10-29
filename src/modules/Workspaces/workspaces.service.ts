import { type Workspace } from "../../../generated/prisma/client.js";
import { prisma } from "../../shared/db/prisma.js";

const createWorkspace = async (
  ownerId: string,
  name: string,
  description: string,
): Promise<Workspace> => {
  return await prisma.workspace.create({
    data: { ownerId, name, description },
  });
};

const getAllWorkspaces = async (ownerId: string): Promise<Workspace[]> => {
  const workspaces = await prisma.workspace.findMany({
    where: {
      ownerId,
    },
  });
  return workspaces;
};

const getWorkspace = async (
  ownerId: string,
  workspaceId: string,
): Promise<Workspace> => {
  return await prisma.workspace.findFirstOrThrow({
    where: {
      ownerId,
      id: workspaceId,
    },
  });
};

const updateWorkspaceName = async (
  ownerId: string,
  workspaceId: string,
  newName: string,
  newDescription: string,
): Promise<Workspace> => {
  return await prisma.workspace.update({
    data: {
      name: newName,
      description: newDescription,
    },
    where: {
      ownerId,
      id: workspaceId,
    },
  });
};

const deleteWorkspace = async (
  ownerId: string,
  workspaceId: string,
): Promise<void> => {
  await prisma.workspace.delete({
    where: {
      ownerId,
      id: workspaceId,
    },
  });
};

export const WorkspacesService = {
  get: getWorkspace,
  new: createWorkspace,
  getAll: getAllWorkspaces,
  updateName: updateWorkspaceName,
  delete: deleteWorkspace,
};
