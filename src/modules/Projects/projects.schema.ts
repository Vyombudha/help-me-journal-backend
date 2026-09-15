import { z } from "zod";

export const newProjectSchema = z.object({
  name: z.string().trim().min(1).max(30),
  description: z.string().min(1).max(200)
});

export const updateProjectSchema = z.object({
  newName: z.string().trim().min(1).max(100),
  newDescription: z.string().min(1).max(200)
});


export const projectIdParamSchema = z.object({
  projectId: z.uuid(),
});




export type newProjectInput = z.infer<typeof newProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProjectIdParam = z.infer<typeof projectIdParamSchema>;
