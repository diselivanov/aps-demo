import { prisma } from "@/lib/prisma";
import { getSessionUserId } from "./session";

export async function getCurrentUser() {
  const id = await getSessionUserId();
  if (!id) return null;
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true },
  });
}
