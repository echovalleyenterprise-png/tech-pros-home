import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/app/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  
  // Find auth cookies
  const authCookies = allCookies.filter((c) => c.name.startsWith("sb-"));
  
  // Show raw values (truncated for safety)
  const cookieDetails = authCookies.map((c) => {
    let decoded: string | null = null;
    let parsed: unknown = null;
    let parseError: string | null = null;
    
    try {
      decoded = decodeURIComponent(c.value);
    } catch (e) {
      decoded = "(failed to decodeURIComponent)";
    }
    
    try {
      if (decoded) parsed = JSON.parse(decoded);
    } catch (e) {
      parseError = String(e);
    }
    
    return {
      name: c.name,
      rawValueLength: c.value.length,
      rawValuePreview: c.value.slice(0, 100) + (c.value.length > 100 ? "..." : ""),
      decodedPreview: decoded ? decoded.slice(0, 150) + (decoded.length > 150 ? "..." : "") : null,
      parsedKeys: parsed && typeof parsed === "object" ? Object.keys(parsed as object) : null,
      parseError,
    };
  });

  let userData = null;
  let userError = null;
  let sessionData = null;
  let sessionError = null;

  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: sData, error: sError } = await supabase.auth.getSession();
    sessionData = sData?.session
      ? { expires_at: sData.session.expires_at, user_email: sData.session.user?.email }
      : null;
    sessionError = sError?.message || null;
    
    const { data, error } = await supabase.auth.getUser();
    userData = data?.user ? { email: data.user.email, id: data.user.id } : null;
    userError = error?.message || null;
  } catch (e: unknown) {
    userError = String(e);
  }

  return NextResponse.json({
    totalCookies: allCookies.length,
    authCookies: cookieDetails,
    session: sessionData,
    sessionError,
    user: userData,
    userError,
    envCheck: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
        ? process.env.NEXT_PUBLIC_SUPABASE_URL.slice(0, 50)
        : "MISSING",
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "MISSING",
    },
  });
}
