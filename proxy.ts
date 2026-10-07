import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, TOKEN_COOKIE } from "@/lib/auth/jwt";

const protectedRoutes = ["/settings"];
const guestRoutes = ["/sign-in", "/sign-up"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const payload = token ? await verifyToken(token) : null;

  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !payload) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (guestRoutes.some((route) => pathname.startsWith(route)) && payload) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/settings/:path*", "/sign-in", "/sign-up"],
};
