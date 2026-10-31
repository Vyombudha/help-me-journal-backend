import { z } from "zod";
import { MOODS } from "../../../db/schema";

export const NewPageSchema = z.object({
  title: z.string().trim().min(1).max(500),
  moods: z.array(z.enum(MOODS)),
});

export type NewPageInput = z.infer<typeof NewPageSchema>;

export const UpdatePageNameSchema = z.object({
  newTitle: z.string().trim().min(1).max(500),
});

export type UpdatePageNameInput = z.infer<typeof UpdatePageNameSchema>;

export const UpdatePageContentSchema = z.object({
  newContent: z.string().trim(),
});

export type UpdatePageContentInput = z.infer<typeof UpdatePageContentSchema>;

export const PageIdParamSchema = z.object({
  pageId: z.uuid(),
});
