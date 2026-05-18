"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// ── Server-side Supabase client ────────────────────────────────────────────────
// Signs in on the SERVER so cookies are written in the correct @supabase/ssr format
// that middleware's createServerClient can read. Browser-client signInWithPassword()
// writes a different cookie format that middleware can't reconstruct.
async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]
        ) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(
              name,
              value,
              options as Parameters<typeof cookieStore.set>[2]
            )
          );
        },
      },
    }
  );
}

async function getRoleFromProfiles(userId: string): Promise<string> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!;
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=role&limit=1`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    );
    if (res.ok) {
      const profiles = (await res.json()) as Array<{ role: string }>;
      if (profiles.length > 0) return profiles[0].role;
    }
  } catch {
    // fall through
  }
  return "homeowner";
}

// ── Login action ───────────────────────────────────────────────────────────────
export async function signInAction(
  email: string,
  password: string,
  next: string = "/home"
): Promise<{ error: string } | { dest: string }> {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    return { error: error?.message ?? "Sign in failed. Check your email and password." };
  }

  const role = await getRoleFromProfiles(data.user.id);
  const dest =
    role === "partner" ? "/partner" : next === "/partner" ? "/home" : next;
  return { dest };
}

// ── Signup then sign-in action ────────────────────────────────────────────────
export async function signUpAction(
  email: string,
  password: string,
  name: string,
  role: string,
  refCode: string | null
): Promise<{ error: string } | { dest: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!;

  // Step 1: Create user via Supabase Admin API (email_confirm: true)
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
    const err = (await createRes.json().catch(() => ({}))) as {
      msg?: string;
      message?: string;
    };
    return { error: err.msg ?? err.message ?? "Signup failed. Please try again." };
  }

  const newUser = (await createRes.json()) as { id: string };

  // Step 2: Create profile row
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

  // Step 3: Handle referral tracking
  if (refCode) {
    try {
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
    } catch {
      // Non-critical — don't fail signup
    }
  }

  // Step 4: Sign in server-side — writes cookies middleware can read
  const supabase = await getServerSupabase();
  const { data, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError || !data.session) {
    // Account created, but auto sign-in failed — client should go to login
    return { dest: "/login" };
  }

  const dest = role === "partner" ? "/partner" : "/home";
  return { dest };
}
