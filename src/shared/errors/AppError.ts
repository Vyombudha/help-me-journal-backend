import { ZodError } from "zod";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
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
    super("Validation failed", 422); // or 400, your call
    this.errors = zodError.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
  }
}
