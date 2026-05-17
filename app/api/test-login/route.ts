import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

// TEST ONLY: server-side sign-in that sets cookies on the response
export async function GET(request: Request) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  const password = url.searchParams.get('password');
  
  if (!email || !password) {
    return NextResponse.json({ error: 'Missing email or password params' }, { status: 400 });
  }
  
  const response = NextResponse.redirect(new URL('/home', request.url));
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.headers.get('cookie')?.split(';').map((c: string) => {
            const [name, ...rest] = c.trim().split('=');
            return { name: name.trim(), value: rest.join('=') };
          }) || [];
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2]);
          });
        },
      },
    }
  );
  
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    return NextResponse.json({ error: error.message, hint: 'Check email/password' }, { status: 401 });
  }
  
  // Cookies are set on response, redirect to home
  return response;
}
