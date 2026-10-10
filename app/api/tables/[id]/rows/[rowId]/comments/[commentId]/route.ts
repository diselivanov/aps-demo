import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/user";
import { commentSchema } from "@/lib/schemas/comment";

type Params = {
  params: Promise<{ id: string; rowId: string; commentId: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { commentId: commentIdStr } = await params;
  const commentId = Number(commentIdStr);
  if (!Number.isInteger(commentId)) {
    return NextResponse.json({ error: "Некорректный id" }, { status: 400 });
  }

  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Комментарий не найден" },
      { status: 404 },
    );
  }

  const body = await request.json();
  const parsed = commentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }

  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { text: parsed.data.text },
    select: {
      id: true,
      text: true,
      authorId: true,
      author: { select: { name: true } },
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ comment });
}

export async function DELETE(_: Request, { params }: Params) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });

  const { commentId: commentIdStr } = await params;
  const commentId = Number(commentIdStr);
  if (!Number.isInteger(commentId)) {
    return NextResponse.json({ error: "Некорректный id" }, { status: 400 });
  }

  const existing = await prisma.comment.findUnique({
    where: { id: commentId },
  });
  if (!existing) {
    return NextResponse.json(
      { error: "Комментарий не найден" },
      { status: 404 },
    );
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return NextResponse.json({ ok: true });
}
