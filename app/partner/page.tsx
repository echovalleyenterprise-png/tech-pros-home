export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/app/lib/supabase";
import { CopyButton, UpdateCallbackStatus } from "./PartnerClient";

export default async function PartnerPage() {
  // Read user ID from header set by middleware — avoids re-verifying JWT in the
  // serverless runtime (which can't reliably read the same cookies Edge verified).
  const headersList = await headers();
  const userId = headersList.get("x-user-id");

  if (!userId) redirect("/login");

  const supabase = await createServerSupabaseClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, role, affiliate_code")
    .eq("id", userId)
    .single();

  // Must be a partner
  if (profile?.role !== "partner") redirect("/home");

  const affiliateCode = profile?.affiliate_code;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://tech-pros-home.vercel.app";
  const affiliateLink = affiliateCode ? `${baseUrl}/ref/${affiliateCode}` : null;

  // Load referrals
  const { data: referrals } = await supabase
    .from("referrals")
    .select("id, affiliate_code, plan, is_paying, created_at")
    .eq("partner_id", userId)
    .order("created_at", { ascending: false });

  // Load callback requests assigned to this partner
  const { data: callbacks } = await supabase
    .from("callback_requests")
    .select("id, issue_description, device_type, preferred_time, phone, status, created_at")
    .eq("partner_id", userId)
    .order("created_at", { ascending: false });

  const totalReferrals = referrals?.length ?? 0;
  const payingReferrals = referrals?.filter((r: { is_paying: boolean }) => r.is_paying).length ?? 0;
  // $5 per paying referral (placeholder commission)
  const estimatedEarnings = payingReferrals * 5;

  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    scheduled: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-slate-100 text-slate-500",
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth={2}>
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-bold text-slate-800">Partner Dashboard</span>
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

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center">
            <div className="text-3xl font-bold text-slate-800">{totalReferrals}</div>
            <div className="text-sm text-slate-500 mt-1">Total referrals</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center">
            <div className="text-3xl font-bold text-emerald-600">{payingReferrals}</div>
            <div className="text-sm text-slate-500 mt-1">Paying customers</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 text-center">
            <div className="text-3xl font-bold text-slate-800">${estimatedEarnings}</div>
            <div className="text-sm text-slate-500 mt-1">Est. earnings</div>
          </div>
        </div>

        {/* Affiliate link */}
        {affiliateLink && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h2 className="font-semibold text-slate-800 mb-1">Your affiliate link</h2>
            <p className="text-sm text-slate-500 mb-4">Share this link with homeowners. When they sign up, they&apos;re automatically linked to your account.</p>
            <div className="flex gap-2">
              <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 font-mono truncate">
                {affiliateLink}
              </div>
              <CopyButton text={affiliateLink} />
            </div>
          </div>
        )}

        {/* Callback requests */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Callback requests</h2>
          {!callbacks || callbacks.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">No callback requests yet.</p>
          ) : (
            <div className="space-y-3">
              {(callbacks as { id: string; issue_description: string; device_type: string | null; preferred_time: string | null; phone: string | null; status: string; created_at: string }[]).map((cb) => (
                <div key={cb.id} className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-medium text-slate-800 text-sm">{cb.issue_description}</div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${statusColors[cb.status] ?? "bg-slate-100 text-slate-500"}`}>
                      {cb.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    {cb.device_type && <span>📱 {cb.device_type}</span>}
                    {cb.preferred_time && <span>🕐 {cb.preferred_time}</span>}
                    {cb.phone && <span>📞 {cb.phone}</span>}
                    <span>📅 {new Date(cb.created_at).toLocaleDateString()}</span>
                  </div>
                  {cb.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <UpdateCallbackStatus id={cb.id} status="scheduled" label="Mark scheduled" color="blue" />
                      <UpdateCallbackStatus id={cb.id} status="completed" label="Mark complete" color="emerald" />
                    </div>
                  )}
                  {cb.status === "scheduled" && (
                    <div className="mt-3">
                      <UpdateCallbackStatus id={cb.id} status="completed" label="Mark complete" color="emerald" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Referrals table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Referral history</h2>
          {!referrals || referrals.length === 0 ? (
            <p className="text-slate-400 text-sm py-4 text-center">
              No referrals yet. Share your link to get started!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-100">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Plan</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(referrals as { id: string; plan: string; is_paying: boolean; created_at: string }[]).map((r) => (
                    <tr key={r.id}>
                      <td className="py-3 text-slate-600">{new Date(r.created_at).toLocaleDateString()}</td>
                      <td className="py-3">
                        <span className="capitalize text-slate-600">{r.plan}</span>
                      </td>
                      <td className="py-3">
                        {r.is_paying ? (
                          <span className="text-emerald-600 font-medium">Paying ✓</span>
                        ) : (
                          <span className="text-slate-400">Free</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

