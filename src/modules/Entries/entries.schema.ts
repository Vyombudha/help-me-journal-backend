import { z } from "zod";

export const newEntrySchema = z.object({
  title: z.string().trim().min(1).max(100),
  content: z.string().min(1),
});

export type newEntryInput = z.infer<typeof newEntrySchema>;

export const updateEntrySchema = z.object({
  newTitle: z.string().trim().min(1).max(100),
  newContent: z.string().min(1),
});

export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;

export const entryIdParamSchema = z.object({
  entryId: z.uuid(),
});

export type EntryIdParam = z.infer<typeof entryIdParamSchema>;
