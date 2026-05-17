import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/app/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/home";

  if (code) {
    // Collect cookies that exchangeCodeForSession wants to set, then apply
    // them directly to the Response object — cookieStore.set() silently fails
    // in Route Handlers, so we can't use createServerSupabaseClient() here.
    const cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[] = [];

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(items: { name: string; value: string; options?: Record<string, unknown> }[]) {
            items.forEach((item) =>
              cookiesToSet.push(item as { name: string; value: string; options: Record<string, unknown> })
            );
          },
        },
      }
    );
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

      // Apply session cookies onto the redirect response
      cookiesToSet.forEach(({ name, value, options }) => {
        response.cookies.set(
          name,
          value,
          options as Parameters<typeof response.cookies.set>[2]
        );
      });

      // Clear affiliate cookie
      response.cookies.set("ref_code", "", { maxAge: 0, path: "/" });
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
