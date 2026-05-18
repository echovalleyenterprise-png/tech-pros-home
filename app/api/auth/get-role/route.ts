import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/get-role?userId=<uuid>
 *
 * Looks up role from the profiles table for a given user ID.
 * Called after the browser client has signed in with signInWithPassword().
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ role: "homeowner" });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY!;

  try {
    const profileRes = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=role&limit=1`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } }
    );
    if (profileRes.ok) {
      const profiles = (await profileRes.json()) as Array<{ role: string }>;
      if (profiles.length > 0) {
        return NextResponse.json({ role: profiles[0].role });
      }
    }
  } catch {
    // Fall through to default
  }

  return NextResponse.json({ role: "homeowner" });
}
