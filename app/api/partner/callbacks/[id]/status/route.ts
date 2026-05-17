import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/app/lib/supabase";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json();
  const allowed = ["scheduled", "completed", "cancelled"];
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { error } = await supabase
    .from("callback_requests")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", params.id)
    .eq("partner_id", user.id); // RLS: only the assigned partner can update

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
