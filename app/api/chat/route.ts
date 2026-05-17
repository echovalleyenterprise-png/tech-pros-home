import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase";
import { HOMEOWNER_SYSTEM_PROMPT, QUESTION_LIMITS } from "@/app/lib/prompts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Load profile for plan + question count
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, questions_used, questions_reset_at")
    .eq("id", user.id)
    .single();

  const plan = (profile?.plan ?? "free") as keyof typeof QUESTION_LIMITS;
  const limit = QUESTION_LIMITS[plan];
  const used = profile?.questions_used ?? 0;

  // Check monthly reset (30 days)
  const resetAt = profile?.questions_reset_at ? new Date(profile.questions_reset_at) : new Date(0);
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const needsReset = resetAt < monthAgo;

  let currentUsed = used;
  if (needsReset) {
    currentUsed = 0;
    await supabase
      .from("profiles")
      .update({ questions_used: 0, questions_reset_at: new Date().toISOString() })
      .eq("id", user.id);
  }

  // Enforce limit for free plan
  if (limit !== Infinity && currentUsed >= limit) {
    return NextResponse.json({ error: "Question limit reached" }, { status: 429 });
  }

  const body = await req.json();
  const { message, conversationId, history = [] } = body as {
    message: string;
    conversationId: string | null;
    history: { role: "user" | "assistant"; content: string }[];
  };

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Get or create conversation
  let convId = conversationId;
  if (!convId) {
    const { data: conv } = await admin
      .from("conversations")
      .insert({
        user_id: user.id,
        title: message.slice(0, 80),
      })
      .select("id")
      .single();
    convId = conv?.id ?? null;
  }

  // Persist the user's message
  if (convId) {
    await admin.from("messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "user",
      content: message,
    });
  }

  // Build message history for Anthropic
  const chatMessages: Anthropic.MessageParam[] = [
    ...history.slice(-8).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  // Increment question count (non-blocking)
  supabase
    .from("profiles")
    .update({ questions_used: currentUsed + 1 })
    .eq("id", user.id)
    .then(() => {});

  // Stream from Anthropic
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = "";

      try {
        const anthropicStream = await anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system: HOMEOWNER_SYSTEM_PROMPT,
          messages: chatMessages,
        });

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            const text = chunk.delta.text;
            fullResponse += text;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));

        // Persist assistant response
        if (convId && fullResponse) {
          await admin.from("messages").insert({
            conversation_id: convId,
            user_id: user.id,
            role: "assistant",
            content: fullResponse,
          });
          // Update conversation updated_at
          await admin
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", convId);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ text: `\n\nSorry, I ran into a problem: ${errorMsg}` })}\n\n`
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } finally {
        controller.close();
      }
    },
  });

  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  if (convId) headers.set("X-Conversation-Id", convId);

  return new NextResponse(stream, { headers });
}
