import { Prisma, type Project } from "../../../generated/prisma/client.js";
import { prisma } from "../../shared/db/prisma.js";
import { NotFoundError } from "../../shared/errors/AppError.js";

const createProject = async (
  ownerId: string,
  name: string,
  description: string
): Promise<Project> => {
  return await prisma.project.create({
    data: { ownerId, name, description },
  });
};

const getAllProjects = async (ownerId: string): Promise<Array<Project>> => {
  const projects = await prisma.project.findMany({
    where: {
      ownerId,
    },
  });
  return projects;
};

const getProject = async (
  ownerId: string,
  projectId: string,
): Promise<Project> => {
  return await prisma.project.findFirstOrThrow({
    where: {
      ownerId,
      id: projectId,
    },
  });
};

const updateProjectName = async (
  ownerId: string,
  projectId: string,
  newName: string,
  newDescription: string
): Promise<Project> => {
  return await prisma.project.update({
    data: {
      name: newName,
      description: newDescription
    },
    where: {
      ownerId,
      id: projectId,
    },
  });
};

const deleteProject = async (
  ownerId: string,
  projectId: string,
): Promise<void> => {
  await prisma.project.delete({
    where: {
      ownerId,
      id: projectId,
    },
  });
};

const ProjectsService = {
  get: getProject,
  new: createProject,
  getAll: getAllProjects,
  updateName: updateProjectName,
  delete: deleteProject,
};

export default ProjectsService;
