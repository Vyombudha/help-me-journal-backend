import { Response, Request, NextFunction } from "express";
import { AppError } from "../errors/AppError.js";
import { Prisma } from "../../../generated/prisma/client.js";

function isAppError(err: unknown): err is AppError {
  return (
    typeof err === "object" &&
    err !== null &&
    "statusCode" in err &&
    typeof (err as any).statusCode === "number"
  );
}

export async function globalErrorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // this handles all custom errors
  if (isAppError(err)) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // known Prisma errors (e.g. P2025 = record not found)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Resource not found",
      });
    }
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "Duplicate entry",
      });
    }
    console.error(`Prisma error [${err.code}]: ${err.message}`);
    return res.status(400).json({
      success: false,
      message: "Database error",
    });
  }

  // generic errors
  const message = err instanceof Error ? err.message : "Unknown error";
  console.error(`Error: ${message}`);

  // generic errors handled here

  return res.status(500).json({
    success: false,
    message: `Internal Server Error`,
  });
}
