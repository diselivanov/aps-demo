import { z } from "zod";

export const fieldTypeSchema = z.enum([
  "STRING",
  "TEXT",
  "NUMBER",
  "DATE",
  "SELECT",
  "MULTI_SELECT",
  "FILE",
]);

export const fieldSchema = z.object({
  label: z.string().trim().min(1, "Введите название поля").max(64),
  type: fieldTypeSchema,
  required: z.boolean().default(false),
  options: z.array(z.string().trim().min(1)).optional(),
});

export const tableSchema = z.object({
  name: z.string().trim().min(1, "Введите название").max(64),
  folderId: z.number().int().nullable().optional(),
  fields: z.array(fieldSchema).min(1, "Минимум одно поле"),
});

export const tableUpdateSchema = z.object({
  name: z.string().trim().min(1, "Введите название").max(64).optional(),
  folderId: z.number().int().nullable().optional(),
});

export type FieldInput = z.infer<typeof fieldSchema>;
export type TableInput = z.infer<typeof tableSchema>;
export type TableUpdateInput = z.infer<typeof tableUpdateSchema>;
