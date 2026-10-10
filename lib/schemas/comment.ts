import { z } from "zod";

export const commentSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Введите текст")
    .max(2000, "Максимум 2000 символов"),
});

export type CommentInput = z.infer<typeof commentSchema>;
