import { Container } from "../../../generated/prisma/client.js";
import { Request, Response } from "express";
import {
  newContainerInput,
  updateContainerSchema,
  ContainerIdParam,
  UpdateContainerInput,
} from "./containers.schema.js";
import { SuccessResponse } from "../../shared/types/express.js";
import ContainerService from "./containers.service.js";
import { ProjectIdParam } from "../Projects/projects.schema.js";

const newContainer = async (
  req: Request<ProjectIdParam>,
  res: Response<SuccessResponse<Container>>,
): Promise<void> => {
  const userId = req.userId;
  const { projectId } = req.params;
  const body: newContainerInput = req.body;
  const newContainer = await ContainerService.new(
    userId,
    projectId,
    body.title,
    body.type,
    body.moods,
  );
  res.status(200).json({
    success: true,
    data: newContainer,
  });
};

const getAllContainers = async (
  req: Request<ProjectIdParam>,
  res: Response<SuccessResponse<Array<Container>>>,
): Promise<void> => {
  const userId = req.userId;
  const { projectId } = req.params;

  const containers = await ContainerService.getAll(userId, projectId);
  res.status(200).json({
    success: true,
    data: containers,
  });
};

const getContainer = async (
  req: Request<ContainerIdParam>,
  res: Response<SuccessResponse<Container>>,
): Promise<void> => {
  const userId = req.userId;
  const { containerId } = req.params;
  const container = await ContainerService.get(userId, containerId);

  res.status(200).json({
    success: true,
    data: container,
  });
};

const updateConainerTitle = async (
  req: Request<ContainerIdParam>,
  res: Response<SuccessResponse<Container>>,
): Promise<void> => {
  const userId = req.userId;
  const { containerId } = req.params;
  const body: UpdateContainerInput = req.body;
  const updateConainer = await ContainerService.updateName(
    userId,
    containerId,
    body.newTitle,
    body.newMoods,
  );

  res.status(200).json({
    success: true,
    data: updateConainer,
  });
};

const deleteContainer = async (
  req: Request<ContainerIdParam>,
  res: Response<SuccessResponse<null>>,
): Promise<void> => {
  const userId = req.userId;
  const { containerId } = req.params;
  await ContainerService.delete(userId, containerId);

  res.status(200).json({
    success: true,
    data: null,
  });
};

export const ContainerController = {
  new: newContainer,
  get: getContainer,
  getAll: getAllContainers,
  updateTitle: updateConainerTitle,
  delete: deleteContainer,
};
