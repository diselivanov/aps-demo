import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/user";
import { readFile, unlink } from "fs/promises";
import path from "path";

type Params = {
  params: Promise<{ id: string; rowId: string; fileId: string }>;
};

export async function GET(_: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { fileId: fileIdStr } = await params;
  const fileId = Number(fileIdStr);
  if (!Number.isInteger(fileId)) {
    return NextResponse.json({ error: "Некорректный id" }, { status: 400 });
  }

  const file = await prisma.rowFile.findUnique({ where: { id: fileId } });
  if (!file) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  }

  const fullPath = path.join(process.cwd(), file.path);

  let data: Buffer;
  try {
    data = await readFile(fullPath);
  } catch {
    return NextResponse.json({ error: "Файл недоступен" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    },
  });
}

export async function DELETE(_: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { fileId: fileIdStr } = await params;
  const fileId = Number(fileIdStr);
  if (!Number.isInteger(fileId)) {
    return NextResponse.json({ error: "Некорректный id" }, { status: 400 });
  }

  const file = await prisma.rowFile.findUnique({ where: { id: fileId } });
  if (!file) {
    return NextResponse.json({ error: "Файл не найден" }, { status: 404 });
  }

  await prisma.rowFile.delete({ where: { id: fileId } });

  const fullPath = path.join(process.cwd(), file.path);
  await unlink(fullPath).catch(() => {});

  return NextResponse.json({ ok: true });
}
