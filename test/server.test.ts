import { beforeEach, expect, test, vi } from "vitest";
import { createMiddleware } from "hono/factory";
import type { NewContainerInput } from "../src/modules/Containers/containers.schema.js";
import { createApp } from "../src/app.js";
import { createRequireAuth } from "../src/shared/middleware/auth.middleware.js";
import { prisma } from "../src/shared/db/prisma.js";
import type { AppEnv } from "../src/shared/types/hono.js";

const { authState, getUser } = vi.hoisted(() => ({
  authState: { userId: "user_123" as string | null },
  getUser: vi.fn(async (id: string) => ({
    firstName: id,
    emailAddresses: [{ emailAddress: `${id}@example.com` }],
  })),
}));

const testClerkMiddleware = createMiddleware<AppEnv>(async (_c, next) => {
  await next();
});

const app = createApp(
  testClerkMiddleware,
  createRequireAuth(
    () => authState.userId,
    async (_c, userId) => getUser(userId),
  ),
);

beforeEach(async () => {
  authState.userId = "user_123";
  getUser.mockClear();
  await prisma.container.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
});

const call = (method: string, path: string, body?: unknown) =>
  app.fetch(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": crypto.randomUUID(),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );

type ApiResponse<T> = { success: boolean; data: T };

const readApiResponse = <T>(response: Response) =>
  response.json() as Promise<ApiResponse<T>>;

const createProject = async (name = "Trip") => {
  const res = await call("POST", "/api/v1/projects", {
    name,
    description: "Notes",
  });
  expect(res.status).toBe(200);
  return (await readApiResponse<{ id: string }>(res)).data;
};

const containerBody: NewContainerInput = {
  title: "Day 1",
  type: "JOURNAL",
  moods: ["HAPPY", "EXCITED"],
};

const createContainer = async (projectId: string) => {
  const res = await call(
    "POST",
    `/api/v1/projects/${projectId}/containers`,
    containerBody,
  );
  expect(res.status).toBe(200);
  return (await readApiResponse<{ id: string }>(res)).data;
};

test("health check is public", async () => {
  authState.userId = null;
  const res = await call("GET", "/health");
  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
});

test("API requests require authentication", async () => {
  authState.userId = null;
  const res = await call("GET", "/api/v1/projects");
  expect(res.status).toBe(401);
  expect(await res.json()).toMatchObject({
    success: false,
    message: "Unauthorized",
  });
});

test("first authenticated request creates a local user", async () => {
  const res = await call("GET", "/api/v1/projects");
  expect(res.status).toBe(200);

  const user = await prisma.user.findUnique({ where: { id: "user_123" } });
  expect(user?.email).toBe("user_123@example.com");
  expect(getUser).toHaveBeenCalledTimes(1);
});

test("user can create and list their projects", async () => {
  const project = await createProject();
  const res = await call("GET", "/api/v1/projects");
  const response = await readApiResponse<
    { id: string; name: string; description: string; ownerId: string }[]
  >(res);

  expect(res.status).toBe(200);
  expect(response.success).toBe(true);
  expect(response.data).toHaveLength(1);
  expect(response.data[0]).toMatchObject({
    id: project.id,
    name: "Trip",
    description: "Notes",
    ownerId: "user_123",
  });
});

test("user can read, update, and delete a project", async () => {
  const project = await createProject();

  const read = await call("GET", `/api/v1/projects/${project.id}`);
  expect(read.status).toBe(200);
  expect((await readApiResponse<{ name: string }>(read)).data.name).toBe("Trip");

  const update = await call("PATCH", `/api/v1/projects/${project.id}`, {
    newName: "Updated trip",
    newDescription: "Updated notes",
  });
  expect(update.status).toBe(200);
  expect((await readApiResponse<Record<string, unknown>>(update)).data).toMatchObject({
    name: "Updated trip",
    description: "Updated notes",
  });

  const remove = await call("DELETE", `/api/v1/projects/${project.id}`);
  expect(remove.status).toBe(200);
  expect(await remove.json()).toEqual({ success: true, data: null });
  expect(await prisma.project.count()).toBe(0);
});

test("invalid project input returns 400", async () => {
  const res = await call("POST", "/api/v1/projects", {
    name: "",
    description: "Notes",
  });
  expect(res.status).toBe(400);
  expect(await prisma.project.count()).toBe(0);
});

test("duplicate project name returns 409", async () => {
  await createProject();
  const res = await call("POST", "/api/v1/projects", {
    name: "Trip",
    description: "Notes",
  });
  expect(res.status).toBe(409);
});

test("a user cannot access another user's project", async () => {
  const project = await createProject();
  authState.userId = "user_456";

  const res = await call("GET", `/api/v1/projects/${project.id}`);
  expect(res.status).toBe(404);
});

test("missing or malformed project IDs return errors", async () => {
  const missing = await call(
    "GET",
    "/api/v1/projects/00000000-0000-4000-8000-000000000000",
  );
  expect(missing.status).toBe(404);

  const malformed = await call("GET", "/api/v1/projects/not-a-uuid");
  expect(malformed.status).toBe(400);
});

test("user can create and read a container", async () => {
  const project = await createProject();
  const container = await createContainer(project.id);
  const res = await call("GET", `/api/v1/containers/${container.id}`);

  expect(res.status).toBe(200);
  expect((await readApiResponse<Record<string, unknown>>(res)).data).toMatchObject({
    id: container.id,
    projectId: project.id,
    title: "Day 1",
    type: "JOURNAL",
    moods: ["HAPPY", "EXCITED"],
  });
});

test("user can list containers in a project", async () => {
  const project = await createProject();
  await createContainer(project.id);

  const res = await call("GET", `/api/v1/projects/${project.id}/containers`);
  expect(res.status).toBe(200);
  const response = await readApiResponse<{ title: string }[]>(res);
  expect(response.success).toBe(true);
  expect(response.data).toHaveLength(1);
  expect(response.data[0]?.title).toBe("Day 1");
});

test("user can update a container title and content, then delete it", async () => {
  const project = await createProject();
  const container = await createContainer(project.id);

  const updateTitle = await call(
    "PATCH",
    `/api/v1/containers/${container.id}/title`,
    {
      newTitle: "Updated entry",
    },
  );

  expect(updateTitle.status).toBe(200);
  expect(
    (await readApiResponse<Record<string, unknown>>(updateTitle)).data,
  ).toMatchObject({
    title: "Updated entry",
  });

  const updateContent = await call(
    "PATCH",
    `/api/v1/containers/${container.id}/content`,
    {
      newContent: "Updated Content",
    },
  );
  expect(updateContent.status).toBe(200);
  expect(
    (await readApiResponse<Record<string, unknown>>(updateContent)).data,
  ).toMatchObject({
    content: "Updated Content",
  });

  const clearContent = await call(
    "PATCH",
    `/api/v1/containers/${container.id}/content`,
    { newContent: "   " },
  );
  expect(clearContent.status).toBe(200);
  expect(
    (await readApiResponse<Record<string, unknown>>(clearContent)).data,
  ).toMatchObject({ content: "" });

  const longContent = "x".repeat(1_000);
  const updateLongContent = await call(
    "PATCH",
    `/api/v1/containers/${container.id}/content`,
    { newContent: longContent },
  );
  expect(updateLongContent.status).toBe(200);
  expect(
    (await readApiResponse<Record<string, unknown>>(updateLongContent)).data,
  ).toMatchObject({
    content: longContent,
  });

  const remove = await call("DELETE", `/api/v1/containers/${container.id}`);
  expect(remove.status).toBe(200);
  expect(await remove.json()).toEqual({ success: true, data: null });
  expect(await prisma.container.count()).toBe(0);
});

test("invalid container input returns 400", async () => {
  const project = await createProject();
  const res = await call("POST", `/api/v1/projects/${project.id}/containers`, {
    ...containerBody,
    moods: ["NOT_A_MOOD"],
  });

  expect(res.status).toBe(400);
  expect(await prisma.container.count()).toBe(0);
});

test("container content must be a string", async () => {
  const project = await createProject();
  const container = await createContainer(project.id);

  const res = await call(
    "PATCH",
    `/api/v1/containers/${container.id}/content`,
    { newContent: 42 },
  );

  expect(res.status).toBe(400);
});

test("duplicate container title in a project returns 409", async () => {
  const project = await createProject();
  await createContainer(project.id);
  const res = await call(
    "POST",
    `/api/v1/projects/${project.id}/containers`,
    containerBody,
  );
  expect(res.status).toBe(409);
});

test("a user cannot access another user's container", async () => {
  const project = await createProject();
  const container = await createContainer(project.id);
  authState.userId = "user_456";

  const res = await call("GET", `/api/v1/containers/${container.id}`);
  expect(res.status).toBe(404);
});

test("missing project or container returns 404", async () => {
  const missingId = "00000000-0000-4000-8000-000000000000";
  const project = await call("GET", `/api/v1/projects/${missingId}`);
  const container = await call("GET", `/api/v1/containers/${missingId}`);

  expect(project.status).toBe(404);
  expect(container.status).toBe(404);
});

test("deleting a project also deletes its containers", async () => {
  const project = await createProject();
  await createContainer(project.id);

  const res = await call("DELETE", `/api/v1/projects/${project.id}`);
  expect(res.status).toBe(200);
  expect(await prisma.container.count()).toBe(0);
});
