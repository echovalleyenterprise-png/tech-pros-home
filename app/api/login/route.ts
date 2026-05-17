import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const email = url.searchParams.get("email");
  const password = url.searchParams.get("password");
  const redirect = url.searchParams.get("redirect") === "1";

  if (!email || !password) {
    return NextResponse.json({ error: "Missing email or password" }, { status: 400 });
  }

  // We need a mutable response to attach cookies
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
          items.forEach((item) => cookiesToSet.push(item as { name: string; value: string; options: Record<string, unknown> }));
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        status: error.status,
      },
      { status: 401 }
    );
  }

  const session = data.session;
  const cookieNames = cookiesToSet.map((c) => c.name);

  if (redirect) {
    const dest = new URL("/home", request.url);
    const response = NextResponse.redirect(dest);
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
    });
    return response;
  }

  // Return JSON so we can inspect what's happening
  const response = NextResponse.json({
    ok: true,
    user: { email: data.user?.email, id: data.user?.id },
    session: {
      expires_at: session?.expires_at,
      token_type: session?.token_type,
      accessTokenPreview: session?.access_token?.slice(0, 30) + "...",
    },
    cookiesSet: cookieNames,
    cookieDetails: cookiesToSet.map((c) => ({
      name: c.name,
      valueLength: c.value.length,
      valuePreview: c.value.slice(0, 80) + (c.value.length > 80 ? "..." : ""),
    })),
  });

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
  });

  return response;
}
