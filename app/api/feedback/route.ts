import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/app/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    // Trust the x-user-id header injected by middleware (already verified).
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { conversationId, rating, comment } = body as {
      conversationId: string;
      rating: 1 | -1;
      comment?: string;
    };

    if (!conversationId || (rating !== 1 && rating !== -1)) {
      return NextResponse.json({ error: "Invalid feedback" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Find the most recent assistant message in this conversation
    const { data: msg } = await admin
      .from("messages")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("role", "assistant")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    await admin.from("feedback").insert({
      message_id: msg?.id ?? null,
      conversation_id: conversationId,
      user_id: userId,
      rating,
      comment: comment ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Feedback] error:", err);
    return NextResponse.json({ success: true }); // fail silently
  }
}
