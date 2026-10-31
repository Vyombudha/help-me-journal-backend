import type { AppEnv } from "../../shared/types/hono.js";
import { PagesController } from "./pages.controller.js";
import { Hono } from "hono";

const PagesRouter = new Hono<AppEnv>();
const WorkspacePagesRouter = new Hono<AppEnv>();

// Mounted at /pages/
PagesRouter.get("/:pageId", ...PagesController.get);

PagesRouter.patch("/:pageId/title", ...PagesController.updateTitle);

PagesRouter.patch("/:pageId/content", ...PagesController.updateContent);

PagesRouter.delete("/:pageId", ...PagesController.delete);

// Mounted at /workspace/:workspaceId/Pages
WorkspacePagesRouter.get("/", ...PagesController.getAll);
WorkspacePagesRouter.post("/", ...PagesController.new);

export { PagesRouter, WorkspacePagesRouter };
