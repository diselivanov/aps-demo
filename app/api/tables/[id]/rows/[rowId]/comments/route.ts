import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/user";
import { commentSchema } from "@/lib/schemas/comment";

type Params = { params: Promise<{ id: string; rowId: string }> };

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

  const body = await request.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const comment = await prisma.comment.create({
    data: { rowId, authorId: user.id, text: parsed.data.text },
    select: {
      id: true,
      text: true,
      authorId: true,
      author: { select: { name: true } },
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ comment }, { status: 201 });
}
