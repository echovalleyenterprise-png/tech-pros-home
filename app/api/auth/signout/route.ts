import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(items: { name: string; value: string; options?: Record<string, unknown> }[]) {
          items.forEach((item) =>
            cookiesToSet.push(item as { name: string; value: string; options: Record<string, unknown> })
          );
        },
      },
    }
  );

  await supabase.auth.signOut();

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const response = NextResponse.redirect(new URL("/", baseUrl));

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
