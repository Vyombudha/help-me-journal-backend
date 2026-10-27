import { z } from "zod";

export const NewProjectSchema = z.object({
  name: z.string().trim().min(1).max(30),
  description: z.string().min(1).max(200),
});

export const UpdateProjectSchema = z.object({
  newName: z.string().trim().min(1).max(100),
  newDescription: z.string().min(1).max(200),
});

export const ProjectIdParamSchema = z.object({
  projectId: z.uuid(),
});

export type NewProjectInput = z.infer<typeof NewProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
