import { rateLimiter } from "hono-rate-limiter";

export const apiLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 300,
  standardHeaders: true,
  keyGenerator: (c) => c.req.header("x-forwarded-for") ?? "anonymous",
  message: { error: "Too many requests, please try again later." },
});
