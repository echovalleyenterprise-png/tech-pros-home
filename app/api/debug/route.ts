import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = cookieHeader.split(';').map((c: string) => c.trim());
  const authCookies = cookies.filter((c: string) => c.startsWith('sb-'));
  
  let userData = null;
  let userError = null;
  const envVars = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_URL.slice(0, 50) : 'MISSING',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set (' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.slice(0, 15) + '...)' : 'MISSING',
  };
  
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.getUser();
    userData = data?.user ? { email: data.user.email, id: data.user.id } : null;
    userError = error?.message || null;
  } catch (e: any) {
    userError = String(e);
  }
  
  return NextResponse.json({
    authCookiesFound: authCookies.length,
    authCookieNames: authCookies.map((c: string) => c.split('=')[0]),
    user: userData,
    error: userError,
    envVars,
    ts: new Date().toISOString(),
  });
}
