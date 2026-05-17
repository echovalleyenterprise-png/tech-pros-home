import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/home", "/chat", "/partner", "/callback"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  // Only guard protected routes — redirect to login if no cookie
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (isProtected && !hasCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Auth pages (/login, /signup, /verify-email) are always accessible
  // Server components handle session validation and post-login redirects

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
