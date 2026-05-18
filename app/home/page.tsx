export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { createServerSupabaseClient } from "@/app/lib/supabase";
import { QUESTION_LIMITS } from "@/app/lib/prompts";

export default async function HomePage() {
  const supabase = await createServerSupabaseClient();

  // Use getUser() to match what middleware uses — verifies the JWT server-side.
  // getSession() was returning null even when valid cookies existed because chunked
  // cookie reconstruction failed after the server-action sign-in fix.
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, plan, questions_used, questions_reset_at")
    .eq("id", user.id)
    .single();

  const plan = (profile?.plan ?? "free") as keyof typeof QUESTION_LIMITS;
  const limit = QUESTION_LIMITS[plan];
  const used = profile?.questions_used ?? 0;
  const remaining = limit === Infinity ? Infinity : Math.max(0, limit - used);
  const firstName = profile?.name?.split(" ")[0] ?? "there";

  const tips = [
    { icon: "📡", title: "WiFi acting up?", desc: "Router reboot tricks and signal boosters explained simply." },
    { icon: "📺", title: "TV not finding apps?", desc: "Step-by-step help for Roku, Fire TV, Apple TV, and more." },
    { icon: "🔔", title: "Doorbell camera offline?", desc: "Get your Ring or Nest back online fast." },
    { icon: "🔊", title: "Soundbar no sound?", desc: "HDMI ARC, optical cable — we'll sort it out." },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth={2}>
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-bold text-slate-800">Tech Pros Home</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 hidden sm:block">{profile?.name}</span>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-sm text-slate-500 hover:text-slate-700">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Hi {firstName} 👋</h1>
          <p className="text-slate-500 mt-1">What tech question can I help you with today?</p>
        </div>

        {/* Ask AI — big CTA */}
        <Link
          href="/chat"
          className="block bg-blue-600 hover:bg-blue-700 text-white rounded-2xl p-6 mb-6 transition-colors duration-200 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-lg mb-1">Ask your tech question</div>
              <div className="text-blue-200 text-sm">Plain-English help, no jargon</div>
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth={2}>
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          {limit !== Infinity && (
            <div className="mt-4 pt-4 border-t border-white/20 text-sm text-blue-200">
              {remaining} of {limit} free questions remaining this month
            </div>
          )}
          {limit === Infinity && (
            <div className="mt-4 pt-4 border-t border-white/20 text-sm text-blue-200">
              Unlimited questions — {plan} plan
            </div>
          )}
        </Link>

        {/* Usage warning for free users close to limit */}
        {plan === "free" && remaining <= 2 && remaining > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <strong>Almost out of questions!</strong> You have {remaining} question{remaining !== 1 ? "s" : ""} left this month.
            {" "}<Link href="/upgrade" className="underline font-medium">Upgrade for unlimited help →</Link>
          </div>
        )}

        {/* Common topics */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Common questions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tips.map((tip) => (
              <Link
                key={tip.title}
                href={`/chat?q=${encodeURIComponent(tip.desc)}`}
                className="bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm rounded-xl p-4 transition-all duration-200"
              >
                <div className="text-2xl mb-2">{tip.icon}</div>
                <div className="font-medium text-slate-800 text-sm">{tip.title}</div>
                <div className="text-slate-500 text-xs mt-1">{tip.desc}</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Request a callback */}
        <Link
          href="/callback"
          className="block bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-sm rounded-2xl p-6 transition-all duration-200"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-emerald-600" stroke="currentColor" strokeWidth={2}>
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14.92z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-slate-800">Talk to a real tech</div>
              <div className="text-slate-500 text-sm mt-0.5">Request a callback for hands-on help with your setup.</div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-slate-300 ml-auto flex-shrink-0" stroke="currentColor" strokeWidth={2}>
              <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </Link>
      </main>
    </div>
  );
}
