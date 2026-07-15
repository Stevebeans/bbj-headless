"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboard, purgeCache } from "@/lib/api/admin";
import { getMailingStats } from "@/lib/api/mailing";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [mailing, setMailing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purgeState, setPurgeState] = useState({ status: "idle", message: "" });

  const handlePurgeCache = async () => {
    if (!confirm("Force-rebuild every page on next visit? This invalidates all cached pages and data.")) {
      return;
    }
    setPurgeState({ status: "loading", message: "" });
    try {
      const result = await purgeCache();
      setPurgeState({ status: "success", message: result.message || "Cache purged." });
      setTimeout(() => setPurgeState({ status: "idle", message: "" }), 5000);
    } catch (err) {
      setPurgeState({ status: "error", message: err.message || "Purge failed." });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both in parallel; tolerate mailing failure (e.g. user lacks email perm)
        const [dashboardData, mailingData] = await Promise.all([
          getDashboard(),
          getMailingStats().catch(() => null),
        ]);
        setData(dashboardData);
        setMailing(mailingData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded-lg"></div>
          ))}
        </div>
        <div className="h-6 bg-slate-100 dark:bg-slate-800/50 rounded w-36 mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800/50 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">Error loading dashboard: {error}</p>
      </div>
    );
  }

  const stats = [
    {
      label: "Pending Reports",
      value: data?.pending_reports || 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconColor: "text-red-500 bg-red-100 dark:bg-red-900/30",
      link: "/admin/comments",
    },
    {
      label: "Today's Comments",
      value: data?.today_comments || 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
      iconColor: "text-blue-500 bg-blue-100 dark:bg-blue-900/30",
      link: "/admin/comments",
    },
    {
      label: "Today's Votes",
      value: data?.today_votes || 0,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      ),
      iconColor: "text-green-500 bg-green-100 dark:bg-green-900/30",
    },
    // Open Bugs card removed 7/15 — public bug reporting is disabled and the
    // Bugs tab is hidden; /admin/bug-reports remains routable if ever needed.
  ];

  const quickActions = [
    {
      label: "Manage Players",
      description: "View and edit player profiles",
      href: "/directory?tab=players",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      label: "Manage Seasons",
      description: "View and edit seasons",
      href: "/directory?tab=seasons",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: "Site Analytics",
      description: "Traffic, sources, and ad blocker stats",
      href: "/admin/stats",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      label: "Ad Manager",
      description: "Placements, kill switch, house ads",
      href: "/admin/ads",
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
    },
    {
      label: "WordPress Admin",
      description: "Open WP dashboard",
      href: "https://bigbrotherjunkies.com/wp-admin",
      external: true,
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
              <div className={`p-2 rounded-full ${stat.iconColor}`}>
                {stat.icon}
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</p>
            {stat.link && stat.value > 0 && (
              <Link
                href={stat.link}
                className="text-xs text-primary-500 hover:text-primary-600 mt-1 inline-block"
              >
                View &rarr;
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Email Campaigns widget */}
      {mailing && (
        <>
          <div className="flex items-baseline justify-between mt-8 mb-4">
            <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white">
              Email Campaigns
            </h2>
            <Link
              href="/admin/mailing"
              className="text-sm text-primary-500 hover:text-primary-600 font-medium"
            >
              View dashboard &rarr;
            </Link>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(() => {
                const subs = mailing?.stats?.subscribers?.subscribed || 0;
                const sends = mailing?.stats?.sends_90d || {};
                const lastSend = (mailing?.recent_sends || [])[0];
                const widgets = [
                  {
                    label: "Subscribers",
                    value: new Intl.NumberFormat().format(subs),
                    sub: "Active list size",
                  },
                  {
                    label: "Open Rate (90d)",
                    value: `${sends.open_rate ?? 0}%`,
                    sub: `${new Intl.NumberFormat().format(sends.total || 0)} sent`,
                  },
                  {
                    label: "Click Rate (90d)",
                    value: `${sends.click_rate ?? 0}%`,
                    sub: `${sends.bounce_rate ?? 0}% bounced`,
                  },
                  {
                    label: "Last Campaign",
                    value: lastSend?.subject
                      ? `${lastSend.subject.slice(0, 22)}${lastSend.subject.length > 22 ? "…" : ""}`
                      : "—",
                    sub: lastSend
                      ? `${new Intl.NumberFormat().format(lastSend.total || 0)} recipients`
                      : "No sends yet",
                    valueClass: "text-base",
                  },
                ];
                return widgets.map((w) => (
                  <div key={w.label}>
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                      {w.label}
                    </p>
                    <p
                      className={`font-bold text-slate-800 dark:text-white ${w.valueClass || "text-2xl"}`}
                      title={w.label === "Last Campaign" ? (lastSend?.subject || "") : undefined}
                    >
                      {w.value}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{w.sub}</p>
                  </div>
                ));
              })()}
            </div>
          </div>
        </>
      )}

      {/* Quick Actions */}
      <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white mt-8 mb-4">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quickActions.map((action) => {
          if (action.disabled) {
            return (
              <div
                key={action.label}
                className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg opacity-50 cursor-not-allowed"
              >
                <div className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg text-slate-400">
                  {action.icon}
                </div>
                <div>
                  <p className="font-medium text-slate-500 dark:text-slate-400">
                    {action.label}
                    <span className="ml-2 px-2 py-0.5 text-xs bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-full">
                      Coming Soon
                    </span>
                  </p>
                  <p className="text-sm text-slate-400 dark:text-slate-500">{action.description}</p>
                </div>
              </div>
            );
          }

          const LinkComponent = action.external ? "a" : Link;
          const extraProps = action.external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {};

          return (
            <LinkComponent
              key={action.label}
              href={action.href}
              {...extraProps}
              className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
            >
              <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                {action.icon}
              </div>
              <div>
                <p className="font-medium text-slate-800 dark:text-white group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                  {action.label}
                  {action.external && (
                    <svg className="w-3.5 h-3.5 inline-block ml-1 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  )}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{action.description}</p>
              </div>
            </LinkComponent>
          );
        })}
      </div>

      {/* Site Maintenance */}
      <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white mt-8 mb-4">
        Site Maintenance
      </h2>
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-medium text-slate-800 dark:text-white">Purge All Caches</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Forces every page to rebuild on next visit. Use after bulk content changes.
            </p>
          </div>
          <button
            type="button"
            onClick={handlePurgeCache}
            disabled={purgeState.status === "loading"}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {purgeState.status === "loading" ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                Purging…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Purge All Caches
              </>
            )}
          </button>
        </div>
        {purgeState.status === "success" && (
          <p className="mt-3 text-sm text-green-600 dark:text-green-400">✓ {purgeState.message}</p>
        )}
        {purgeState.status === "error" && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">✗ {purgeState.message}</p>
        )}
      </div>
    </div>
  );
}
