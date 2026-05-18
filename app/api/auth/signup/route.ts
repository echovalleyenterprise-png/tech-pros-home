import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/signup
 *
 * Creates the user via Supabase Admin REST API (email_confirm: true — no
 * verification email needed), then signs them in server-side so the session
 * cookies are in the format createServerClient can read on the next request.
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
  // Using email_confirm: true skips the verification email entirely.
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
      user_metadata: {
        name,
        role,
        referred_by: refCode ?? null,
      },
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({})) as { msg?: string; message?: string };
    const msg = err.msg ?? err.message ?? "Signup failed";
    // "User already registered" → 422
    return NextResponse.json({ error: msg }, { status: createRes.status });
  }

  // ── Step 2: Create profile row ────────────────────────────────────────────
  const newUser = (await createRes.json()) as { id: string };

  // Insert profile using service role (bypasses RLS)
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

  // ── Step 3: Sign in server-side to get proper SSR cookies ─────────────────
  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(items: { name: string; value: string; options?: Record<string, unknown> }[]) {
        items.forEach((item) =>
          cookiesToSet.push(item as { name: string; value: string; options: Record<string, unknown> })
        );
      },
    },
  });

  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !data.user) {
    // User created but couldn't sign in — send them to login
    return NextResponse.json({ ok: true, role, needsLogin: true });
  }

  // ── Step 4: Handle referral tracking ─────────────────────────────────────
  if (refCode) {
    // Find partner by affiliate_code and insert referral row
    const partnerRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?affiliate_code=eq.${encodeURIComponent(refCode)}&select=id&limit=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
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

  const signedInRole = data.user.user_metadata?.role as string | undefined ?? role;
  const response = NextResponse.json({ ok: true, role: signedInRole });

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  });

  return response;
}
