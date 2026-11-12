import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../db";
import { pages, users, workspaces } from "../../db/schema";
import { and, eq } from "drizzle-orm";
import { makeApp, USER_1, json, USER_2 } from "./test.setup";

beforeEach(async () => {
  await db.delete(users);
});

describe("POST /api/v1/workspaces/:workspaceId/pages", () => {
  let pageId: string;
  let workspaceId: string;
  beforeEach(async () => {
    await makeApp().request("/api/v1/workspaces"); // provisions user 1
    const [ws] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerId, USER_1.id));
    const [page] = await db
      .insert(pages)
      .values({
        workspaceId: ws!.id,
        title: "secret",
        content: "[]",
        moods: [],
      })
      .returning();
    workspaceId = page.workspaceId;
    pageId = page!.id;
  });

  it("creates a new page for user in given workspace", async () => {
    const app = makeApp();
    const res = await app.request(
      `/api/v1/workspaces/${workspaceId}/pages`,
      json("POST", { title: "page for user1", moods: [] }),
    );
    expect(res.status).toBe(200);

    const body = (await res.json()) as any;
    const newId: string = body.data.id; // match your real response shape

    const [page] = await db.select().from(pages).where(eq(pages.id, newId));
    expect(page?.title).toBe("page for user1");
    expect(page?.workspaceId).toBe(workspaceId);
    expect(newId).not.toBe(pageId); // it's a new page, not the seeded one
  });

  it("rejects an invalid body", async () => {
    const res = await makeApp().request(
      `/api/v1/workspaces/${workspaceId}/pages`,
      json("POST", { title: "" }),
    );
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/v1/pages/:pageId", () => {
  let pageId: string;
  let workspaceId: string;
  beforeEach(async () => {
    await makeApp().request("/api/v1/workspaces"); // provisions user 1
    const [ws] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerId, USER_1.id));
    const [page] = await db
      .insert(pages)
      .values({
        workspaceId: ws!.id,
        title: "secret",
        content: "[]",
        moods: [],
      })
      .returning();
    workspaceId = page.workspaceId;
    pageId = page!.id;
  });

  it("updates only on title", async () => {
    const app = makeApp();

    const res = await app.request(
      `/api/v1/pages/${pageId}/title`,
      json("PATCH", { newTitle: "Renamed" }),
    );
    expect(res.status).toBe(200);

    const [after] = await db
      .select()
      .from(pages)
      .where(and(eq(pages.id, pageId), eq(pages.workspaceId, workspaceId)));
    expect(after?.title).toBe("Renamed");
    expect(after?.content).toBe("[]"); // untouched
  });

  it("updates only on content", async () => {
    const app = makeApp();

    const res = await app.request(
      `/api/v1/pages/${pageId}/content`,
      json("PATCH", { newContent: "[Renamed]" }),
    );
    expect(res.status).toBe(200);

    const [after] = await db
      .select()
      .from(pages)
      .where(and(eq(pages.id, pageId), eq(pages.workspaceId, workspaceId)));
    expect(after?.title).toBe("secret");
    expect(after?.content).toBe("[Renamed]"); // untouched
  });
});

describe("DELETE /api/v1/pages/:pageId", () => {
  let pageId: string;
  let workspaceId: string;
  beforeEach(async () => {
    await makeApp().request("/api/v1/workspaces"); // provisions user 1
    const [ws] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerId, USER_1.id));
    const [page] = await db
      .insert(pages)
      .values({
        workspaceId: ws!.id,
        title: "secret",
        content: "[]",
        moods: [],
      })
      .returning();
    workspaceId = page.workspaceId;
    pageId = page!.id;
  });

  it("owner can delete it (control)", async () => {
    const res = await makeApp(USER_1).request(`/api/v1/pages/${pageId}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(200);
    const rows = await db.select().from(pages).where(eq(pages.id, pageId));
    expect(rows).toHaveLength(0);
  });
});

describe("IDOR: user 2 cannot touch user 1's pages", () => {
  let pageId: string;

  beforeEach(async () => {
    await makeApp(USER_1).request("/api/v1/workspaces"); // provisions user 1
    await makeApp(USER_2).request("/api/v1/workspaces"); // provisions user 2

    const [ws] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerId, USER_1.id));
    const [page] = await db
      .insert(pages)
      .values({
        workspaceId: ws!.id,
        title: "secret",
        content: "[]",
        moods: [],
      })
      .returning();
    pageId = page!.id;
  });

  it("owner can read it (control)", async () => {
    const res = await makeApp(USER_1).request(`/api/v1/pages/${pageId}`);
    expect(res.status).toBe(200);
  });

  it("cannot read it", async () => {
    const res = await makeApp(USER_2).request(`/api/v1/pages/${pageId}`);
    expect(res.status).toBe(404);
  });

  it("cannot delete it", async () => {
    const res = await makeApp(USER_2).request(`/api/v1/pages/${pageId}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(404);

    const rows = await db.select().from(pages).where(eq(pages.id, pageId));
    expect(rows).toHaveLength(1);
  });

  it("cannot update page title", async () => {
    const res = await makeApp(USER_2).request(
      `/api/v1/pages/${pageId}/title`,
      json("PATCH", { newTitle: "hacked page title" }),
    );
    expect(res.status).toBe(404);

    const rows = await db.select().from(pages).where(eq(pages.id, pageId));
    expect(rows.find((r) => r.id === pageId)?.title).toBe("secret");
  });

  it("cannot update page content", async () => {
    const res = await makeApp(USER_2).request(
      `/api/v1/pages/${pageId}/content`,
      json("PATCH", { newContent: "[hacked page content]" }),
    );
    expect(res.status).toBe(404);

    const rows = await db.select().from(pages).where(eq(pages.id, pageId));
    expect(rows.find((r) => r.id === pageId)?.content).toBe("[]");
  });
});
