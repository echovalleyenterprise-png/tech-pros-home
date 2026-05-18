import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/home", "/chat", "/partner", "/callback"];
const AUTH_ONLY = ["/login", "/signup", "/verify-email"];

// ── Manual auth verification ──────────────────────────────────────────────────
// @supabase/ssr's createServerClient never calls our getAll() hook (the installed
// version appears to use the old get/set/remove API, not getAll/setAll).
// Rather than fight the package, we manually read the auth cookie and verify
// the access_token directly with Supabase — the same thing getUser() does internally.

async function verifySession(
  request: NextRequest
): Promise<{ id: string } | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return null;

  // Derive the storage key from the project ref embedded in the URL
  const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
  const cookieName = `sb-${projectRef}-auth-token`;

  // --- Assemble session JSON (handles both single and chunked cookies) ---
  let sessionJson: string | null = null;

  const singleCookie = request.cookies.get(cookieName);
  if (singleCookie?.value) {
    sessionJson = singleCookie.value;
  } else {
    // Chunked storage: sb-ref-auth-token.0, .1, ...
    const chunks: string[] = [];
    for (let i = 0; ; i++) {
      const chunk = request.cookies.get(`${cookieName}.${i}`);
      if (!chunk?.value) break;
      chunks.push(chunk.value);
    }
    if (chunks.length > 0) sessionJson = chunks.join("");
  }

  if (!sessionJson) return null;

  // --- Parse the session object ---
  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  try {
    const session = JSON.parse(sessionJson) as {
      access_token?: string;
      refresh_token?: string;
    };
    accessToken = session.access_token ?? null;
    refreshToken = session.refresh_token ?? null;
  } catch {
    return null;
  }

  if (!accessToken) return null;

  // --- Verify the access token with Supabase ---
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
      },
    });

    if (res.ok) {
      const user = (await res.json()) as { id: string };
      return user;
    }

    // Token expired — try to refresh
    if (refreshToken) {
      const refreshRes = await fetch(
        `${supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
        {
          method: "POST",
          headers: {
            apikey: supabaseAnonKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh_token: refreshToken }),
        }
      );

      if (refreshRes.ok) {
        const newSession = (await refreshRes.json()) as {
          user?: { id: string };
        };
        if (newSession.user?.id) {
          return { id: newSession.user.id };
        }
      }
    }
  } catch {
    // Network error — fail open (let the request through; page will handle auth)
  }

  return null;
}

// ── Middleware ────────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_ONLY.some((p) => pathname.startsWith(p));

  // Skip auth check entirely for unrelated paths
  if (!isProtected && !isAuthPage) {
    return NextResponse.next({ request });
  }

  const user = await verifySession(request);

  // Redirect unauthenticated users away from protected routes
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages
  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  // Inject user ID into request headers for Server Components
  if (user) {
    const newHeaders = new Headers(request.headers);
    newHeaders.set("x-user-id", user.id);
    return NextResponse.next({ request: { headers: newHeaders } });
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
