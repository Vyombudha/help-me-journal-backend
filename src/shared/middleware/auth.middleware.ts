import { getAuth } from "@clerk/hono";
import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { UnauthorizedError } from "../errors/AppError.js";
import type { AppEnv } from "../types/hono.js";
import { db } from "../../../db/index.js";
import { pages, users, workspaces } from "../../../db/schema.js";
import { eq } from "drizzle-orm";

type ClerkUserDetails = {
  firstName: string | null;
  emailAddresses: { emailAddress: string }[];
};

export const createRequireAuth = (
  resolveUserId: (c: Context<AppEnv>) => string | null | undefined = (c) =>
    getAuth(c)?.userId,
  loadClerkUser: (
    c: Context<AppEnv>,
    userId: string,
  ) => Promise<ClerkUserDetails> = (c, userId) =>
    c.get("clerk").users.getUser(userId),
) =>
  createMiddleware<AppEnv>(async (c, next) => {
    const userId = resolveUserId(c);
    if (!userId) throw new UnauthorizedError();

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!existingUser) {
      const clerkUser = await loadClerkUser(c, userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (!email) throw new UnauthorizedError("Failed on Clerk Load");

      const workspaceOwnerName = clerkUser.firstName ?? "User";
      const workspaceId = crypto.randomUUID();
      const welcomeContent = JSON.stringify([
        {
          type: "heading",
          props: { level: 1 },
          content: [{ type: "text", text: "Welcome", styles: {} }],
        },
        {
          type: "paragraph",
          content: [
            {
              type: "text",
              text: "This is your first page. Start writing!",
              styles: {},
            },
          ],
        },
      ]);
      try {
        await db.batch([
          db.insert(users).values({
            id: userId,
            email,
            name: clerkUser.firstName ?? null,
          }),
          db.insert(workspaces).values({
            id: workspaceId,
            ownerId: userId,
            name: `${workspaceOwnerName}'s Workspace`,
            description: `${workspaceOwnerName}'s default workspace. You can change this later.`,
            isDefault: true,
          }),
          db.insert(pages).values({
            workspaceId,
            title: "Welcome",
            content: welcomeContent,
            moods: [],
          }),
        ]);
      } catch (err) {
        // Another request may have created this user a moment ago
        const [nowExists] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId));
        if (!nowExists) throw err;
      }
    }

    c.set("userId", userId);
    await next();
  });

export const requireAuth = createRequireAuth();
