"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase";

type Role = "homeowner" | "partner";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>("homeowner");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [refCode, setRefCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Read affiliate cookie on mount
  useEffect(() => {
    const match = document.cookie.match(/(?:^|;)\s*ref_code=([^;]+)/);
    if (match) setRefCode(decodeURIComponent(match[1]));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role,
          referred_by: refCode ?? null,
        },
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    router.push("/verify-email");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-800">Tech Pros Home</span>
            </div>
          </Link>
          <p className="text-slate-500 text-sm">Create your free account</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {step === 1 ? (
            <>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Who are you?</h1>
              <p className="text-slate-500 text-sm mb-6">Choose the account type that fits you best.</p>

              <div className="space-y-3 mb-8">
                {/* Homeowner card */}
                <button
                  onClick={() => setRole("homeowner")}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    role === "homeowner"
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${role === "homeowner" ? "bg-blue-600" : "bg-slate-100"}`}>
                      <svg viewBox="0 0 24 24" fill="none" className={`w-5 h-5 ${role === "homeowner" ? "text-white" : "text-slate-500"}`} stroke="currentColor" strokeWidth={2}>
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeLinecap="round" strokeLinejoin="round" />
                        <polyline points="9 22 9 12 15 12 15 22" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">Homeowner</div>
                      <div className="text-sm text-slate-500 mt-0.5">Get AI help with your home tech — TVs, WiFi, smart devices, and more.</div>
                    </div>
                    <div className="ml-auto flex-shrink-0 mt-0.5">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${role === "homeowner" ? "border-blue-500 bg-blue-500" : "border-slate-300"}`}>
                        {role === "homeowner" && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Partner card */}
                <button
                  onClick={() => setRole("partner")}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    role === "partner"
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${role === "partner" ? "bg-emerald-600" : "bg-slate-100"}`}>
                      <svg viewBox="0 0 24 24" fill="none" className={`w-5 h-5 ${role === "partner" ? "text-white" : "text-slate-500"}`} stroke="currentColor" strokeWidth={2}>
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">Partner / Installer</div>
                      <div className="text-sm text-slate-500 mt-0.5">Refer homeowners and earn commissions. Get your own affiliate link.</div>
                    </div>
                    <div className="ml-auto flex-shrink-0 mt-0.5">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${role === "partner" ? "border-emerald-500 bg-emerald-500" : "border-slate-300"}`}>
                        {role === "partner" && <div className="w-2 h-2 rounded-full bg-white" />}
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
              >
                Continue
              </button>

              <p className="mt-6 text-center text-sm text-slate-500">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-6">
                <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-600">
                  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={2}>
                    <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold text-slate-800">Your details</h1>
              </div>

              {refCode && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 text-sm">
                  🎉 You were referred by a partner! Your account will be linked automatically.
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">
                    Full name
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 placeholder-slate-400"
                    placeholder="Jane Smith"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 placeholder-slate-400"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 placeholder-slate-400"
                    placeholder="At least 8 characters"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
                >
                  {loading ? "Creating account…" : "Create account"}
                </button>
              </form>

              <p className="mt-4 text-center text-xs text-slate-400">
                By creating an account you agree to our{" "}
                <Link href="/terms" className="underline">Terms</Link> and{" "}
                <Link href="/privacy" className="underline">Privacy Policy</Link>.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
