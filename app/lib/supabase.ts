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

  // Provide BOTH old API (get/set/remove, used by older @supabase/ssr installs)
  // and new API (getAll/setAll) so cookie writing works regardless of package version.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cookieAdapter: any = {
    // Old API (v0.0.x)
    get(name: string) {
      return cookieStore.get(name)?.value;
    },
    set(name: string, value: string, options: unknown) {
      try {
        cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2]);
      } catch {
        // Called from Server Component — safe to ignore
      }
    },
    remove(name: string, options: unknown) {
      try {
        cookieStore.set(name, "", { ...(options as object), maxAge: 0 });
      } catch {
        // Called from Server Component — safe to ignore
      }
    },
    // New API (v0.1+)
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
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieAdapter }
  );
}

// ── Service role client (admin operations — server only) ─────────────────────
export function createAdminClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}
