import { z } from "zod";
import { ContainerType, Mood } from "../../../generated/prisma/enums.js";

export const NewContainerSchema = z.object({
  title: z.string().trim().min(1).max(100),
  type: z.enum(ContainerType),
  moods: z.array(z.enum(Mood)),
});

export type NewContainerInput = z.infer<typeof NewContainerSchema>;

export const UpdateContainerNameSchema = z.object({
  newTitle: z.string().trim().min(1).max(100),
});

export type UpdateContainerNameInput = z.infer<
  typeof UpdateContainerNameSchema
>;

export const UpdateContainerContentSchema = z.object({
  newContent: z.string().trim().max(100),
});

export type UpdateContainerContentInput = z.infer<
  typeof UpdateContainerContentSchema
>;

export const ContainerIdParamSchema = z.object({
  containerId: z.uuid(),
});
