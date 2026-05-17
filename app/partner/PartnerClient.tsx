"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-xl transition-colors flex-shrink-0"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

export function UpdateCallbackStatus({
  id,
  status,
  label,
  color,
}: {
  id: string;
  status: string;
  label: string;
  color: "blue" | "emerald";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const colorClass =
    color === "blue"
      ? "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
      : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200";

  async function handleClick() {
    setLoading(true);
    await fetch(`/api/partner/callbacks/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50 ${colorClass}`}
    >
      {loading ? "…" : label}
    </button>
  );
}
