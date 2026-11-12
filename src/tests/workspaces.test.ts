import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../db";
import { pages, users, workspaces } from "../../db/schema";
import { eq } from "drizzle-orm";
import { USER_1, USER_2, makeApp, json } from "./test.setup";

beforeEach(async () => {
  await db.delete(users);
});

describe("POST /api/v1/workspaces", () => {
  it("creates a new workspace for user", async () => {
    const app = makeApp();
    const res = await app.request(
      "/api/v1/workspaces",
      json("POST", {
        name: "WORKSPACE FOR USER 1",
        description: "IT IS THE WORKSPACE FOR TEST STUFF",
      }),
    );
    expect(res.status).toBe(200);

    const rows = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerId, USER_1.id));
    expect(rows.some((w) => w.name === "WORKSPACE FOR USER 1")).toBe(true);
  });

  it("rejects an invalid body", async () => {
    const res = await makeApp().request(
      "/api/v1/workspaces",
      json("POST", { name: "" }),
    );
    expect(res.status).toBe(400);
  });
});

describe("PATCH /api/v1/workspaces/:workspaceId", () => {
  it("updates only the given fields", async () => {
    const app = makeApp();
    await app.request("/api/v1/workspaces");

    const [ws] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerId, USER_1.id));

    const res = await app.request(
      `/api/v1/workspaces/${ws!.id}`,
      json("PATCH", { newName: "Renamed", newDescription: ws!.description }),
    );
    expect(res.status).toBe(200);

    const [after] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, ws!.id));
    expect(after?.name).toBe("Renamed");
    expect(after?.description).toBe(ws!.description); // untouched
  });

  it("rejects invalid fields", async () => {
    const app = makeApp();
    await app.request("/api/v1/workspaces");

    const [ws] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.ownerId, USER_1.id));

    const res = await app.request(
      `/api/v1/workspaces/${ws!.id}`,
      json("PATCH", { name: "Renamed", describe: "Renamed Description" }),
    );
    expect(res.status).toBe(400);

    const [after] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, ws!.id));
    expect(after?.name).not.toBe("Renamed");
    expect(after?.description).not.toBe("Renamed Description");
  });
});

describe("DELETE /api/v1/workspaces/:workspaceId", () => {
  it("removes the workspace and its pages", async () => {
    const app = makeApp();
    // 1. create a workspace through the API
    const createRes = await app.request(
      "/api/v1/workspaces",
      json("POST", {
        name: "my workspace",
        description: "This workspace exists",
      }),
    );
    expect(createRes.status).toBe(200);

    const created = (await createRes.json()) as any;
    const id: string = created.data.id;

    const res = await makeApp().request(`/api/v1/workspaces/${id}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(200);

    const rows = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, id));
    expect(rows).toHaveLength(0);
  });
});

describe("IDOR: user 2 cannot touch user 1's workspace", () => {
  let wsId: string;

  beforeEach(async () => {
    // user 1 creates a workspace
    const res = await makeApp(USER_1).request(
      "/api/v1/workspaces",
      json("POST", { name: "private", description: "user 1 only" }),
    );
    const body = (await res.json()) as any;
    wsId = body.data.id;
    await makeApp(USER_2).request("/api/v1/workspaces");
  });

  it("cannot read it", async () => {
    const ownerRes = await makeApp(USER_1).request(
      `/api/v1/workspaces/${wsId}`,
    );
    expect(ownerRes.status).toBe(200);

    const res = await makeApp(USER_2).request(`/api/v1/workspaces/${wsId}`);
    expect(res.status).toBe(404);
  });

  it("cannot rename it", async () => {
    const ownerRes = await makeApp(USER_1).request(
      `/api/v1/workspaces/${wsId}`,
    );
    expect(ownerRes.status).toBe(200);

    const res = await makeApp(USER_2).request(
      `/api/v1/workspaces/${wsId}`,
      json("PATCH", { newName: "hacked", newDescription: "hacked workspace" }),
    );
    expect(res.status).toBe(404);

    const [row] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, wsId));
    expect(row?.name).toBe("private"); // unchanged
  });

  it("cannot delete it", async () => {
    const ownerRes = await makeApp(USER_1).request(
      `/api/v1/workspaces/${wsId}`,
    );
    expect(ownerRes.status).toBe(200);

    const res = await makeApp(USER_2).request(`/api/v1/workspaces/${wsId}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(404);

    const rows = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, wsId));
    expect(rows).toHaveLength(1); // still there
  });
  it("cannot list or create pages in it", async () => {
    const ownerRes = await makeApp(USER_1).request(
      `/api/v1/workspaces/${wsId}`,
    );
    expect(ownerRes.status).toBe(200);

    const list = await makeApp(USER_2).request(
      `/api/v1/workspaces/${wsId}/pages`,
    );
    expect(list.status).toBe(404);

    const create = await makeApp(USER_2).request(
      `/api/v1/workspaces/${wsId}/pages`,
      json("POST", { title: "injected", moods: [] }),
    );
    expect(create.status).toBe(404);

    const injected = await db
      .select()
      .from(pages)
      .where(eq(pages.workspaceId, wsId));
    expect(injected.some((p) => p.title === "injected")).toBe(false);
  });
});
