import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export async function GET() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();

  // Raw cookie inspection
  const authCookies = allCookies.filter((c) => c.name.startsWith("sb-"));

  // Try to manually parse the session from the cookie
  let manualSession: unknown = null;
  let manualError: string | null = null;
  for (const c of authCookies) {
    try {
      const decoded = decodeURIComponent(c.value);
      manualSession = JSON.parse(decoded);
    } catch (e) {
      manualError = String(e);
    }
  }

  // Try createServerClient with verbose logging of what getAll returns
  const cookieLog: { name: string; valueLen: number; valueFirst50: string }[] = [];
  let sessionResult: unknown = null;
  let sessionError: string | null = null;

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const all = cookieStore.getAll();
            all.forEach((c) =>
              cookieLog.push({
                name: c.name,
                valueLen: c.value.length,
                valueFirst50: c.value.slice(0, 50),
              })
            );
            return all;
          },
          setAll() {},
        },
      }
    );

    const { data, error } = await supabase.auth.getSession();
    sessionResult = data?.session
      ? {
          email: data.session.user?.email,
          expires_at: data.session.expires_at,
        }
      : null;
    sessionError = error?.message ?? null;
  } catch (e: unknown) {
    sessionError = String(e);
  }

  // Check the SUPABASE_URL to ensure it matches what's in the cookie
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "").split(".")[0];
  const expectedCookieName = `sb-${projectRef}-auth-token`;

  return NextResponse.json({
    projectRef,
    expectedCookieName,
    cookieLog,
    authCookies: authCookies.map((c) => ({
      name: c.name,
      nameMatchesExpected: c.name === expectedCookieName,
      valueLen: c.value.length,
      valueFirst100: c.value.slice(0, 100),
      isUrlEncoded: c.value.includes("%"),
    })),
    manualSession: manualSession
      ? { keys: Object.keys(manualSession as object) }
      : null,
    manualError,
    sessionResult,
    sessionError,
  });
}
