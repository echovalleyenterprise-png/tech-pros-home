import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/home", "/chat", "/partner", "/callback"];
const AUTH_ONLY = ["/login", "/signup", "/verify-email"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          );
        },
      },
    }
  );

  const { data: { user }, error: getUserError } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // hasCookie: auth cookie is present (may be expired — we don't know without getUser())
  const hasCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  // isAuthenticated: used for PROTECTED routes.
  // Allow through if getUser() confirmed a user, OR if getUser() hit a network
  // error but a cookie exists (transient Edge→Supabase failure — let the page handle it).
  const isAuthenticated = user !== null || (getUserError !== null && hasCookie);

  // isDefinitelyAuthenticated: used for AUTH_ONLY pages.
  // Only redirect away from login/signup if we KNOW the user is valid —
  // avoids an infinite loop when a cookie exists but the token is expired.
  const isDefinitelyAuthenticated = user !== null;

  // Redirect unauthenticated users away from protected routes
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (isProtected && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  const isAuthPage = AUTH_ONLY.some((p) => pathname.startsWith(p));
  if (isAuthPage && isDefinitelyAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
