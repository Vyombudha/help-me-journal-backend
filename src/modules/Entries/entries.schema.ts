import { z } from "zod";

export const newEntrySchema = z.object({
  title: z.string().trim().min(0).max(100),
  content: z.string().min(0),
});

export type newEntryInput = z.infer<typeof newEntrySchema>;

export const updateEntrySchema = z.object({
  newTitle: z.string().trim().min(0).max(100).optional(),
  newContent: z.string().min(0).optional(),
});

export type UpdateEntryInput = z.infer<typeof updateEntrySchema>;

export const entryIdParamSchema = z.object({
  entryId: z.uuid(),
});

export type EntryIdParam = z.infer<typeof entryIdParamSchema>;
