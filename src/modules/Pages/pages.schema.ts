import { z } from "zod";
import { Mood } from "../../../generated/prisma/enums.js";

export const NewPageSchema = z.object({
  title: z.string().trim().min(1).max(500),
  moods: z.array(z.enum(Mood)),
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
