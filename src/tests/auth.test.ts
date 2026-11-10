import { describe, it, expect, beforeEach } from "vitest";
import {createHonoServer} from "../app";
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../shared/types/hono";
import { createRequireAuth } from "../shared/middleware/auth.middleware";
import { db } from "../../db";
import { pages, users, workspaces } from "../../db/schema";
import { eq } from "drizzle-orm";

const noClerk: MiddlewareHandler<AppEnv> = async (_c, next) => next();




const DEFAULT_USER_1 = {
  id: "test_user_1",
  firstName: "test_user_1_name",
  emailAddress: "test_user_1@example.com"
};

function makeApp(userId: string | null = DEFAULT_USER_1.id) {
  const auth = createRequireAuth(
    () => userId,
    async () => ({
      firstName: DEFAULT_USER_1.firstName,
      emailAddresses: [{ emailAddress:DEFAULT_USER_1.emailAddress }],
    }),
  );
  return createHonoServer(noClerk, auth);
}


beforeEach(async () => {
  await db.delete(users);
});


describe("Auth + User Provisioning", () => {
  it("serves /health without auth", async () => {
    const res = await makeApp(null).request("/health");
    expect(res.status).toBe(200);
  })

  it("rejects when Clerk has no user", async () => {
    const res = await makeApp(null).request('/api/v1/workspaces');
    expect(res.status).toBe(401);
  })

  it("creates a user, default workspaces and welcome page on first requests", async () => {
    const res = await makeApp().request("/api/v1/workspaces");
    expect(res.status).toBe(200);

    const [user] = await db.select().from(users).where(eq(users.id, DEFAULT_USER_1.id));
    expect(user.email).toBe(DEFAULT_USER_1.emailAddress);


    const ws = await db.select().from(workspaces).where(eq(workspaces.ownerId, DEFAULT_USER_1.id));
    expect(ws).toHaveLength(1);
    expect(ws[0]?.isDefault).toBe(true);


    const welcome = await db.select().from(pages).where(eq(pages.workspaceId, ws[0]!.id));
    expect(welcome).toHaveLength(1);
    expect(welcome[0]?.title).toBe("Welcome To Help Me Journal!");
  })

  it("does not provision twice on later requests", async () => {
    const app = makeApp();
    await app.request("/api/v1/workspaces");
    await app.request("/api/v1/workspaces");

    const ws = await db.select().from(workspaces).where(eq(workspaces.ownerId, DEFAULT_USER_1.id));
    expect(ws).toHaveLength(1);
  });

})
