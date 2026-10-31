import { and, eq } from "drizzle-orm";
import { db } from "../../../db";
import { workspaces, type Workspace } from "../../../db/schema";
import { NotFoundError } from "../../shared/errors/AppError";

const getAll = (ownerId: string): Promise<Workspace[]> =>
  db.select().from(workspaces).where(eq(workspaces.ownerId, ownerId));

const create = async (
  ownerId: string,
  name: string,
  description: string,
): Promise<Workspace> => {
  const [ws] = await db
    .insert(workspaces)
    .values({ ownerId, name, description })
    .returning();
  return ws!;
};

const getAllOrCreateDefault = async (ownerId: string): Promise<Workspace[]> => {
  const all = await getAll(ownerId);

  if (all.some((w) => w.isDefault)) return all;

  // Existing workspaces, but none is the default.
  if (all.length > 0) {
    await db
      .update(workspaces)
      .set({ isDefault: true })
      .where(eq(workspaces.id, all[0]!.id));
    return getAll(ownerId);
  }

  const [ws] = await db
    .insert(workspaces)
    .values({
      ownerId,
      name: "My Workspace",
      description: "",
      isDefault: true,
    })
    .returning();
  return [ws!];
};

const get = async (
  ownerId: string,
  workspaceId: string,
): Promise<Workspace> => {
  const [ws] = await db
    .select()
    .from(workspaces)
    .where(
      and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, ownerId)),
    );
  if (!ws) throw new NotFoundError();
  return ws;
};

const updateName = async (
  ownerId: string,
  workspaceId: string,
  newName: string,
  newDescription: string,
): Promise<Workspace> => {
  const [ws] = await db
    .update(workspaces)
    .set({ name: newName, description: newDescription })
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, ownerId)))
    .returning();
  if (!ws) throw new NotFoundError();
  return ws;
};

const remove = async (ownerId: string, workspaceId: string): Promise<void> => {
  const deleted = await db
    .delete(workspaces)
    .where(and(eq(workspaces.id, workspaceId), eq(workspaces.ownerId, ownerId)))
    .returning({ id: workspaces.id });
  if (deleted.length === 0) throw new NotFoundError();
};

export const WorkspacesService = {
  get,
  new: create,
  getAllOrCreateDefault,
  updateName,
  delete: remove,
};
