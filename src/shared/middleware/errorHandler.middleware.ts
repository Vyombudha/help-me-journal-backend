// shared/middleware/errorHandler.middleware.ts
import type { ContentfulStatusCode } from "hono/utils/http-status";

export interface AppErrorLike extends Error {
  statusCode: ContentfulStatusCode;
  errors?: { path: string; message: string }[];
}

export const isAppError = (err: unknown): err is AppErrorLike =>
  err instanceof Error &&
  "statusCode" in err &&
  typeof (err as { statusCode: unknown }).statusCode === "number";
// shared/middleware/errorHandler.middleware.ts
import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { Prisma } from "../../../generated/prisma/client.js";
import type { AppEnv } from "../types/hono.js";

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  // Your custom errors
  if (isAppError(err)) {
    return c.json(
      {
        success: false,
        message: err.message,
        ...(err.errors && { errors: err.errors }),
      },
      err.statusCode,
    );
  }

  // Hono / middleware errors (clerk, validators, etc.)
  if (err instanceof HTTPException) {
    return c.json({ success: false, message: err.message }, err.status);
  }

  // Known Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2025":
        return c.json({ success: false, message: "Resource not found" }, 404);
      case "P2002":
        return c.json({ success: false, message: "Duplicate entry" }, 409);
      case "P2003":
        return c.json(
          { success: false, message: "Related resource does not exist" },
          409,
        );
    }
    console.error(`Prisma error [${err.code}]:`, err);
    return c.json({ success: false, message: "Internal server error" }, 500);
  }

  // Everything else: log full error, return nothing sensitive
  console.error(err);
  return c.json({ success: false, message: "Internal server error" }, 500);
};
