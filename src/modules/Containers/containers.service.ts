import {
  Mood,
  type Container,
  type ContainerType,
} from "../../../generated/prisma/client.js";
import { prisma } from "../../shared/db/prisma.js";

const createContainer = async (
  ownerId: string,
  projectId: string,
  title: string,
  type: ContainerType,
  moods: Mood[],
): Promise<Container> => {
  await prisma.project.findFirstOrThrow({
    where: {
      id: projectId,
      ownerId,
    },
  });

  return await prisma.container.create({
    data: {
      title,
      projectId,
      type,
      moods,
    },
  });
};

const getAllContainers = async (
  ownerId: string,
  projectId: string,
): Promise<Array<Container>> => {
  await prisma.project.findFirstOrThrow({
    where: {
      id: projectId,
      ownerId,
    },
  });
  const containers = await prisma.container.findMany({
    where: {
      projectId,
    },
  });
  return containers;
};

const getContainer = async (
  ownerId: string,
  containerId: string,
): Promise<Container> => {
  return await prisma.container.findFirstOrThrow({
    where: {
      id: containerId,
      project: {
        ownerId,
      },
    },
  });
};

const updateContainerTitle = async (
  ownerId: string,
  containerId: string,
  newTitle: string,
  newMoods: Mood[] | undefined,
): Promise<Container> => {
  if (newMoods) {
    return await prisma.container.update({
      data: {
        title: newTitle,
        moods: newMoods,
      },
      where: {
        id: containerId,
        project: {
          ownerId,
        },
      },
    });
  } else {
    return await prisma.container.update({
      data: {
        title: newTitle,
      },
      where: {
        id: containerId,
        project: {
          ownerId,
        },
      },
    });
  }
};

const deleteContainer = async (
  ownerId: string,
  containerId: string,
): Promise<void> => {
  await prisma.container.delete({
    where: {
      id: containerId,
      project: {
        ownerId,
      },
    },
  });
};

const ContainerService = {
  get: getContainer,
  new: createContainer,
  getAll: getAllContainers,
  updateName: updateContainerTitle,
  delete: deleteContainer,
};

export default ContainerService;
