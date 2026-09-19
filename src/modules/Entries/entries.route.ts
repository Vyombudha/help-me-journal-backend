import { Router } from "express";
import { validateSchema } from "../../shared/middleware/validator.middleware.js";
import { asyncHandler } from "../../shared/middleware/asyncHandler.middleware.js";
import { containerIdParamSchema } from "../Containers/containers.schema.js";
import {
  entryIdParamSchema,
  newEntrySchema,
  updateEntrySchema,
} from "./entries.schema.js";
import { EntryController } from "./entries.controller.js";

const EntriesRouter = Router();
const ContainerEntriesRouter = Router({ mergeParams: true });

// Mounted at /entries
EntriesRouter.get(
  "/:entryId",
  validateSchema(entryIdParamSchema, "params"),
  asyncHandler(EntryController.get),
);
EntriesRouter.patch(
  "/:entryId",
  validateSchema(entryIdParamSchema, "params"),
  validateSchema(updateEntrySchema),
  asyncHandler(EntryController.updateData),
);
EntriesRouter.delete(
  "/:entryId",
  validateSchema(entryIdParamSchema, "params"),
  asyncHandler(EntryController.delete),
);

// Mounted at /containers/:containerId/entries
ContainerEntriesRouter.get(
  "/",
  validateSchema(containerIdParamSchema, "params"),
  asyncHandler(EntryController.getAll),
);
ContainerEntriesRouter.post(
  "/",
  validateSchema(containerIdParamSchema, "params"),
  validateSchema(newEntrySchema),
  asyncHandler(EntryController.new),
);

export { EntriesRouter, ContainerEntriesRouter };
