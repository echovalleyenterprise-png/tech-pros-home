import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/signup
 *
 * 1. Creates user via Supabase Admin REST API (email_confirm: true — no email needed)
 * 2. Creates profile row
 * 3. Signs in via REST token endpoint
 * 4. Uses createServerClient.setSession() to write the auth cookie via Set-Cookie headers
 *    — this is the exact format @supabase/ssr's middleware + server pages can read.
 * 5. Returns { ok: true, role } — client just navigates, no client-side setSession needed.
 */
export async function POST(request: NextRequest) {
  let body: {
    email?: string;
    password?: string;
    name?: string;
    role?: string;
    refCode?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, password, name, role = "homeowner", refCode } = body;
  if (!email || !password || !name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!serviceKey) {
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  // ── Step 1: Create user via Admin REST API ────────────────────────────────
  const createRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role, referred_by: refCode ?? null },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({})) as { msg?: string; message?: string };
    const msg = err.msg ?? err.message ?? "Signup failed";
    return NextResponse.json({ error: msg }, { status: createRes.status });
  }

  const newUser = (await createRes.json()) as { id: string };

  // ── Step 2: Create profile row ────────────────────────────────────────────
  await fetch(`${supabaseUrl}/rest/v1/profiles`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      id: newUser.id,
      name,
      email,
      role,
      plan: "free",
      questions_used: 0,
    }),
  });

  // ── Step 3: Sign in via Supabase REST token endpoint ─────────────────────
  const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!tokenRes.ok) {
    // Account created but auto-sign-in failed — tell client to go to login
    return NextResponse.json({ ok: true, role, needsLogin: true });
  }

  const tokenData = (await tokenRes.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
    expires_at?: number;
    token_type?: string;
    user?: { id: string };
  };

  // ── Step 4: Handle referral tracking ─────────────────────────────────────
  if (refCode) {
    const partnerRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?affiliate_code=eq.${encodeURIComponent(refCode)}&select=id&limit=1`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    );
    if (partnerRes.ok) {
      const partners = (await partnerRes.json()) as Array<{ id: string }>;
      if (partners.length > 0) {
        await fetch(`${supabaseUrl}/rest/v1/referrals`, {
          method: "POST",
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            partner_id: partners[0].id,
            referred_user_id: newUser.id,
            affiliate_code: refCode,
            plan: "free",
            is_paying: false,
          }),
        });
      }
    }
  }

  // ── Step 5: Write auth cookie via @supabase/ssr Set-Cookie headers ────────
  const response = NextResponse.json({ ok: true, role });

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
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
    // Session write failed — tell client to go to login manually
    return NextResponse.json({ ok: true, role, needsLogin: true });
  }

  return response;
}
