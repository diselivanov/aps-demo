import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/user";
import { folderSchema } from "@/lib/schemas/folder";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const folderId = Number(id);
  if (!Number.isInteger(folderId)) {
    return NextResponse.json({ error: "Некорректный id" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = folderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { name, parentId } = parsed.data;

  const existing = await prisma.folder.findUnique({ where: { id: folderId } });
  if (!existing)
    return NextResponse.json({ error: "Папка не найдена" }, { status: 404 });

  if (parentId !== undefined && parentId !== null) {
    if (parentId === folderId) {
      return NextResponse.json(
        { error: "Нельзя переместить папку в себя" },
        { status: 400 },
      );
    }
    const parent = await prisma.folder.findUnique({ where: { id: parentId } });
    if (!parent)
      return NextResponse.json({ error: "Папка не найдена" }, { status: 404 });

    const descendants = await getDescendantIds(folderId);
    if (descendants.includes(parentId)) {
      return NextResponse.json(
        { error: "Нельзя переместить в дочернюю папку" },
        { status: 400 },
      );
    }
  }

  const folder = await prisma.folder.update({
    where: { id: folderId },
    data: {
      name,
      parentId: parentId === undefined ? existing.parentId : parentId,
    },
    select: { id: true, name: true, parentId: true },
  });

  return NextResponse.json({ folder });
}

export async function DELETE(_: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { id } = await params;
  const folderId = Number(id);
  if (!Number.isInteger(folderId)) {
    return NextResponse.json({ error: "Некорректный id" }, { status: 400 });
  }

  const existing = await prisma.folder.findUnique({
    where: { id: folderId },
    include: { _count: { select: { children: true, tables: true } } },
  });
  if (!existing)
    return NextResponse.json({ error: "Папка не найдена" }, { status: 404 });

  if (existing._count.children > 0 || existing._count.tables > 0) {
    return NextResponse.json({ error: "Папка не пуста" }, { status: 409 });
  }

  await prisma.folder.delete({ where: { id: folderId } });
  return NextResponse.json({ ok: true });
}

async function getDescendantIds(rootId: number): Promise<number[]> {
  const result: number[] = [];
  const queue = [rootId];
  while (queue.length) {
    const current = queue.shift()!;
    const children = await prisma.folder.findMany({
      where: { parentId: current },
      select: { id: true },
    });
    for (const child of children) {
      result.push(child.id);
      queue.push(child.id);
    }
  }
  return result;
}
