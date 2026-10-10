import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/user";
import { tableUpdateSchema } from "@/lib/schemas/table";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const tableId = Number(id);
  if (!Number.isInteger(tableId)) {
    return NextResponse.json({ error: "Некорректный id" }, { status: 400 });
  }

  const table = await prisma.table.findUnique({
    where: { id: tableId },
    select: {
      id: true,
      name: true,
      folderId: true,
      fields: {
        select: {
          id: true,
          key: true,
          label: true,
          type: true,
          required: true,
          options: true,
          order: true,
        },
        orderBy: { order: "asc" },
      },
      config: { select: { columns: true, pageSize: true } },
    },
  });

  if (!table)
    return NextResponse.json({ error: "Таблица не найдена" }, { status: 404 });

  return NextResponse.json({ table });
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const tableId = Number(id);
  if (!Number.isInteger(tableId)) {
    return NextResponse.json({ error: "Некорректный id" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = tableUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const existing = await prisma.table.findUnique({ where: { id: tableId } });
  if (!existing)
    return NextResponse.json({ error: "Таблица не найдена" }, { status: 404 });

  const { name, folderId } = parsed.data;

  if (folderId !== undefined && folderId !== null) {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder)
      return NextResponse.json({ error: "Папка не найдена" }, { status: 404 });
  }

  const table = await prisma.table.update({
    where: { id: tableId },
    data: {
      name: name ?? existing.name,
      folderId: folderId === undefined ? existing.folderId : folderId,
    },
    select: { id: true, name: true, folderId: true },
  });

  return NextResponse.json({ table });
}

export async function DELETE(_: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const tableId = Number(id);
  if (!Number.isInteger(tableId)) {
    return NextResponse.json({ error: "Некорректный id" }, { status: 400 });
  }

  const existing = await prisma.table.findUnique({ where: { id: tableId } });
  if (!existing)
    return NextResponse.json({ error: "Таблица не найдена" }, { status: 404 });

  await prisma.table.delete({ where: { id: tableId } });
  return NextResponse.json({ ok: true });
}
