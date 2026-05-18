import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cookieAdapter: any = {
    // Old API (v0.0.x)
    get(name: string) {
      return request.cookies.get(name)?.value;
    },
    set(name: string, value: string, options: Record<string, unknown>) {
      cookiesToSet.push({ name, value, options });
    },
    remove(name: string, options: Record<string, unknown>) {
      cookiesToSet.push({ name, value: "", options: { ...options, maxAge: 0 } });
    },
    // New API (v0.1+)
    getAll() {
      return request.cookies.getAll();
    },
    setAll(items: { name: string; value: string; options?: Record<string, unknown> }[]) {
      items.forEach((item) =>
        cookiesToSet.push(item as { name: string; value: string; options: Record<string, unknown> })
      );
    },
  };

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieAdapter }
  );

  await supabase.auth.signOut();

  // Use the request origin so this works on any deployment (Vercel, localhost, etc.)
  const origin = request.nextUrl.origin;
  const response = NextResponse.redirect(new URL("/", origin));

  // Apply cookie deletions from signOut
  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(
      name,
      value,
      options as Parameters<typeof response.cookies.set>[2]
    );
  });

  // Also manually clear known auth cookies to be safe
  const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "")
    .replace("https://", "")
    .split(".")[0];
  response.cookies.delete(`sb-${projectRef}-auth-token`);
  response.cookies.delete(`sb-${projectRef}-auth-token.0`);
  response.cookies.delete(`sb-${projectRef}-auth-token.1`);

  return response;
}
