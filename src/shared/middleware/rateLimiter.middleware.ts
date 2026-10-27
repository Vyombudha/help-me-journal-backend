import { rateLimiter } from "hono-rate-limiter";
import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../types/hono.js";

let limiter: ReturnType<typeof rateLimiter> | undefined;

export const apiLimiter = createMiddleware<AppEnv>(async (c, next) => {
  limiter ??= rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 300,
    standardHeaders: true,
    keyGenerator: (c) => c.req.header("cf-connecting-ip") ?? "anonymous",
    message: { error: "Too many requests, please try again later." },
  });
  return (limiter as any)(c, next);
});
