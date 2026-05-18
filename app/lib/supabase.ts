import { createBrowserClient, createServerClient } from "@supabase/ssr";

// ── Browser client (use in client components) ────────────────────────────────
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── Server client (use in Server Components, API routes, middleware) ──────────
export async function createServerSupabaseClient() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          // Next.js returns cookie values as-is from the Cookie header.
          // Browsers store values URL-encoded (Next.js URL-encodes when setting
          // Set-Cookie), so we must decode before passing to @supabase/ssr,
          // which calls JSON.parse() on the value directly.
          return cookieStore.getAll().map((c) => ({
            name: c.name,
            value: (() => {
              try { return decodeURIComponent(c.value); }
              catch { return c.value; }
            })(),
          }));
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
            );
          } catch {
            // Called from Server Component — safe to ignore
          }
        },
      },
    }
  );
}

// ── Service role client (admin operations — server only) ─────────────────────
export function createAdminClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}
