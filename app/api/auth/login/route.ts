import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/login
 *
 * 1. Calls Supabase REST token endpoint to authenticate
 * 2. Uses createServerClient.setSession() to write the auth cookie via Set-Cookie headers
 *    — this is the exact format @supabase/ssr's middleware + server pages can read.
 * 3. Returns { ok: true, role } — client just navigates, no client-side setSession needed.
 */
export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!;

  // Call Supabase REST token endpoint directly to get raw tokens
  const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.json().catch(() => ({})) as { error_description?: string; message?: string };
    const msg = err.error_description ?? err.message ?? "Invalid email or password";
    return NextResponse.json({ error: msg }, { status: 401 });
  }

  const tokenData = (await tokenRes.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
    expires_at?: number;
    token_type?: string;
    user: { id: string; user_metadata?: { role?: string }; email?: string };
  };

  // Look up role from profiles table (source of truth)
  let role = tokenData.user?.user_metadata?.role as string | undefined ?? "homeowner";
  try {
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${tokenData.user.id}&select=role&limit=1`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    );
    if (profileRes.ok) {
      const profiles = (await profileRes.json()) as Array<{ role: string }>;
      if (profiles.length > 0) role = profiles[0].role;
    }
  } catch { /* fall back to user_metadata role */ }

  // Build response — @supabase/ssr will write the auth cookie via Set-Cookie
  const response = NextResponse.json({ ok: true, role });

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(
            name,
            value,
            options as Parameters<typeof response.cookies.set>[2]
          )
        );
      },
    },
  });

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
  });

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 401 });
  }

  return response;
}
