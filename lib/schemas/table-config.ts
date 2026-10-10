import { z } from "zod";

export const tableConfigSchema = z.object({
  columns: z.array(
    z.object({
      fieldId: z.number().int(),
      order: z.number().int().min(0),
      width: z.number().int().min(40),
    }),
  ),
  pageSize: z.union([
    z.literal(10),
    z.literal(25),
    z.literal(50),
    z.literal(100),
  ]),
});

export type TableConfigInput = z.infer<typeof tableConfigSchema>;
