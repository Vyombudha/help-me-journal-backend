declare global {
  namespace Express {
    interface Request {
      userId: string;
    }
  }
}

export type RequestPart = "body" | "params" | "query";

export {};
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
}
