"use client";

import { useEffect, useState, useCallback } from "react";
import { getMailingStats, sendTestMailingEmail } from "@/lib/api/mailing";

const ENGAGEMENT_TIERS = [
  { key: "active", label: "Active (30d)", bar: "bg-green-500" },
  { key: "inactive", label: "Inactive (30-90d)", bar: "bg-yellow-500" },
  { key: "dormant", label: "Dormant (90d+)", bar: "bg-red-500" },
  { key: "never_opened", label: "Never Opened", bar: "bg-slate-400" },
];

function formatPercent(value) {
  if (value === null || value === undefined) return "0%";
  return `${value}%`;
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(value || 0);
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function MailingDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testState, setTestState] = useState({ status: "idle", message: "" });

  const fetchStats = useCallback(async () => {
    try {
      setError(null);
      const result = await getMailingStats();
      setData(result);
    } catch (err) {
      setError(err.message || "Failed to load mailing stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSendTest = async () => {
    setTestState({ status: "loading", message: "" });
    try {
      const result = await sendTestMailingEmail();
      setTestState({
        status: "success",
        message: result.message || "Test email sent — check your inbox.",
      });
      setTimeout(() => setTestState({ status: "idle", message: "" }), 6000);
    } catch (err) {
      setTestState({ status: "error", message: err.message || "Test send failed." });
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-7 bg-slate-100 dark:bg-slate-800/50 rounded w-40 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded-lg" />
          ))}
        </div>
        <div className="h-48 bg-slate-100 dark:bg-slate-800/50 rounded-lg mb-6" />
        <div className="h-48 bg-slate-100 dark:bg-slate-800/50 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">Error loading mailing stats: {error}</p>
        <button
          type="button"
          onClick={fetchStats}
          className="mt-3 text-sm text-red-700 dark:text-red-300 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const stats = data?.stats || {};
  const subscribers = stats.subscribers || {};
  const sends = stats.sends_90d || {};
  const engagement = data?.engagement || {};
  const recentSends = data?.recent_sends || [];

  const totalSubscribed = subscribers.subscribed || 0;
  const totalEngaged = ENGAGEMENT_TIERS.reduce((sum, tier) => sum + (engagement[tier.key] || 0), 0);

  const metricCards = [
    {
      label: "Total Subscribed",
      value: formatNumber(totalSubscribed),
      iconColor: "text-primary-500 bg-primary-100 dark:bg-primary-900/30",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      label: "Open Rate (90d)",
      value: formatPercent(sends.open_rate),
      iconColor: "text-green-500 bg-green-100 dark:bg-green-900/30",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    {
      label: "Click Rate (90d)",
      value: formatPercent(sends.click_rate),
      iconColor: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
    },
    {
      label: "Bounce Rate (90d)",
      value: formatPercent(sends.bounce_rate),
      iconColor: "text-red-500 bg-red-100 dark:bg-red-900/30",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-osw font-bold text-slate-800 dark:text-white">Email Stats</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Newsletter performance, engagement scoring, and recent campaigns.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchStats}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            type="button"
            onClick={handleSendTest}
            disabled={testState.status === "loading"}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            {testState.status === "loading" ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Sending…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                Send Test
              </>
            )}
          </button>
        </div>
      </div>

      {testState.status !== "idle" && testState.message && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            testState.status === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
              : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800"
          }`}
        >
          {testState.status === "success" ? "✓ " : "✗ "}
          {testState.message}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {metricCards.map((card) => (
          <div key={card.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
              <div className={`p-2 rounded-full ${card.iconColor}`}>{card.icon}</div>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-5 lg:col-span-1">
          <h2 className="text-base font-osw font-bold text-slate-800 dark:text-white mb-4">Engagement</h2>
          <div className="space-y-3">
            {ENGAGEMENT_TIERS.map((tier) => {
              const count = engagement[tier.key] || 0;
              const pct = totalEngaged > 0 ? Math.round((count / totalEngaged) * 100) : 0;
              return (
                <div key={tier.key}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-slate-600 dark:text-slate-400">{tier.label}</span>
                    <span className="font-medium text-slate-800 dark:text-white">
                      {formatNumber(count)} <span className="text-slate-400">({pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                    <div className={`${tier.bar} h-1.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-5 lg:col-span-2">
          <h2 className="text-base font-osw font-bold text-slate-800 dark:text-white mb-4">Subscriber Breakdown</h2>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: "subscribed", label: "Subscribed", color: "text-green-600 dark:text-green-400" },
              { key: "unconfirmed", label: "Unconfirmed", color: "text-amber-600 dark:text-amber-400" },
              { key: "unsubscribed", label: "Unsubscribed", color: "text-slate-500 dark:text-slate-400" },
              { key: "complained", label: "Complained", color: "text-red-600 dark:text-red-400" },
            ].map((row) => (
              <div key={row.key}>
                <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">{row.label}</dt>
                <dd className={`text-xl font-semibold ${row.color}`}>{formatNumber(subscribers[row.key] || 0)}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
            Sends (90d): {formatNumber(sends.total)} total · {formatNumber(sends.delivered)} delivered
          </p>
        </div>
      </div>

      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-5">
        <h2 className="text-base font-osw font-bold text-slate-800 dark:text-white mb-4">Recent Sends</h2>
        {recentSends.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 py-4 text-center">No campaigns sent yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th className="px-2 py-2 font-medium">Subject</th>
                  <th className="px-2 py-2 font-medium text-right">Sent</th>
                  <th className="px-2 py-2 font-medium text-right">Opens</th>
                  <th className="px-2 py-2 font-medium text-right">Clicks</th>
                  <th className="px-2 py-2 font-medium text-right">Bounces</th>
                  <th className="px-2 py-2 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {recentSends.map((send, idx) => {
                  const total = Number(send.total) || 0;
                  const opens = Number(send.opens) || 0;
                  const clicks = Number(send.clicks) || 0;
                  const bounces = Number(send.bounces) || 0;
                  const openPct = total > 0 ? Math.round((opens / total) * 100) : 0;
                  const clickPct = total > 0 ? Math.round((clicks / total) * 100) : 0;
                  return (
                    <tr key={`${send.subject}-${send.sent_at}-${idx}`} className="text-slate-700 dark:text-slate-300">
                      <td className="px-2 py-3 max-w-md truncate" title={send.subject}>{send.subject}</td>
                      <td className="px-2 py-3 text-right font-mono">{formatNumber(total)}</td>
                      <td className="px-2 py-3 text-right font-mono">
                        {formatNumber(opens)} <span className="text-slate-400">({openPct}%)</span>
                      </td>
                      <td className="px-2 py-3 text-right font-mono">
                        {formatNumber(clicks)} <span className="text-slate-400">({clickPct}%)</span>
                      </td>
                      <td className="px-2 py-3 text-right font-mono">{formatNumber(bounces)}</td>
                      <td className="px-2 py-3 text-right text-slate-500 dark:text-slate-400 whitespace-nowrap">{formatDate(send.sent_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
