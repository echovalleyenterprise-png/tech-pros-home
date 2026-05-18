import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — Tech Pros Home",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
            ← Back to home
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-slate-800 mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-10">Last updated: May 2026</p>

        <div className="prose prose-slate max-w-none space-y-8 text-slate-700">
          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">1. Information We Collect</h2>
            <p>When you use Tech Pros Home, we collect:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Account information:</strong> Name and email address when you sign up</li>
              <li><strong>Usage data:</strong> Questions you ask, chat history, and interaction logs</li>
              <li><strong>Device information:</strong> Browser type, device type, and IP address</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide and improve the Service</li>
              <li>Maintain your conversation history and preferences</li>
              <li>Send account-related communications (e.g., email verification)</li>
              <li>Analyze usage patterns to improve AI responses</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">3. Data Storage</h2>
            <p>
              Your data is stored securely using Supabase, a hosted database service. Conversation
              history is retained to provide continuity across sessions. You may request deletion of
              your account and associated data by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">4. AI Processing</h2>
            <p>
              Questions you submit are processed by Anthropic&apos;s Claude AI models. By using the Service,
              you acknowledge that your queries may be transmitted to Anthropic for processing in
              accordance with{" "}
              <a
                href="https://www.anthropic.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700"
              >
                Anthropic&apos;s Privacy Policy
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">5. Information Sharing</h2>
            <p>
              We do not sell your personal information. We do not share your data with third parties
              except as necessary to provide the Service (e.g., AI processing, hosting infrastructure)
              or as required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">6. Cookies</h2>
            <p>
              We use cookies solely for authentication purposes — to keep you signed in across sessions.
              We do not use advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and data</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, contact us at{" "}
              <a href="mailto:support@techpros.app" className="text-blue-600 hover:text-blue-700">
                support@techpros.app
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant
              changes by posting a notice on our website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-800 mb-3">9. Contact</h2>
            <p>
              Questions about this Privacy Policy? Email us at{" "}
              <a href="mailto:support@techpros.app" className="text-blue-600 hover:text-blue-700">
                support@techpros.app
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
