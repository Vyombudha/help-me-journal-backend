import { Mood, type Page } from "../../../generated/prisma/client.js";
import { prisma } from "../../shared/db/prisma.js";

const createPage = async (
  ownerId: string,
  projectId: string,
  title: string,
  moods: Mood[],
): Promise<Page> => {
  await prisma.workspace.findFirstOrThrow({
    where: {
      id: projectId,
      ownerId,
    },
  });

  return await prisma.page.create({
    data: {
      title,
      projectId,
      moods,
    },
  });
};

const getAllPages = async (ownerId: string, workspaceId: string) => {
  await prisma.workspace.findFirstOrThrow({
    where: {
      id: workspaceId,
      ownerId,
    },
  });
  const pages = await prisma.page.findMany({
    where: {
      workspace: { id: workspaceId },
    },
    select: {
      id: true,
      title: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  return pages;
};

const getPage = async (ownerId: string, pageId: string): Promise<Page> => {
  return await prisma.page.findFirstOrThrow({
    where: {
      id: pageId,
      project: {
        ownerId,
      },
    },
  });
};

const updatePageTitle = async (
  ownerId: string,
  pageId: string,
  newTitle: string,
): Promise<Page> => {
  return await prisma.page.update({
    data: {
      title: newTitle,
    },
    where: {
      id: pageId,
      project: {
        ownerId,
      },
    },
  });
};

const updatePageContent = async (
  ownerId: string,
  pageId: string,
  newContent: string,
): Promise<Page> => {
  return await prisma.page.update({
    data: {
      content: newContent,
    },
    where: {
      id: pageId,
      project: {
        ownerId,
      },
    },
  });
};

const deletePage = async (ownerId: string, pageId: string): Promise<void> => {
  await prisma.page.delete({
    where: {
      id: pageId,
      project: {
        ownerId,
      },
    },
  });
};

export const PagesService = {
  get: getPage,
  new: createPage,
  getAll: getAllPages,
  updateTitle: updatePageTitle,
  updateContent: updatePageContent,
  delete: deletePage,
};
