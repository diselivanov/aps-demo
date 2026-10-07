import { cookies } from "next/headers";
import { signToken, verifyToken, TOKEN_COOKIE, TOKEN_MAX_AGE } from "./jwt";

export async function createSession(userId: string) {
  const token = await signToken({ id: userId });
  const store = await cookies();
  store.set(TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(TOKEN_COOKIE);
}

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  return payload?.id ?? null;
}
