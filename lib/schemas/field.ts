import { z } from "zod";

export const fieldUpdateSchema = z.object({
  label: z.string().trim().min(1, "Введите название поля").max(64).optional(),
  required: z.boolean().optional(),
  options: z.array(z.string().trim().min(1)).nullable().optional(),
  order: z.number().int().min(0).optional(),
});

export type FieldUpdateInput = z.infer<typeof fieldUpdateSchema>;
