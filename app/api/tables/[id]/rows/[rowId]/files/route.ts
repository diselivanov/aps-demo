import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/user";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

type Params = { params: Promise<{ id: string; rowId: string }> };

const ALLOWED_MIME = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const MAX_SIZE = 50 * 1024 * 1024;
const MAX_FILES_PER_FIELD = 10;

export async function POST(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { rowId: rowIdStr } = await params;
  const rowId = Number(rowIdStr);
  if (!Number.isInteger(rowId)) {
    return NextResponse.json({ error: "Некорректный id" }, { status: 400 });
  }

  const row = await prisma.row.findUnique({ where: { id: rowId } });
  if (!row) {
    return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
  }

  const form = await request.formData();
  const fieldId = Number(form.get("fieldId"));
  const file = form.get("file");

  if (!Number.isInteger(fieldId)) {
    return NextResponse.json({ error: "Некорректное поле" }, { status: 400 });
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Файл не передан" }, { status: 400 });
  }

  const field = await prisma.field.findUnique({ where: { id: fieldId } });
  if (!field || field.tableId !== row.tableId || field.type !== "FILE") {
    return NextResponse.json({ error: "Поле не найдено" }, { status: 404 });
  }

  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json(
      { error: "Недопустимый тип файла" },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Файл больше 50 МБ" }, { status: 400 });
  }

  const count = await prisma.rowFile.count({ where: { rowId, fieldId } });
  if (count >= MAX_FILES_PER_FIELD) {
    return NextResponse.json(
      { error: "Достигнут лимит файлов для поля" },
      { status: 409 },
    );
  }

  const dir = path.join(process.cwd(), "uploads", String(rowId));
  await mkdir(dir, { recursive: true });

  const ext = path.extname(file.name);
  const filename = `${randomUUID()}${ext}`;
  const fullPath = path.join(dir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buffer);

  const rowFile = await prisma.rowFile.create({
    data: {
      rowId,
      fieldId,
      name: file.name,
      path: path.relative(process.cwd(), fullPath),
      mime: file.type,
      size: file.size,
    },
    select: {
      id: true,
      fieldId: true,
      name: true,
      mime: true,
      size: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ file: rowFile }, { status: 201 });
}
