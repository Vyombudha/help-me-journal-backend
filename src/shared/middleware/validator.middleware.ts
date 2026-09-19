// middleware/validate.ts
import { Request, Response, NextFunction } from "express";
import { RequestPart } from "../types/express.js";
import { ZodError, ZodType } from "zod";
import { ValidationError } from "../errors/AppError.js";

export const validateSchema = (schema: ZodType, part: RequestPart = "body") => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req[part] = schema.parse(req[part]);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        throw new ValidationError(err);
      }
      next(err);
    }
  };
};
