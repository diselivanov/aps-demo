import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/user";
import { rowSchema, rowQuerySchema } from "@/lib/schemas/row";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const tableId = Number(id);
  if (!Number.isInteger(tableId)) {
    return NextResponse.json({ error: "Некорректный id" }, { status: 400 });
  }

  const table = await prisma.table.findUnique({ where: { id: tableId } });
  if (!table) {
    return NextResponse.json({ error: "Таблица не найдена" }, { status: 404 });
  }

  const url = new URL(request.url);
  const parsed = rowQuerySchema.safeParse({
    page: url.searchParams.get("page") ?? undefined,
    size: url.searchParams.get("size") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    dir: url.searchParams.get("dir") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { page, size, sort, dir } = parsed.data;
  const skip = (page - 1) * size;
  const q = url.searchParams.get("q")?.trim() ?? "";

  let searchIds: number[] | null = null;
  if (q) {
    const matches = await prisma.rowValue.findMany({
      where: {
        row: { tableId },
        valueString: { contains: q },
      },
      select: { rowId: true },
      distinct: ["rowId"],
    });
    searchIds = matches.map((m) => m.rowId);
  }

  const baseWhere =
    searchIds !== null ? { tableId, id: { in: searchIds } } : { tableId };

  const total = await prisma.row.count({ where: baseWhere });

  let rows: { id: number; createdAt: Date; updatedAt: Date }[];

  if (sort === "id") {
    rows = await prisma.row.findMany({
      where: baseWhere,
      select: { id: true, createdAt: true, updatedAt: true },
      orderBy: { id: dir },
      skip,
      take: size,
    });
  } else if (sort && sort !== "createdAt") {
    const fieldId = Number(sort);
    if (!Number.isInteger(fieldId)) {
      return NextResponse.json(
        { error: "Некорректное поле сортировки" },
        { status: 400 },
      );
    }

    const field = await prisma.field.findUnique({ where: { id: fieldId } });
    if (!field || field.tableId !== tableId) {
      return NextResponse.json({ error: "Поле не найдено" }, { status: 404 });
    }

    const column =
      field.type === "NUMBER"
        ? "valueNumber"
        : field.type === "DATE"
          ? "valueDate"
          : "valueString";

    const sorted = await prisma.rowValue.findMany({
      where: {
        row: baseWhere,
        fieldId,
        ...(field.type === "MULTI_SELECT" ? { order: 0 } : {}),
      },
      select: { rowId: true, [column]: true },
      orderBy: { [column]: dir },
      skip,
      take: size,
    });

    const ids = sorted.map((v) => v.rowId);
    const found = await prisma.row.findMany({
      where: { id: { in: ids } },
      select: { id: true, createdAt: true, updatedAt: true },
    });

    rows = ids
      .map((id) => found.find((r) => r.id === id))
      .filter((r): r is { id: number; createdAt: Date; updatedAt: Date } =>
        Boolean(r),
      );
  } else {
    rows = await prisma.row.findMany({
      where: baseWhere,
      select: { id: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: dir },
      skip,
      take: size,
    });
  }

  const values = await prisma.rowValue.findMany({
    where: { rowId: { in: rows.map((r) => r.id) } },
    select: {
      rowId: true,
      fieldId: true,
      valueString: true,
      valueNumber: true,
      valueDate: true,
      order: true,
    },
  });

  const files = await prisma.rowFile.findMany({
    where: { rowId: { in: rows.map((r) => r.id) } },
    select: {
      id: true,
      rowId: true,
      fieldId: true,
      name: true,
      mime: true,
      size: true,
    },
  });

  const result = rows.map((row) => ({
    ...row,
    values: values.filter((v) => v.rowId === row.id),
    files: files.filter((f) => f.rowId === row.id),
  }));

  return NextResponse.json({
    rows: result,
    total,
    page,
    size,
  });
}

export async function POST(request: Request, { params }: Params) {
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
    include: { fields: true },
  });
  if (!table) {
    return NextResponse.json({ error: "Таблица не найдена" }, { status: 404 });
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

  const error = validateRowValues(table.fields, values);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const row = await prisma.$transaction(async (tx) => {
    const created = await tx.row.create({
      data: { tableId, createdBy: user.id },
    });

    for (const v of values) {
      await tx.rowValue.create({
        data: {
          rowId: created.id,
          fieldId: v.fieldId,
          valueString: v.valueString ?? undefined,
          valueNumber: v.valueNumber ?? undefined,
          valueDate: v.valueDate ? new Date(v.valueDate) : undefined,
          order: v.order,
        },
      });
    }

    return created;
  });

  return NextResponse.json({ row: { id: row.id } }, { status: 201 });
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
