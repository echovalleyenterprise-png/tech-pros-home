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
                                    return cookieStore.getAll();
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
