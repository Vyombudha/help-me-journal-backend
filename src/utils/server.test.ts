import { beforeAll, describe, expect, mock, test } from "bun:test";

// Mock the Clerk package (path/specifier must match what the app imports)
mock.module("@clerk/hono", () => ({
  clerkMiddleware: () => async (_c: unknown, next: () => Promise<void>) =>
    next(),
  getAuth: () => ({ userId: "user_123" }),
}));

test("GET /health", async () => {
  const { default: server } = await import("../server");
  const res = await server.fetch(new Request("http://localhost/health"));
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
});

test("POST /projects", async () => {
    const {default : server } = await import("../server");
    const res = await server.fetch(new Request("http://locahost/projects"),{
        
    })
});
