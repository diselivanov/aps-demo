"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormWrapper from "@/components/ui/FormWrapper";
import { useAlert } from "@/components/ui/Alert";
import { signInSchema, type SignInInput } from "@/lib/schemas/auth";
import styles from "./index.module.css";

export default function SignInForm() {
  const router = useRouter();
  const { show } = useAlert();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInInput) => {
    const res = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      show({ type: "error", message: json?.error ?? "Ошибка входа" });
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <FormWrapper title="Вход" onSubmit={handleSubmit(onSubmit)}>
      <Input
        placeholder="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register("email")}
      />
      <Input
        placeholder="Пароль"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" disabled={isSubmitting}>
        Войти
      </Button>
      <p className={styles.hint}>
        Нет аккаунта? <Link href="/sign-up">Зарегистрироваться</Link>
      </p>
    </FormWrapper>
  );
}
