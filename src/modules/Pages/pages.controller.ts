import { PagesService } from "./pages.service.js";
import {
  PageIdParamSchema,
  NewPageSchema,
  UpdatePageContentSchema,
  UpdatePageNameSchema,
  type NewPageInput,
  type UpdatePageContentInput,
  type UpdatePageNameInput,
} from "./pages.schema.js";
import { createFactory } from "hono/factory";
import type { AppEnv } from "../../shared/types/hono.js";
import { sValidator } from "@hono/standard-validator";
import { WorkspaceIdParamSchema } from "../Workspaces/workspaces.schema.js";
import { Page } from "../../../db/schema.js";

const factory = createFactory<AppEnv>();

const newPage = factory.createHandlers(
  sValidator("param", WorkspaceIdParamSchema),
  sValidator("json", NewPageSchema),
  async (c) => {
    const userId = c.get("userId");
    const { workspaceId } = c.req.valid("param");
    const body: NewPageInput = c.req.valid("json");

    const newPage: Page = await PagesService.new(
      userId,
      workspaceId,
      body.title,
      body.moods,
    );

    return c.json(
      {
        success: true,
        data: newPage,
      },
      200,
    );
  },
);

const getAllPages = factory.createHandlers(
  sValidator("param", WorkspaceIdParamSchema),
  async (c) => {
    const userId = c.get("userId");
    const { workspaceId } = c.req.valid("param");

    const pages = await PagesService.getAll(userId, workspaceId);

    return c.json(
      {
        success: true,
        data: pages,
      },
      200,
    );
  },
);

const getPage = factory.createHandlers(
  sValidator("param", PageIdParamSchema),
  async (c) => {
    const userId = c.get("userId");
    const { pageId } = c.req.valid("param");

    const page: Page = await PagesService.get(userId, pageId);

    return c.json(
      {
        success: true,
        data: page,
      },
      200,
    );
  },
);

const updatePageTitle = factory.createHandlers(
  sValidator("param", PageIdParamSchema),
  sValidator("json", UpdatePageNameSchema),
  async (c) => {
    const userId = c.get("userId");
    const { pageId } = c.req.valid("param");
    const body: UpdatePageNameInput = c.req.valid("json");

    const updatedPage: Page = await PagesService.updateTitle(
      userId,
      pageId,
      body.newTitle,
    );

    return c.json(
      {
        success: true,
        data: updatedPage,
      },
      200,
    );
  },
);

const updatePageContent = factory.createHandlers(
  sValidator("param", PageIdParamSchema),
  sValidator("json", UpdatePageContentSchema),
  async (c) => {
    const userId = c.get("userId");
    const { pageId } = c.req.valid("param");
    const body: UpdatePageContentInput = c.req.valid("json");

    const updatedPage: Page = await PagesService.updateContent(
      userId,
      pageId,
      body.newContent,
    );

    return c.json(
      {
        success: true,
        data: updatedPage,
      },
      200,
    );
  },
);

const deletePage = factory.createHandlers(
  sValidator("param", PageIdParamSchema),
  async (c) => {
    const userId = c.get("userId");
    const { pageId } = c.req.valid("param");

    await PagesService.delete(userId, pageId);

    return c.json(
      {
        success: true,
        data: null,
      },
      200,
    );
  },
);

export const PagesController = {
  new: newPage,
  get: getPage,
  getAll: getAllPages,
  updateTitle: updatePageTitle,
  updateContent: updatePageContent,
  delete: deletePage,
};
