import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "../../../db/index.js";
import { pages, workspaces, type Mood, type Page } from "../../../db/schema.js";
import { NotFoundError } from "../../shared/errors/AppError.js";

// "page belongs to a workspace owned by this user"
const ownedBy = (ownerId: string) =>
  inArray(
    pages.workspaceId,
    db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(eq(workspaces.ownerId, ownerId)),
  );

const assertWorkspaceOwned = async (ownerId: string, workspaceId: string) => {
  const [ws] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(
      and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, ownerId)),
    );
  if (!ws) throw new NotFoundError("Workspace not found");
};

const createPage = async (
  ownerId: string,
  workspaceId: string,
  title: string,
  moods: Mood[],
): Promise<Page> => {
  await assertWorkspaceOwned(ownerId, workspaceId);
  const [page] = await db
    .insert(pages)
    .values({ title, workspaceId, moods })
    .returning();
  return page!;
};

const getAllPages = async (ownerId: string, workspaceId: string) => {
  await assertWorkspaceOwned(ownerId, workspaceId);
  return db
    .select({ id: pages.id, title: pages.title })
    .from(pages)
    .where(eq(pages.workspaceId, workspaceId))
    .orderBy(asc(pages.createdAt));
};

const getPage = async (ownerId: string, pageId: string): Promise<Page> => {
  const [page] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.id, pageId), ownedBy(ownerId)));
  if (!page) throw new NotFoundError("Page not found");
  return page;
};

const updatePageTitle = async (
  ownerId: string,
  pageId: string,
  newTitle: string,
): Promise<Page> => {
  const [page] = await db
    .update(pages)
    .set({ title: newTitle })
    .where(and(eq(pages.id, pageId), ownedBy(ownerId)))
    .returning();
  if (!page) throw new NotFoundError("Page not found");
  return page;
};

const updatePageContent = async (
  ownerId: string,
  pageId: string,
  newContent: string,
): Promise<Page> => {
  const [page] = await db
    .update(pages)
    .set({ content: newContent })
    .where(and(eq(pages.id, pageId), ownedBy(ownerId)))
    .returning();
  if (!page) throw new NotFoundError("Page not found");
  return page;
};

const deletePage = async (ownerId: string, pageId: string): Promise<void> => {
  const deleted = await db
    .delete(pages)
    .where(and(eq(pages.id, pageId), ownedBy(ownerId)))
    .returning({ id: pages.id });
  if (deleted.length === 0) throw new NotFoundError("Page not found");
};

export const PagesService = {
  get: getPage,
  new: createPage,
  getAll: getAllPages,
  updateTitle: updatePageTitle,
  updateContent: updatePageContent,
  delete: deletePage,
};
