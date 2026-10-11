import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/user";
import { z } from "zod";

type Params = { params: Promise<{ id: string }> };

const valueSchema = z.object({
  fieldId: z.number().int(),
  valueString: z.string().nullable().optional(),
  valueNumber: z.number().nullable().optional(),
  valueDate: z.string().nullable().optional(),
  order: z.number().int().min(0).default(0),
});

const bulkSchema = z.object({
  rows: z.array(z.object({ values: z.array(valueSchema) })).max(500),
});

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
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const created: number[] = [];
  const errors: { index: number; message: string }[] = [];

  for (let i = 0; i < parsed.data.rows.length; i++) {
    const { values } = parsed.data.rows[i];

    const error = validateRowValues(table.fields, values);
    if (error) {
      errors.push({ index: i, message: error });
      continue;
    }

    try {
      await prisma.$transaction(async (tx) => {
        const row = await tx.row.create({
          data: { tableId, createdBy: user.id },
        });

        for (const v of values) {
          await tx.rowValue.create({
            data: {
              rowId: row.id,
              fieldId: v.fieldId,
              valueString: v.valueString ?? undefined,
              valueNumber: v.valueNumber ?? undefined,
              valueDate: v.valueDate ? new Date(v.valueDate) : undefined,
              order: v.order,
            },
          });
        }

        created.push(row.id);
      });
    } catch {
      errors.push({ index: i, message: "Ошибка записи в БД" });
    }
  }

  return NextResponse.json({
    created: created.length,
    errors,
  });
}

function validateRowValues(
  fields: {
    id: number;
    label: string;
    type: string;
    required: boolean;
    options: unknown;
  }[],
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
