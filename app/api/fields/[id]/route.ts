import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/user";
import { fieldUpdateSchema } from "@/lib/schemas/field";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const fieldId = Number(id);
  if (!Number.isInteger(fieldId)) {
    return NextResponse.json({ error: "Некорректный id" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = fieldUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const existing = await prisma.field.findUnique({ where: { id: fieldId } });
  if (!existing) {
    return NextResponse.json({ error: "Поле не найдено" }, { status: 404 });
  }

  const { label, required, options, order } = parsed.data;

  if (
    (existing.type === "SELECT" || existing.type === "MULTI_SELECT") &&
    options !== undefined
  ) {
    if (!options || options.length === 0) {
      return NextResponse.json(
        { error: "Укажите варианты для поля" },
        { status: 400 },
      );
    }
  }

  const field = await prisma.field.update({
    where: { id: fieldId },
    data: {
      label: label ?? existing.label,
      required: required ?? existing.required,
      options:
        options === undefined
          ? (existing.options ?? undefined)
          : (options ?? undefined),
      order: order ?? existing.order,
    },
    select: {
      id: true,
      key: true,
      label: true,
      type: true,
      required: true,
      options: true,
      order: true,
    },
  });

  return NextResponse.json({ field });
}

export async function DELETE(_: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const fieldId = Number(id);
  if (!Number.isInteger(fieldId)) {
    return NextResponse.json({ error: "Некорректный id" }, { status: 400 });
  }

  const existing = await prisma.field.findUnique({ where: { id: fieldId } });
  if (!existing) {
    return NextResponse.json({ error: "Поле не найдено" }, { status: 404 });
  }

  await prisma.field.delete({ where: { id: fieldId } });
  return NextResponse.json({ ok: true });
}
