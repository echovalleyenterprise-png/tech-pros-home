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
        getAll() {
          return request.cookies.getAll().map((c) => ({
            name: c.name,
            value: (() => {
              try { return decodeURIComponent(c.value); }
              catch { return c.value; }
            })(),
          }));
        },
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

  // If getUser() fails with a network error from Edge Runtime, fall back to
  // checking cookie presence so a transient Supabase connectivity issue
  // doesn't lock out authenticated users.
  const hasCookie = request.cookies.getAll().some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );
  const isAuthenticated = user !== null || (getUserError !== null && hasCookie);

  // Redirect unauthenticated users away from protected routes
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (isProtected && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages.
  // Use only `user !== null` here (not the hasCookie fallback) so a stale/expired
  // cookie doesn't redirect /login → /home when getSession() will return null there,
  // which would create an ERR_TOO_MANY_REDIRECTS loop.
  const isAuthPage = AUTH_ONLY.some((p) => pathname.startsWith(p));
  if (isAuthPage && user !== null) {
    // Route to role-appropriate dashboard
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
