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
          return request.cookies.getAll();
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

  // getUser() verifies the JWT with Supabase — always use this for auth checks
  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users away from protected routes
  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  const isAuthPage = AUTH_ONLY.some((p) => pathname.startsWith(p));
  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  // Pass user ID to Server Components via REQUEST header (not response header).
  // Next.js forwards request headers set here to Server Components via headers().
  // This avoids re-calling getUser() in Server Components, which fails on Vercel
  // because the Edge runtime (middleware) and serverless runtime (Server Components)
  // don't share cookie state reliably.
  if (user) {
    // Build new request headers with the user ID injected
    const newRequestHeaders = new Headers(request.headers);
    newRequestHeaders.set("x-user-id", user.id);

    // Create a fresh response forwarding the new request headers to Server Components
    const responseWithUserId = NextResponse.next({
      request: { headers: newRequestHeaders },
    });

    // Copy all Supabase session cookies from supabaseResponse into the new response
    // so the browser's session is properly maintained
    for (const cookie of supabaseResponse.cookies.getAll()) {
      responseWithUserId.cookies.set(cookie);
    }

    return responseWithUserId;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
