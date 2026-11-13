import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppEnv } from "../types/hono.js";
import { isUniqueViolation } from "../errors/dbErrors.js";
import { AppError } from "../errors/AppError.js";

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  // Our custom errors
  if (err instanceof AppError) {
    return c.json(
      {
        success: false,
        message: err.message,
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
