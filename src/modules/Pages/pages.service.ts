import { Mood, type Page } from "../../../generated/prisma/client.js";
import { prisma } from "../../shared/db/prisma.js";

const createPage = async (
  ownerId: string,
  workspaceId: string,
  title: string,
  moods: Mood[],
): Promise<Page> => {
  await prisma.workspace.findFirstOrThrow({
    where: {
      id: workspaceId,
      ownerId,
    },
  });

  return await prisma.page.create({
    data: {
      title,
      workspaceId,
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
      workspace: {
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
      workspace: {
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
      workspace: {
        ownerId,
      },
    },
  });
};

const deletePage = async (ownerId: string, pageId: string): Promise<void> => {
  await prisma.page.delete({
    where: {
      id: pageId,
      workspace: {
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
