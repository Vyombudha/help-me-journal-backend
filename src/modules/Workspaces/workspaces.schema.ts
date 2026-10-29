import { z } from "zod";

export const NewWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(30),
  description: z.string().min(1).max(200),
});

export const UpdateWorkspaceSchema = z.object({
  newName: z.string().trim().min(1).max(100),
  newDescription: z.string().min(1).max(200),
});

export const WorkspaceIdParamSchema = z.object({
  workspaceId: z.uuid(),
});

export type NewWorkspaceInput = z.infer<typeof NewWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof UpdateWorkspaceSchema>;
