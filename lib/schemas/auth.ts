import { z } from "zod";

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Минимум 2 символа")
    .max(64, "Максимум 64 символа"),
  email: z.string().trim().toLowerCase().email("Некорректный email"),
  password: z.string().min(8, "Минимум 8 символов"),
});

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
