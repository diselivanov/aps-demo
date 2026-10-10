import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/user";
import { tableSchema } from "@/lib/schemas/table";

export async function GET() {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const tables = await prisma.table.findMany({
    select: { id: true, name: true, folderId: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ tables });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const body = await request.json();
  const parsed = tableSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { name, folderId, fields } = parsed.data;

  if (folderId) {
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder)
      return NextResponse.json({ error: "Папка не найдена" }, { status: 404 });
  }

  for (const field of fields) {
    if (
      (field.type === "SELECT" || field.type === "MULTI_SELECT") &&
      (!field.options || field.options.length === 0)
    ) {
      return NextResponse.json(
        { error: `Укажите варианты для поля «${field.label}»` },
        { status: 400 },
      );
    }
  }

  const table = await prisma.$transaction(async (tx) => {
    const created = await tx.table.create({
      data: { name, folderId: folderId ?? null, createdBy: user.id },
    });

    for (const [index, field] of fields.entries()) {
      await tx.field.create({
        data: {
          tableId: created.id,
          key: `field${index + 1}`,
          label: field.label,
          type: field.type,
          required: field.required,
          options: field.options ?? undefined,
          order: index,
        },
      });
    }

    await tx.tableConfig.create({
      data: { tableId: created.id, columns: [], pageSize: 25 },
    });

    return created;
  });

  return NextResponse.json(
    { table: { id: table.id, name: table.name, folderId: table.folderId } },
    { status: 201 },
  );
}
