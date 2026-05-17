"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function ChatContent() {
  const searchParams = useSearchParams();
  const prefillQ = searchParams.get("q") ?? "";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState(prefillQ);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Auto-send prefill question
  useEffect(() => {
    if (prefillQ) {
      setTimeout(() => sendMessage(prefillQ), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendMessage(text: string = input) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          conversationId,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (res.status === 429) {
        setLimitReached(true);
        setLoading(false);
        return;
      }

      if (!res.ok) throw new Error("Request failed");

      const newConvId = res.headers.get("X-Conversation-Id");
      if (newConvId) setConversationId(newConvId);

      // Stream response
      const assistantId = crypto.randomUUID();
      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // Parse SSE lines
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const { text } = JSON.parse(data);
              if (text) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content: m.content + text } : m
                  )
                );
              }
            } catch {
              // ignore parse errors
            }
          }
        }
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
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/home" className="text-slate-400 hover:text-slate-600">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth={2}>
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-slate-800 text-sm">Tech Assistant</div>
              <div className="text-xs text-slate-400">Always here to help</div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {messages.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-blue-600" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-700 mb-2">What&apos;s going on with your tech?</h2>
              <p className="text-slate-400 text-sm max-w-xs mx-auto">Describe your problem and I&apos;ll walk you through it step by step — no jargon.</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth={2}>
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                }`}
              >
                {msg.content ? (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                ) : (
                  <div className="flex gap-1 items-center py-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </div>
            </div>
          ))}

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

          {limitReached && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <strong>You&apos;ve used all your free questions this month.</strong>{" "}
              <Link href="/upgrade" className="underline font-medium">Upgrade for unlimited help →</Link>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-slate-200 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || limitReached}
              rows={1}
              placeholder="Type your tech question…"
              className="flex-1 resize-none px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 placeholder-slate-400 text-sm max-h-32 overflow-y-auto"
              style={{ minHeight: "48px" }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim() || limitReached}
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <p className="text-xs text-slate-400 text-center mt-2">
            AI can make mistakes. For complex issues, request a{" "}
            <Link href="/callback" className="underline">callback from a real tech</Link>.
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
