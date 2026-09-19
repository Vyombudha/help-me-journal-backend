import { Entry } from "../../../generated/prisma/client.js";
import { Request, Response } from "express";

import {
  newEntryInput,
  UpdateEntryInput,
  EntryIdParam,
} from "./entries.schema.js";
import { SuccessResponse } from "../../shared/types/express.js";
import EntryService from "./entries.service.js";
import { ContainerIdParam } from "../Containers/containers.schema.js";

const newEntry = async (
  req: Request<ContainerIdParam>,
  res: Response<SuccessResponse<Entry>>,
): Promise<void> => {
  const userId = req.userId;
  const { containerId } = req.params;
  const body: newEntryInput = req.body;
  const newEntry = await EntryService.new(
    userId,
    containerId,
    body.title,
    body.content,
  );
  res.status(200).json({
    success: true,
    data: newEntry,
  });
};

const getAllEntries = async (
  req: Request<ContainerIdParam>,
  res: Response<SuccessResponse<Entry[]>>,
): Promise<void> => {
  const userId = req.userId;
  const { containerId } = req.params;

  const entries = await EntryService.getAll(userId, containerId);
  res.status(200).json({
    success: true,
    data: entries,
  });
};

const getEntry = async (
  req: Request<EntryIdParam>,
  res: Response<SuccessResponse<Entry>>,
): Promise<void> => {
  const userId = req.userId;
  const { entryId } = req.params;
  const entry = await EntryService.get(userId, entryId);

  res.status(200).json({
    success: true,
    data: entry,
  });
};

const updateEntryData = async (
  req: Request<EntryIdParam>,
  res: Response<SuccessResponse<Entry>>,
): Promise<void> => {
  const userId = req.userId;
  const { entryId } = req.params;
  const body: UpdateEntryInput = req.body;
  const updatedEntry = await EntryService.updateData(
    userId,
    entryId,
    body.newTitle,
    body.newContent,
  );

  res.status(200).json({
    success: true,
    data: updatedEntry,
  });
};

const deleteEntry = async (
  req: Request<EntryIdParam>,
  res: Response<SuccessResponse<null>>,
): Promise<void> => {
  const userId = req.userId;
  const { entryId } = req.params;
  await EntryService.delete(userId, entryId);

  res.status(200).json({
    success: true,
    data: null,
  });
};

export const EntryController = {
  new: newEntry,
  get: getEntry,
  getAll: getAllEntries,
  updateData: updateEntryData,
  delete: deleteEntry,
};
