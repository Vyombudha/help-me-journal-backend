import { ZodError } from "zod";

import type { ContentfulStatusCode } from "hono/utils/http-status";

export class AppError extends Error {
  public readonly statusCode: ContentfulStatusCode;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: ContentfulStatusCode = 500,
    isOperational = true,
  ) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = "To Many Request") {
    super(message, 429);
  }
}

export class ValidationError extends AppError {
  public readonly errors: { path: string; message: string }[];

  constructor(zodError: ZodError) {
    super("Validation failed", 422);
    this.errors = zodError.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409);
  }
}
