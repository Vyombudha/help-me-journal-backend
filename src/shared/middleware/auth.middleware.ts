import { getAuth } from "@clerk/hono";
import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { UnauthorizedError } from "../errors/AppError.js";
import { prisma } from "../db/prisma.js";
import type { AppEnv } from "../types/hono.js";

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

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existingUser) {
      const clerkUser = await loadClerkUser(c, userId);
      const email = clerkUser.emailAddresses[0]?.emailAddress;
      if (!email) throw new UnauthorizedError(); // just in case

      try {
        await prisma.user.create({
          data: { id: userId, email, name: clerkUser.firstName ?? undefined },
        });
      } catch (err: any) {
        // P2002 = unique constraint: a parallel request already created the user
        if (err?.code !== "P2002") throw err;
      }
    }

    c.set("userId", userId);
    await next();
  });

export const requireAuth = createRequireAuth();
