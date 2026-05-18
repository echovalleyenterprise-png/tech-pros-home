"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

// ── Types ─────────────────────────────────────────────────────────────────────
type VideoResult = {
  title: string;
  url: string;
  videoId: string;
  thumbnail: string;
};

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imagePreview?: string; // data URL for user messages with images
  videos?: VideoResult[];
};

// ── Simple markdown renderer ──────────────────────────────────────────────────
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // **bold**
    const boldMatch = remaining.match(/^([\s\S]*?)\*\*([\s\S]+?)\*\*/);
    if (boldMatch) {
      if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>);
      parts.push(<strong key={key++}>{boldMatch[2]}</strong>);
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }
    // `code`
    const codeMatch = remaining.match(/^([\s\S]*?)`([^`]+)`/);
    if (codeMatch) {
      if (codeMatch[1]) parts.push(<span key={key++}>{codeMatch[1]}</span>);
      parts.push(
        <code
          key={key++}
          className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded text-xs font-mono"
        >
          {codeMatch[2]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }
    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return parts;
}

function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === "") {
      i++;
      continue;
    }

    // --- Horizontal rule
    if (line.trim() === "---" || line.trim() === "***" || line.trim() === "___") {
      nodes.push(
        <hr key={key++} className="border-slate-200 my-2" />
      );
      i++;
      continue;
    }

    // # H1 Heading
    if (line.startsWith("# ")) {
      nodes.push(
        <h2 key={key++} className="font-bold text-slate-900 text-base mt-3 mb-1">
          {line.slice(2)}
        </h2>
      );
      i++;
      continue;
    }

    // ## H2 Heading
    if (line.startsWith("## ")) {
      nodes.push(
        <h3 key={key++} className="font-bold text-slate-800 text-sm mt-3 mb-1">
          {line.slice(3)}
        </h3>
      );
      i++;
      continue;
    }

    // ### Sub-heading
    if (line.startsWith("### ")) {
      nodes.push(
        <h4 key={key++} className="font-semibold text-slate-700 text-sm mt-2 mb-0.5">
          {line.slice(4)}
        </h4>
      );
      i++;
      continue;
    }

    // Numbered list — collect consecutive items
    if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const text = lines[i].replace(/^\d+\.\s/, "");
        items.push(
          <li key={i} className="ml-1">
            {renderInline(text)}
          </li>
        );
        i++;
      }
      nodes.push(
        <ol key={key++} className="list-decimal list-inside space-y-1 my-2 text-sm">
          {items}
        </ol>
      );
      continue;
    }

    // Bullet list — collect consecutive items
    if (/^[-*•]\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i])) {
        const text = lines[i].replace(/^[-*•]\s/, "");
        items.push(
          <li key={i} className="ml-1">
            {renderInline(text)}
          </li>
        );
        i++;
      }
      nodes.push(
        <ul key={key++} className="list-disc list-inside space-y-1 my-2 text-sm">
          {items}
        </ul>
      );
      continue;
    }

    // Regular paragraph
    nodes.push(
      <p key={key++} className="text-sm leading-relaxed my-1">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{nodes}</div>;
}

// ── YouTube video card ────────────────────────────────────────────────────────
function VideoCard({ video }: { video: VideoResult }) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors mt-2"
    >
      <div className="relative flex-shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-20 h-14 object-cover rounded-lg"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center shadow">
            <svg viewBox="0 0 24 24" fill="white" className="w-3.5 h-3.5 ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-700 line-clamp-2 leading-snug">
          {video.title}
        </p>
        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z" />
          </svg>
          Watch on YouTube
        </p>
      </div>
    </a>
  );
}

// ── Image compression ─────────────────────────────────────────────────────────
async function compressImage(
  file: File,
  maxPx = 1280,
  quality = 0.82
): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        const base64 = dataUrl.split(",")[1];
        resolve({ base64, mediaType: "image/jpeg" });
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Quick action chips ────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  "My WiFi keeps dropping",
  "TV shows black screen",
  "Streaming keeps buffering",
  "Smart device won't connect",
  "Camera shows offline",
  "Remote not working",
];

// ── Main chat component ───────────────────────────────────────────────────────
function ChatContent() {
  const searchParams = useSearchParams();
  const prefillQ = searchParams.get("q") ?? "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(prefillQ);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [pendingImage, setPendingImage] = useState<{
    file: File;
    preview: string;
    base64: string;
    mediaType: string;
  } | null>(null);
  const [feedbackSent, setFeedbackSent] = useState<Set<string>>(new Set());
  const [pendingVideos, setPendingVideos] = useState<VideoResult[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-send prefill question
  useEffect(() => {
    if (prefillQ) {
      const t = setTimeout(() => sendMessage(prefillQ), 400);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendMessage = useCallback(
    async (text: string = input) => {
      const trimmed = text.trim();
      if (!trimmed && !pendingImage) return;
      if (loading) return;

      // Build message content
      const userContent: ContentBlock[] = [];
      if (pendingImage) {
        userContent.push({
          type: "image",
          source: {
            type: "base64",
            media_type: pendingImage.mediaType,
            data: pendingImage.base64,
          },
        });
      }
      if (trimmed) {
        userContent.push({ type: "text", text: trimmed });
      }

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed || "📷 Photo shared",
        imagePreview: pendingImage?.preview,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setPendingImage(null);
      setLoading(true);
      setPendingVideos([]);

      // Build messages array for the API (last 8 turns + new user message)
      const apiHistory = messages.slice(-8).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const apiMessages = [
        ...apiHistory,
        { role: "user" as const, content: userContent.length === 1 && !pendingImage ? trimmed : userContent },
      ];

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages, conversationId }),
        });

        if (res.status === 429) {
          setLimitReached(true);
          setLoading(false);
          return;
        }

        if (!res.ok) throw new Error("Request failed");

        const newConvId = res.headers.get("X-Conversation-Id");
        if (newConvId) setConversationId(newConvId);

        // Add empty assistant message to stream into
        const assistantId = crypto.randomUUID();
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: "" },
        ]);

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let capturedVideos: VideoResult[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") break;

            try {
              const parsed = JSON.parse(data);

              // Metadata event (videos)
              if (parsed.type === "meta" && Array.isArray(parsed.videos)) {
                capturedVideos = parsed.videos;
                continue;
              }

              // Text chunk
              if (parsed.text) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + parsed.text }
                      : m
                  )
                );
              }
            } catch {
              // ignore parse errors
            }
          }
        }

        // Attach videos to the assistant message once streaming is done
        if (capturedVideos.length > 0) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, videos: capturedVideos } : m
            )
          );
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: "Sorry, something went wrong. Please try again.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input, loading, pendingImage, messages, conversationId]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    try {
      const preview = URL.createObjectURL(file);
      const { base64, mediaType } = await compressImage(file);
      setPendingImage({ file, preview, base64, mediaType });
    } catch {
      console.error("Image compression failed");
    }
  }

  async function sendFeedback(msgId: string, rating: 1 | -1) {
    if (!conversationId || feedbackSent.has(msgId)) return;
    setFeedbackSent((prev) => new Set(prev).add(msgId));

    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, rating }),
      });
    } catch {
      // fail silently
    }
  }

  const canSend = (input.trim().length > 0 || pendingImage !== null) && !loading && !limitReached;

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/home" className="text-slate-400 hover:text-slate-600 p-1">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth={2}>
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-slate-800 text-sm">Tech Assistant</div>
              <div className="text-xs text-emerald-500 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
                Online
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

          {/* Empty state */}
          {messages.length === 0 && !loading && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-blue-600" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-700 mb-1">
                What&apos;s going on with your tech?
              </h2>
              <p className="text-slate-400 text-sm max-w-xs mx-auto mb-6">
                Ask anything — WiFi, TVs, smart home devices. You can also send a photo!
              </p>

              {/* Quick action chips */}
              <div className="flex flex-wrap gap-2 justify-center">
                {QUICK_ACTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => sendMessage(q)}
                    className="px-3 py-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-full text-sm transition-colors shadow-sm"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((msg, idx) => (
            <div key={msg.id}>
              <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                    <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth={2}>
                      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                      <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}

                <div className="max-w-[85%]">
                  {/* Image preview (user messages) */}
                  {msg.imagePreview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={msg.imagePreview}
                      alt="Uploaded"
                      className="rounded-xl mb-1 max-w-full max-h-48 object-cover ml-auto block"
                    />
                  )}

                  {/* Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                    }`}
                  >
                    {msg.content ? (
                      msg.role === "assistant" ? (
                        <SimpleMarkdown content={msg.content} />
                      ) : (
                        <div className="text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      )
                    ) : (
                      // Streaming indicator
                      <div className="flex gap-1 items-center py-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    )}
                  </div>

                  {/* YouTube video cards */}
                  {msg.role === "assistant" && msg.videos && msg.videos.length > 0 && (
                    <div className="mt-1 space-y-1">
                      <p className="text-xs text-slate-400 ml-1">Related videos</p>
                      {msg.videos.map((v) => (
                        <VideoCard key={v.videoId} video={v} />
                      ))}
                    </div>
                  )}

                  {/* Feedback buttons (show on last completed assistant message) */}
                  {msg.role === "assistant" &&
                    msg.content &&
                    idx === messages.length - 1 &&
                    !loading && (
                      <div className="flex items-center gap-2 mt-2 ml-1">
                        <span className="text-xs text-slate-400">Helpful?</span>
                        <button
                          onClick={() => sendFeedback(msg.id, 1)}
                          disabled={feedbackSent.has(msg.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            feedbackSent.has(msg.id)
                              ? "text-slate-300"
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title="Helpful"
                        >
                          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
                            <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button
                          onClick={() => sendFeedback(msg.id, -1)}
                          disabled={feedbackSent.has(msg.id)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            feedbackSent.has(msg.id)
                              ? "text-slate-300"
                              : "text-slate-400 hover:text-red-500 hover:bg-red-50"
                          }`}
                          title="Not helpful"
                        >
                          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
                            <path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator while waiting for first token */}
          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex justify-start">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1 items-center py-1">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {/* Limit reached */}
          {limitReached && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <strong>You&apos;ve used all your free questions this month.</strong>{" "}
              <Link href="/upgrade" className="underline font-medium">
                Upgrade for unlimited help →
              </Link>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-slate-200 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Image preview strip */}
          {pendingImage && (
            <div className="flex items-center gap-2 mb-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pendingImage.preview}
                alt="Preview"
                className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
              />
              <span className="text-xs text-slate-500 flex-1">Photo ready to send</span>
              <button
                onClick={() => setPendingImage(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex gap-2 items-end">
            {/* Camera / image upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading || limitReached}
              className="w-11 h-11 flex-shrink-0 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-500 rounded-xl flex items-center justify-center transition-colors"
              title="Upload a photo"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Text area */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || limitReached}
              rows={1}
              placeholder={pendingImage ? "Add a message (optional)…" : "Type your tech question…"}
              className="flex-1 resize-none px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 placeholder-slate-400 text-sm max-h-32 overflow-y-auto"
              style={{ minHeight: "44px" }}
            />

            {/* Send button */}
            <button
              onClick={() => sendMessage()}
              disabled={!canSend}
              className="w-11 h-11 flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white disabled:text-slate-400 rounded-xl flex items-center justify-center transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <p className="text-xs text-slate-400 text-center mt-2">
            AI can make mistakes. For complex issues,{" "}
            <Link href="/callback" className="underline">
              request a callback from a real tech
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen text-slate-400">Loading…</div>}>
      <ChatContent />
    </Suspense>
  );
}
