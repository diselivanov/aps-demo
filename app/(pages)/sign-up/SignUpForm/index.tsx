"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormWrapper from "@/components/ui/FormWrapper";
import { useAlert } from "@/components/ui/Alert";
import { signUpSchema, type SignUpInput } from "@/lib/schemas/auth";
import styles from "./index.module.css";

export default function SignUpForm() {
  const router = useRouter();
  const { show } = useAlert();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
  });

  const onSubmit = async (data: SignUpInput) => {
    const res = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      show({ type: "error", message: json?.error ?? "Ошибка регистрации" });
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <FormWrapper title="Регистрация" onSubmit={handleSubmit(onSubmit)}>
      <Input
        placeholder="Имя"
        autoComplete="name"
        error={errors.name?.message}
        {...register("name")}
      />
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
        autoComplete="new-password"
        error={errors.password?.message}
        {...register("password")}
      />
      <Button type="submit" disabled={isSubmitting}>
        Зарегистрироваться
      </Button>
      <p className={styles.hint}>
        Уже есть аккаунт? <Link href="/sign-in">Войти</Link>
      </p>
    </FormWrapper>
  );
}
