import type { Container } from "../../../generated/prisma/client.js";
import ContainerService from "./containers.service.js";
import {
  ContainerIdParamSchema,
  NewContainerSchema,
  UpdateContainerContentSchema,
  UpdateContainerNameSchema,
  type NewContainerInput,
  type UpdateContainerContentInput,
  type UpdateContainerNameInput,
} from "./containers.schema.js";
import { createFactory } from "hono/factory";
import type { AppEnv } from "../../shared/types/hono.js";
import { sValidator } from "@hono/standard-validator";
import { ProjectIdParamSchema } from "../Projects/projects.schema.js";

const factory = createFactory<AppEnv>();

const newContainer = factory.createHandlers(
  sValidator("param", ProjectIdParamSchema),
  sValidator("json", NewContainerSchema),
  async (c) => {
    const userId = c.get("userId");
    const { projectId } = c.req.valid("param");
    const body: NewContainerInput = c.req.valid("json");

    const newContainer = await ContainerService.new(
      userId,
      projectId,
      body.title,
      body.type,
      body.moods,
    );

    return c.json(
      {
        success: true,
        data: newContainer,
      },
      200,
    );
  },
);

const getAllContainers = factory.createHandlers(
  sValidator("param", ProjectIdParamSchema),
  async (c) => {
    const userId = c.get("userId");
    const { projectId } = c.req.valid("param");

    const containers = await ContainerService.getAll(userId, projectId);

    return c.json(
      {
        success: true,
        data: containers,
      },
      200,
    );
  },
);

const getContainer = factory.createHandlers(
  sValidator("param", ContainerIdParamSchema),
  async (c) => {
    const userId = c.get("userId");
    const { containerId } = c.req.valid("param");

    const container = await ContainerService.get(userId, containerId);

    return c.json(
      {
        success: true,
        data: container,
      },
      200,
    );
  },
);

const updateContainerTitle = factory.createHandlers(
  sValidator("param", ContainerIdParamSchema),
  sValidator("json", UpdateContainerNameSchema),
  async (c) => {
    const userId = c.get("userId");
    const { containerId } = c.req.valid("param");
    const body: UpdateContainerNameInput = c.req.valid("json");

    const updatedContainer = await ContainerService.updateTitle(
      userId,
      containerId,
      body.newTitle,
    );

    return c.json(
      {
        success: true,
        data: updatedContainer,
      },
      200,
    );
  },
);

const updateContainerContent = factory.createHandlers(
  sValidator("param", ContainerIdParamSchema),
  sValidator("json", UpdateContainerContentSchema),
  async (c) => {
    const userId = c.get("userId");
    const { containerId } = c.req.valid("param");
    const body: UpdateContainerContentInput = c.req.valid("json");

    const updatedContainer = await ContainerService.updateContent(
      userId,
      containerId,
      body.newContent,
    );

    return c.json(
      {
        success: true,
        data: updatedContainer,
      },
      200,
    );
  },
);

const deleteContainer = factory.createHandlers(
  sValidator("param", ContainerIdParamSchema),
  async (c) => {
    const userId = c.get("userId");
    const { containerId } = c.req.valid("param");

    await ContainerService.delete(userId, containerId);

    return c.json(
      {
        success: true,
        data: null,
      },
      200,
    );
  },
);

export const ContainerController = {
  new: newContainer,
  get: getContainer,
  getAll: getAllContainers,
  updateTitle: updateContainerTitle,
  updateContent: updateContainerContent,
  delete: deleteContainer,
};
