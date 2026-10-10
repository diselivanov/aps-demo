import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/user";
import { rowSchema } from "@/lib/schemas/row";
import { unlink } from "fs/promises";
import path from "path";

type Params = { params: Promise<{ id: string; rowId: string }> };

export async function GET(_: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { rowId: rowIdStr } = await params;
  const rowId = Number(rowIdStr);
  if (!Number.isInteger(rowId)) {
    return NextResponse.json({ error: "Некорректный id" }, { status: 400 });
  }

  const row = await prisma.row.findUnique({
    where: { id: rowId },
    select: {
      id: true,
      tableId: true,
      createdAt: true,
      updatedAt: true,
      values: {
        select: {
          fieldId: true,
          valueString: true,
          valueNumber: true,
          valueDate: true,
          order: true,
        },
      },
      files: {
        select: {
          id: true,
          fieldId: true,
          name: true,
          mime: true,
          size: true,
          createdAt: true,
        },
      },
      comments: {
        select: {
          id: true,
          text: true,
          authorId: true,
          author: { select: { name: true } },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!row) {
    return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
  }

  return NextResponse.json({ row });
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { rowId: rowIdStr } = await params;
  const rowId = Number(rowIdStr);
  if (!Number.isInteger(rowId)) {
    return NextResponse.json({ error: "Некорректный id" }, { status: 400 });
  }

  const existing = await prisma.row.findUnique({
    where: { id: rowId },
    include: { table: { include: { fields: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = rowSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { values } = parsed.data;
  const fields = existing.table.fields;

  const error = validateRowValues(fields, values);
  if (error) return NextResponse.json({ error }, { status: 400 });

  await prisma.$transaction(async (tx) => {
    await tx.rowValue.deleteMany({ where: { rowId } });

    for (const v of values) {
      await tx.rowValue.create({
        data: {
          rowId,
          fieldId: v.fieldId,
          valueString: v.valueString ?? undefined,
          valueNumber: v.valueNumber ?? undefined,
          valueDate: v.valueDate ? new Date(v.valueDate) : undefined,
          order: v.order,
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { rowId: rowIdStr } = await params;
  const rowId = Number(rowIdStr);
  if (!Number.isInteger(rowId)) {
    return NextResponse.json({ error: "Некорректный id" }, { status: 400 });
  }

  const existing = await prisma.row.findUnique({
    where: { id: rowId },
    include: { files: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
  }

  await prisma.row.delete({ where: { id: rowId } });

  for (const file of existing.files) {
    const fullPath = path.join(process.cwd(), file.path);
    await unlink(fullPath).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}

function validateRowValues(
  fields: { id: number; label: string; type: string; required: boolean }[],
  values: {
    fieldId: number;
    valueString?: string | null;
    valueNumber?: number | null;
    valueDate?: string | null;
  }[],
): string | null {
  for (const field of fields) {
    const provided = values.filter((v) => v.fieldId === field.id);
    if (field.required && provided.length === 0) {
      return `Поле «${field.label}» обязательно`;
    }
    if (field.type !== "MULTI_SELECT" && provided.length > 1) {
      return `Поле «${field.label}» допускает только одно значение`;
    }
  }
  for (const v of values) {
    const field = fields.find((f) => f.id === v.fieldId);
    if (!field) return "Поле не найдено";
  }
  return null;
}
