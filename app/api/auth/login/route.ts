import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/login
 *
 * Calls Supabase REST token endpoint directly and returns access_token + refresh_token.
 * The CLIENT calls supabase.setSession() which writes cookies in the exact format
 * @supabase/ssr's createServerClient (middleware + server pages) can read.
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
    user: { id: string; user_metadata?: { role?: string } };
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

  // Return tokens — client calls supabase.setSession() to write the auth cookie
  return NextResponse.json({
    ok: true,
    role,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
  });
}
