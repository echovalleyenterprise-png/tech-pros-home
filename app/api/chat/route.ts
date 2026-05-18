import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createServerSupabaseClient, createAdminClient } from "@/app/lib/supabase";
import { HOMEOWNER_SYSTEM_PROMPT, QUESTION_LIMITS } from "@/app/lib/prompts";
import {
  retrieveRelevantChunks,
  formatRetrievedContext,
  extractModelAndBrand,
} from "@/app/lib/retrieval";
import { searchInstallHelp, formatSearchContext } from "@/app/lib/search";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export const runtime = "nodejs";
export const maxDuration = 60;

// ── Types ─────────────────────────────────────────────────────────────────────
type TextBlock = { type: "text"; text: string };
type ImageBlock = {
  type: "image";
  source: {
    type: "base64";
    media_type: string;
    data: string;
  };
};
type ContentBlock = TextBlock | ImageBlock;

type MessageParam = {
  role: "user" | "assistant";
  content: string | ContentBlock[];
};

// Normalize iOS/non-standard media types to Anthropic-accepted values
function normalizeMediaType(
  raw: string
): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  const valid = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
  if ((valid as readonly string[]).includes(raw)) return raw as (typeof valid)[number];
  if (raw.includes("jpg") || raw.includes("jpeg") || raw.includes("heic") || raw.includes("heif"))
    return "image/jpeg";
  if (raw.includes("png")) return "image/png";
  if (raw.includes("gif")) return "image/gif";
  if (raw.includes("webp")) return "image/webp";
  return "image/jpeg";
}

function normalizeMessages(messages: MessageParam[]): Anthropic.MessageParam[] {
  return messages.map((msg) => {
    if (typeof msg.content === "string") {
      return { role: msg.role, content: msg.content };
    }
    return {
      role: msg.role,
      content: msg.content.map((block) => {
        if (block.type === "image") {
          return {
            ...block,
            source: {
              ...block.source,
              media_type: normalizeMediaType(block.source.media_type),
            },
          } as Anthropic.ImageBlockParam;
        }
        return block as Anthropic.TextBlockParam;
      }),
    };
  });
}

// Extract plain text from message content (for retrieval query)
function extractTextFromContent(content: string | ContentBlock[]): string {
  if (typeof content === "string") return content;
  return content
    .filter((b): b is TextBlock => b.type === "text")
    .map((b) => b.text)
    .join(" ");
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  // Monthly reset (30 days)
  const resetAt = profile?.questions_reset_at
    ? new Date(profile.questions_reset_at)
    : new Date(0);
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

  if (limit !== Infinity && currentUsed >= limit) {
    return NextResponse.json({ error: "Question limit reached" }, { status: 429 });
  }

  let body: { messages?: MessageParam[]; conversationId?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { messages = [], conversationId = null } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages array required" }, { status: 400 });
  }

  // Extract last user message text for RAG + search
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const queryText = lastUserMsg ? extractTextFromContent(lastUserMsg.content) : "";
  const hasImage =
    lastUserMsg &&
    Array.isArray(lastUserMsg.content) &&
    lastUserMsg.content.some((b) => b.type === "image");

  // ── RAG + Search (parallel, both fail gracefully) ─────────────────────────
  let contextString = "";
  let searchContextString = "";
  let videoResults: { title: string; url: string; videoId: string; thumbnail: string }[] = [];

  if (queryText.length > 5) {
    const { model: detectedModel, brand: detectedBrand } = extractModelAndBrand(queryText);

    const [ragResult, searchResult] = await Promise.allSettled([
      process.env.VOYAGE_API_KEY
        ? retrieveRelevantChunks(queryText, {
            matchCount: 5,
            matchThreshold: 0.65,
            filterBrand: detectedBrand,
            filterModel: detectedModel,
          })
        : Promise.resolve([]),
      searchInstallHelp(queryText),
    ]);

    if (ragResult.status === "fulfilled") {
      let chunks = ragResult.value;
      // Retry without brand/model filter if empty
      if (
        chunks.length === 0 &&
        (detectedBrand || detectedModel) &&
        process.env.VOYAGE_API_KEY
      ) {
        chunks = await retrieveRelevantChunks(queryText, {
          matchCount: 5,
          matchThreshold: 0.65,
        }).catch(() => []);
      }
      contextString = formatRetrievedContext(chunks);
    }

    if (searchResult.status === "fulfilled") {
      searchContextString = formatSearchContext(searchResult.value);
      videoResults = searchResult.value.videos;
    }
  }

  // ── Build system prompt ───────────────────────────────────────────────────
  const systemPrompt =
    HOMEOWNER_SYSTEM_PROMPT +
    (hasImage ? "\n\nThe user has shared a photo. Start by describing what you see, then help them." : "") +
    contextString +
    searchContextString;

  // ── Conversation persistence ──────────────────────────────────────────────
  const admin = createAdminClient();
  let convId = conversationId ?? null;

  if (!convId) {
    const { data: conv } = await admin
      .from("conversations")
      .insert({ user_id: user.id, title: queryText.slice(0, 80) })
      .select("id")
      .single();
    convId = conv?.id ?? null;
  }

  if (convId) {
    await admin.from("messages").insert({
      conversation_id: convId,
      user_id: user.id,
      role: "user",
      content: queryText,
    });
  }

  // Increment usage (non-blocking)
  supabase
    .from("profiles")
    .update({ questions_used: currentUsed + 1 })
    .eq("id", user.id)
    .then(() => {});

  // ── Stream response (SSE) ─────────────────────────────────────────────────
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let fullResponse = "";

      try {
        const anthropicStream = await anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 1500,
          system: systemPrompt,
          messages: normalizeMessages(messages),
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

        // Send video metadata before DONE so client can show cards
        if (videoResults.length > 0) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "meta", videos: videoResults })}\n\n`
            )
          );
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
          await admin
            .from("conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", convId);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ text: `\n\nSorry, something went wrong: ${msg}` })}\n\n`
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
