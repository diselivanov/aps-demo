"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormWrapper from "@/components/ui/FormWrapper";
import { useAlert } from "@/components/ui/Alert";
import { folderSchema } from "@/lib/schemas/folder";

type Input = { name: string };

const schema = folderSchema.pick({ name: true });

export default function NewFolderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { show } = useAlert();

  const parentIdParam = searchParams.get("parentId");
  const parentId = parentIdParam ? Number(parentIdParam) : null;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Input>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Input) => {
    const res = await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: data.name, parentId }),
    });

    if (!res.ok) {
      const json = await res.json().catch(() => null);
      show({ type: "error", message: json?.error ?? "Ошибка" });
      return;
    }

    window.location.href = "/";
  };

  return (
    <FormWrapper title="Новая папка" onSubmit={handleSubmit(onSubmit)}>
      <Input
        placeholder="Название"
        autoComplete="off"
        error={errors.name?.message}
        {...register("name")}
      />
      <Button type="submit" disabled={isSubmitting}>
        Создать
      </Button>
    </FormWrapper>
  );
}
