"use client";

import { useEffect, useState, useCallback } from "react";
import { getSubscriptions, getSubscriptionStats, cancelSubscription } from "@/lib/api/adminSubscriptions";

const STATUS_FILTERS = [
  { key: "", label: "All" },
  { key: "active", label: "Active" },
  { key: "lifetime", label: "Lifetime" },
  { key: "past_due", label: "Past due" },
  { key: "canceled", label: "Canceled" },
  { key: "expired", label: "Expired" },
];

const STATUS_STYLES = {
  active: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300",
  lifetime: "bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300",
  past_due: "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300",
  canceled: "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
  expired: "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300",
};

function StatTile({ label, value, sub }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="text-2xl font-osw font-bold text-slate-800 dark:text-white">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      {sub && <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}

function fmtDate(s) {
  if (!s) return "—";
  const d = new Date(s.replace(" ", "T") + "Z");
  return isNaN(d) ? s : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function AdminPremium() {
  const [subs, setSubs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [cancelingId, setCancelingId] = useState(null);
  const [notice, setNotice] = useState(null); // { ok: bool, text: string }

  const fetchSubs = useCallback(async (pageNum = 1, status = statusFilter) => {
    setLoading(true);
    try {
      const data = await getSubscriptions({ page: pageNum, perPage: 25, status });
      setSubs(data.subscriptions || []);
      setPagination(data.pagination || null);
      setPage(pageNum);
    } catch (err) {
      setNotice({ ok: false, text: err.message || "Failed to load subscriptions" });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    getSubscriptionStats()
      .then((data) => { setStats(data.stats || null); setTrends(data.trends || null); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchSubs(1, statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const handleCancel = async (sub) => {
    const ok = confirm(
      `Cancel ${sub.display_name || sub.user_email}'s ${sub.plan_name}?\n\n` +
      `They keep premium until ${fmtDate(sub.current_period_end)}, then it won't renew.`
    );
    if (!ok) return;
    setCancelingId(sub.id);
    setNotice(null);
    try {
      const res = await cancelSubscription(sub.id);
      setNotice({ ok: true, text: res.message || "Canceled." });
      setSubs((list) => list.map((s) => (s.id === sub.id ? { ...s, ...res.subscription } : s)));
    } catch (err) {
      setNotice({ ok: false, text: err.message || "Cancel failed" });
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white">Premium Members</h2>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          <StatTile label="Active recurring" value={stats.active} sub={`${stats.monthly} monthly · ${stats.annual} annual`} />
          <StatTile label="Lifetime" value={stats.lifetime} />
          <StatTile label="Full Bean" value={stats.full_bean} sub={`${stats.supporter_tier} supporter tier`} />
          <StatTile label="Stripe / PayPal" value={`${stats.stripe_total} / ${stats.paypal_total}`} sub="all time" />
          <StatTile label="New joins" value={trends ? trends.joins_30d : "—"} sub={trends ? `${trends.joins_7d} in last 7d · 30d shown` : ""} />
          <StatTile label="Cancels (30d)" value={trends ? trends.cancels_30d : "—"} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              statusFilter === f.key
                ? "bg-primary-500 border-primary-500 text-white"
                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {notice && (
        <div className={`px-3 py-2 mb-4 text-sm rounded-lg border ${
          notice.ok
            ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
            : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
        }`}>
          {notice.text}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full" />
        </div>
      ) : subs.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm py-8 text-center">No subscriptions found.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                  <th className="py-3 px-3 font-medium text-gray-500 dark:text-gray-400">Member</th>
                  <th className="py-3 px-3 font-medium text-gray-500 dark:text-gray-400">Plan</th>
                  <th className="py-3 px-3 font-medium text-gray-500 dark:text-gray-400">Platform</th>
                  <th className="py-3 px-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="py-3 px-3 font-medium text-gray-500 dark:text-gray-400">Joined</th>
                  <th className="py-3 px-3 font-medium text-gray-500 dark:text-gray-400">Renews / Ends</th>
                  <th className="py-3 px-3 font-medium text-gray-500 dark:text-gray-400 w-24 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-2 px-3">
                      <div className="text-gray-900 dark:text-gray-200 font-medium">{s.display_name || "(deleted user)"}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">{s.user_email}</div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="text-gray-900 dark:text-gray-200">{s.plan_name}</div>
                      <div className="text-gray-500 dark:text-gray-400 text-xs">{s.recurring ? "Recurring" : "One-time"}</div>
                    </td>
                    <td className="py-2 px-3 text-gray-700 dark:text-gray-300 capitalize">{s.processor}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${STATUS_STYLES[s.status] || STATUS_STYLES.canceled}`}>
                        {s.status.replace("_", " ")}
                      </span>
                      {s.cancel_at_period_end && s.status === "active" && (
                        <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                          ends {fmtDate(s.current_period_end)}
                        </div>
                      )}
                    </td>
                    <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{fmtDate(s.created_at)}</td>
                    <td className="py-2 px-3 text-gray-500 dark:text-gray-400">
                      {s.status === "lifetime" ? "Never" : fmtDate(s.current_period_end)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      {s.status === "active" && !s.cancel_at_period_end && (
                        <button
                          onClick={() => handleCancel(s)}
                          disabled={cancelingId === s.id}
                          className="text-red-500 hover:text-red-700 disabled:opacity-50 text-xs font-medium"
                        >
                          {cancelingId === s.id ? "Canceling…" : "Cancel"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                {pagination.total} subscriptions · page {pagination.current_page} of {pagination.total_pages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchSubs(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  onClick={() => fetchSubs(page + 1)}
                  disabled={page >= pagination.total_pages}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
