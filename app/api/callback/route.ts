import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase";

export async function POST(req: NextRequest) {
  // Trust the x-user-id header injected by middleware (already verified).
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { issue_description, device_type, preferred_time, phone } = body;

  if (!issue_description?.trim()) {
    return NextResponse.json({ error: "Issue description is required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Find the partner who referred this user (if any) — assign them first
  const { data: profile } = await admin
    .from("profiles")
    .select("referred_by")
    .eq("id", userId)
    .single();

  let partnerId: string | null = null;

  if (profile?.referred_by) {
    const { data: partnerProfile } = await admin
      .from("profiles")
      .select("id")
      .eq("affiliate_code", profile.referred_by)
      .single();
    partnerId = partnerProfile?.id ?? null;
  }

  // If no referred partner, pick any available partner (round-robin: fewest open callbacks)
  if (!partnerId) {
    const { data: partners } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "partner");

    if (partners && partners.length > 0) {
      // Pick partner with fewest pending callbacks
      const counts = await Promise.all(
        partners.map(async (p: { id: string }) => {
          const { count } = await admin
            .from("callback_requests")
            .select("id", { count: "exact", head: true })
            .eq("partner_id", p.id)
            .eq("status", "pending");
          return { id: p.id, count: count ?? 0 };
        })
      );
      counts.sort((a: { count: number }, b: { count: number }) => a.count - b.count);
      partnerId = counts[0].id;
    }
  }

  const { data, error } = await admin.from("callback_requests").insert({
    user_id: userId,
    partner_id: partnerId,
    issue_description: issue_description.trim(),
    device_type: device_type || null,
    preferred_time: preferred_time || null,
    phone: phone || null,
    status: "pending",
  }).select("id").single();

  if (error) {
    console.error("Callback insert error:", error);
    return NextResponse.json({ error: "Failed to save request" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
