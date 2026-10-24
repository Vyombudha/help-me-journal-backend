import { getAuth } from "@clerk/hono";
import { createMiddleware } from "hono/factory";
import { UnauthorizedError } from "../errors/AppError.js";
import { prisma } from "../db/prisma.js";
import type { AppEnv } from "../types/hono.js";

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const userId = getAuth(c)?.userId;
  if (!userId) throw new UnauthorizedError();

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!existingUser) {
    const clerk = c.get("clerk");
    const clerkUser = await clerk.users.getUser(userId);
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
