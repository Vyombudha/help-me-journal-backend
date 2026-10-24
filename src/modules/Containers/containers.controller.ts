import type { Container } from "../../../generated/prisma/client.js";
import ContainerService from "./containers.service.js";
import {
  type newContainerInput,
  type UpdateContainerInput,
  containerIdParamSchema,
  newContainerSchema,
  updateContainerSchema,
} from "./containers.schema.js";
import { createFactory } from "hono/factory";
import type { AppEnv } from "../../shared/types/hono.js";
import { sValidator } from "@hono/standard-validator";
import { projectIdParamSchema } from "../Projects/projects.schema.js";

const factory = createFactory<AppEnv>();

const newContainer = factory.createHandlers(
  sValidator("param", projectIdParamSchema),
  sValidator("json", newContainerSchema),
  async (c) => {
    const userId = c.get("userId");
    const { projectId } = c.req.valid("param");
    const body: newContainerInput = c.req.valid("json");

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
  sValidator("param", projectIdParamSchema),
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
  sValidator("param", containerIdParamSchema),
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
  sValidator("param", containerIdParamSchema),
  sValidator("json", updateContainerSchema),
  async (c) => {
    const userId = c.get("userId");
    const { containerId } = c.req.valid("param");
    const body: UpdateContainerInput = c.req.valid("json");

    const updatedContainer = await ContainerService.updateName(
      userId,
      containerId,
      body.newTitle,
      body.newMoods,
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
  sValidator("param", containerIdParamSchema),
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
  delete: deleteContainer,
};
