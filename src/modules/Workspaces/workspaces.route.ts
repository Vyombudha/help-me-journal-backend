import { Hono } from "hono";
import type { AppEnv } from "../../shared/types/hono.js";
import { WorkspacesController } from "./workspaces.controller.js";
const WorkspacesRouter = new Hono<AppEnv>();

WorkspacesRouter.get("/", ...WorkspacesController.getAll);

WorkspacesRouter.post("/", ...WorkspacesController.new);

WorkspacesRouter.get("/:workspaceId", ...WorkspacesController.get);

WorkspacesRouter.patch("/:workspaceId", ...WorkspacesController.updateName);

WorkspacesRouter.delete("/:workspaceId", ...WorkspacesController.delete);

export { WorkspacesRouter };
