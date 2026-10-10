import { z } from "zod";

export const rowValueSchema = z.object({
  fieldId: z.number().int(),
  valueString: z.string().nullable().optional(),
  valueNumber: z.number().nullable().optional(),
  valueDate: z.string().nullable().optional(),
  order: z.number().int().min(0).default(0),
});

export const rowSchema = z.object({
  values: z.array(rowValueSchema),
});

export const rowQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(25),
  sort: z.string().optional(),
  dir: z.enum(["asc", "desc"]).default("desc"),
});

export type RowValueInput = z.infer<typeof rowValueSchema>;
export type RowInput = z.infer<typeof rowSchema>;
