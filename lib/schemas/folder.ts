import { z } from "zod";

export const folderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Введите название")
    .max(64, "Максимум 64 символа"),
  parentId: z.number().int().nullable().optional(),
});

export type FolderInput = z.infer<typeof folderSchema>;
