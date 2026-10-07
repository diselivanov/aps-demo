import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export const TOKEN_COOKIE = "token";
export const TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

export type JwtPayload = {
  id: string;
};

export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return { id: payload.id as string };
  } catch {
    return null;
  }
}
