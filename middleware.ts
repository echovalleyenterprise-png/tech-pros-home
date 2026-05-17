import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/home", "/chat", "/partner", "/callback"];
const AUTH_ONLY = ["/login", "/signup", "/verify-email"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (isProtected && !hasCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  const isAuthPage = AUTH_ONLY.some((p) => pathname.startsWith(p));
  if (isAuthPage && hasCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
