import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <div className="mb-8">
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
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          {/* Email icon */}
          <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8 text-blue-600" stroke="currentColor" strokeWidth={1.5}>
              <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-slate-800 mb-3">Check your email</h1>
          <p className="text-slate-500 mb-6">
            We&apos;ve sent you a verification link. Click it to activate your account — then you&apos;ll be taken straight to your dashboard.
          </p>

          <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-500 mb-6">
            <p>Can&apos;t find the email? Check your spam folder, or{" "}
              <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                try signing up again
              </Link>
              {" "}with a different address.
            </p>
          </div>

          <Link
            href="/login"
            className="inline-block text-sm text-slate-500 hover:text-slate-700"
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
