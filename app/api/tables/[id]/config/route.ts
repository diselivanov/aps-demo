import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/user";
import { tableConfigSchema } from "@/lib/schemas/table-config";

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

  const config = await prisma.tableConfig.findUnique({
    where: { tableId },
    select: { columns: true, pageSize: true },
  });

  if (!config) {
    return NextResponse.json(
      { error: "Конфигурация не найдена" },
      { status: 404 },
    );
  }

  return NextResponse.json({ config });
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

  const table = await prisma.table.findUnique({
    where: { id: tableId },
    include: { fields: { select: { id: true } } },
  });
  if (!table) {
    return NextResponse.json({ error: "Таблица не найдена" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = tableConfigSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const fieldIds = new Set(table.fields.map((f) => f.id));
  for (const col of parsed.data.columns) {
    if (!fieldIds.has(col.fieldId)) {
      return NextResponse.json({ error: "Поле не найдено" }, { status: 400 });
    }
  }

  const config = await prisma.tableConfig.update({
    where: { tableId },
    data: {
      columns: parsed.data.columns,
      pageSize: parsed.data.pageSize,
    },
    select: { columns: true, pageSize: true },
  });

  return NextResponse.json({ config });
}
