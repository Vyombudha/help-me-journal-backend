import { Request, Response, NextFunction } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { UnauthorizedError } from "../errors/AppError.js";
import { prisma } from "../db/prisma.js";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { userId } = getAuth(req);
  if (!userId) {
    throw new UnauthorizedError();
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  if (!existingUser) {
    const clerkUser = await clerkClient.users.getUser(userId);
    const email = clerkUser.emailAddresses[0]?.emailAddress;
    if (!email) throw new UnauthorizedError(); // just in case

    await prisma.user.create({
      data: { id: userId, email, name: clerkUser.firstName ?? undefined },
    });
  }

  req.userId = userId;
  next();
}
