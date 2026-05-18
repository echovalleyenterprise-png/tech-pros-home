import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Trust the x-user-id header injected by middleware (already verified).
  const userId = req.headers.get("x-user-id");
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json();
  const allowed = ["scheduled", "completed", "cancelled"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("callback_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("partner_id", userId); // only the assigned partner can update

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
