import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/user";
import { folderSchema } from "@/lib/schemas/folder";

export async function GET() {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const folders = await prisma.folder.findMany({
    select: { id: true, name: true, parentId: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ folders });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const body = await request.json();
  const parsed = folderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const { name, parentId } = parsed.data;

  if (parentId) {
    const parent = await prisma.folder.findUnique({ where: { id: parentId } });
    if (!parent)
      return NextResponse.json({ error: "Папка не найдена" }, { status: 404 });
  }

  const folder = await prisma.folder.create({
    data: { name, parentId: parentId ?? null, createdBy: user.id },
    select: { id: true, name: true, parentId: true },
  });

  return NextResponse.json({ folder }, { status: 201 });
}
