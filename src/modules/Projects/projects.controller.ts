import { Project } from "../../../generated/prisma/client.js";
import ProjectsService from "./projects.service.js";
import { Request, Response } from "express";
import { newProjectInput, UpdateProjectInput, ProjectIdParam } from "./projects.schema.js";
import { SuccessResponse } from "../../shared/types/express.js";



const newProject = async (
    req: Request,
    res: Response<SuccessResponse<Project>>
): Promise<void> => {
    const userId = req.userId;
    const body: newProjectInput = req.body;
    const newProject = await ProjectsService.new(userId, body.name, body.description);
    res.status(200).json({
        success: true,
        data: newProject
    });
};

const getAllProjects = async (
    req: Request,
    res: Response<SuccessResponse<Array<Project>>>
): Promise<void> => {
    const userId = req.userId;
    const projects = await ProjectsService.getAll(userId);
    res.status(200).json({
        success: true,
        data: projects
    })
}



const getProject = async (
    req: Request<ProjectIdParam>,
    res: Response<SuccessResponse<Project>>
): Promise<void> => {
    const userId = req.userId;
    const { projectId } = req.params;
    const project = await ProjectsService.get(userId, projectId);

    res.status(200).json({
        success: true,
        data: project
    });
}



const updateProjectName = async (
    req: Request<ProjectIdParam>,
    res: Response<SuccessResponse<Project>>
): Promise<void> => {
    const userId = req.userId;
    const { projectId } = req.params;
    const body: UpdateProjectInput = req.body;

    const updatedProject = await ProjectsService.updateName(
        userId,
        projectId,
        body.newName,
        body.newDescription
    );

    res.status(200).json({
        success: true,
        data: updatedProject
    });
};


const deleteProject = async (
    req: Request<ProjectIdParam>,
    res: Response<SuccessResponse<null>>
): Promise<void> => {
    const userId = req.userId;
    const { projectId } = req.params;
    await ProjectsService.delete(userId, projectId);

    res.status(200).json({
        success: true,
        data: null
    });
}


export const ProjectsController = {
    new: newProject,
    get: getProject,
    getAll: getAllProjects,
    updateName: updateProjectName,
    delete: deleteProject
}

