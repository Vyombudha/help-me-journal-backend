// shared/middleware/errorHandler.middleware.ts
import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppEnv } from "../types/hono.js";
import { isUniqueViolation } from "../errors/dbErrors.js";

export interface AppErrorLike extends Error {
  statusCode: ContentfulStatusCode;
  errors?: { path: string; message: string }[];
}

export const isAppError = (err: unknown): err is AppErrorLike =>
  err instanceof Error &&
  "statusCode" in err &&
  typeof (err as { statusCode: unknown }).statusCode === "number";

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  // Our custom errors
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

  // Database unique-constraint failures (duplicate workspace name, page title)
  if (isUniqueViolation(err)) {
    return c.json(
      { success: false, message: "A resource with that name already exists" },
      409,
    );
  }

  // Everything else: log full error, return nothing sensitive
  console.error(err);
  return c.json({ success: false, message: "Internal server error" }, 500);
};
