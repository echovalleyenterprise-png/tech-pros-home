import { type NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/home";

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      const user = data.user;
      const role = user.user_metadata?.role;
      const referredBy = user.user_metadata?.referred_by as string | undefined;

      // Log referral if user was referred by a partner
      if (referredBy) {
        const admin = createAdminClient();
        // Find the partner who owns this affiliate code
        const { data: partnerProfile } = await admin
          .from("profiles")
          .select("id")
          .eq("affiliate_code", referredBy)
          .single();

        if (partnerProfile) {
          await admin.from("referrals").insert({
            partner_id: partnerProfile.id,
            referred_user_id: user.id,
            affiliate_code: referredBy,
            plan: "free",
            is_paying: false,
          });
        }
      }

      const destination = role === "partner" ? "/partner" : next;

      const response = NextResponse.redirect(`${origin}${destination}`);
      // Clear affiliate cookie
      response.cookies.set("ref_code", "", { maxAge: 0, path: "/" });
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
