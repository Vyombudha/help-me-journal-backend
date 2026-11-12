import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../db";
import { pages, users, workspaces } from "../../db/schema";
import { eq } from "drizzle-orm";
import { makeApp, NullUser, USER_1 } from "./test.setup";
beforeEach(async () => {
  await db.delete(users);
});

describe("Auth + User Provisioning", () => {
  it("serves /health without auth", async () => {
    const res = await makeApp().request("/health");
    expect(res.status).toBe(200);
  });

  it("returns 401 Unauthorized when no Clerk user is present", async () => {
    const noUser: NullUser = {
      id: null,
      emailAddress: "no email",
      firstName: "no name",
    };
    const res = await makeApp(noUser).request("/api/v1/workspaces");
    expect(res.status).toBe(401);
  });

  it("creates a user, default workspaces and welcome page on first requests", async () => {
    const res = await makeApp().request("/api/v1/workspaces");
    expect(res.status).toBe(200);

    const [user] = await db.select().from(users).where(eq(users.id, USER_1.id));
    expect(user.email).toBe(USER_1.emailAddress);

    const ws = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerId, USER_1.id));
    expect(ws).toHaveLength(1);
    expect(ws[0]?.isDefault).toBe(true);

    const welcome = await db
      .select()
      .from(pages)
      .where(eq(pages.workspaceId, ws[0]!.id));
    expect(welcome).toHaveLength(1);
    expect(welcome[0]?.title).toBe("Welcome To Help Me Journal!");
  });

  it("does not provision twice on later requests", async () => {
    const app = makeApp();
    await app.request("/api/v1/workspaces");
    await app.request("/api/v1/workspaces");

    const ws = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerId, USER_1.id));
    expect(ws).toHaveLength(1);
  });
});
