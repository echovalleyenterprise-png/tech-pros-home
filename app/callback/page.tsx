"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const DEVICE_TYPES = [
  "TV / Streaming",
  "WiFi / Router",
  "Smart home device",
  "Security camera",
  "Soundbar / speakers",
  "Other",
];

const TIME_SLOTS = [
  "Morning (8am–12pm)",
  "Afternoon (12pm–5pm)",
  "Evening (5pm–8pm)",
  "Weekends only",
  "Flexible",
];

export default function CallbackPage() {
  const router = useRouter();
  const [issue, setIssue] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!issue.trim()) return;

    setError("");
    setLoading(true);

    const res = await fetch("/api/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issue_description: issue,
        device_type: deviceType,
        preferred_time: preferredTime,
        phone,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl border border-slate-200 p-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-emerald-600" stroke="currentColor" strokeWidth={1.5}>
                <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-3">Request sent!</h1>
            <p className="text-slate-500 mb-6">
              A tech will be in touch soon to schedule your callback. You&apos;ll hear from us within 1 business day.
            </p>
            <Link
              href="/home"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/home" className="text-slate-400 hover:text-slate-600">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <div>
            <div className="font-semibold text-slate-800">Request a callback</div>
            <div className="text-xs text-slate-400">Talk to a real tech</div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <p className="text-slate-500 text-sm mb-6">
            Tell us what&apos;s going on and when works for you. A certified tech will call you back to help sort it out.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Issue description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                What&apos;s the problem? <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={issue}
                onChange={(e) => setIssue(e.target.value)}
                placeholder="E.g. My TV won't connect to my soundbar. I have a Samsung TV and Sonos Arc."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 placeholder-slate-400 text-sm resize-none"
              />
            </div>

            {/* Device type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                What type of device?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DEVICE_TYPES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDeviceType(d === deviceType ? "" : d)}
                    className={`text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${
                      deviceType === d
                        ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Preferred time */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                When should we call?
              </label>
              <div className="space-y-2">
                {TIME_SLOTS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPreferredTime(t === preferredTime ? "" : t)}
                    className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                      preferredTime === t
                        ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Phone number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 000-0000"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 placeholder-slate-400 text-sm"
              />
              <p className="text-xs text-slate-400 mt-1">Optional — we can also email you to schedule.</p>
            </div>

            <button
              type="submit"
              disabled={loading || !issue.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
            >
              {loading ? "Sending…" : "Request callback"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
