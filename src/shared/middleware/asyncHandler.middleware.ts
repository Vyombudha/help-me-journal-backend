import { Request, Response, NextFunction } from "express";

export const asyncHandler = <Req extends Request, Res extends Response>(
  fn: (req: Req, res: Res, next: NextFunction) => Promise<void>,
) => {
  return (req: Req, res: Res, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
