"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboard, getDatabaseStatus } from "@/lib/api/admin";

// Feature card icons
const featureIcons = {
  comment_moderation: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  ),
  feed_updates: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 5c7.18 0 13 5.82 13 13M6 11a7 7 0 017 7m-6 0a1 1 0 11-2 0 1 1 0 012 0z"
      />
    </svg>
  ),
  player_management: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  ),
  season_management: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
  admin_settings: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

// Feature routes
const featureRoutes = {
  comment_moderation: "/admin/comments",
  feed_updates: "/admin/feed-updates",
  player_management: "/admin/players",
  season_management: "/admin/seasons",
  admin_settings: "/admin/settings",
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardData, databaseData] = await Promise.all([getDashboard(), getDatabaseStatus()]);
        setData(dashboardData);
        setDbStatus(databaseData);
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
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
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

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-osw font-bold text-slate-800 dark:text-white">Admin Dashboard</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Welcome to the Big Brother Junkies admin panel</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-700 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Pending Reports</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{data?.pending_reports || 0}</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          {data?.pending_reports > 0 && (
            <Link
              href="/admin/comments"
              className="text-sm text-primary-500 hover:text-primary-600 mt-2 inline-block"
            >
              View reports &rarr;
            </Link>
          )}
        </div>

        <div className="bg-white dark:bg-slate-700 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Today&apos;s Comments</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{data?.today_comments || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-700 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Today&apos;s Votes</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-white">{data?.today_votes || 0}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <h2 className="text-xl font-osw font-bold text-slate-800 dark:text-white mb-4">Quick Access</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {data?.features &&
          Object.entries(data.features).map(([key, feature]) => (
            <Link
              key={key}
              href={featureRoutes[key] || "/admin"}
              className="bg-white dark:bg-slate-700 rounded-lg shadow p-6 hover:shadow-lg transition-shadow group"
            >
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                  {featureIcons[key] || featureIcons.admin_settings}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                    {feature.label}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{feature.description}</p>
                </div>
              </div>
            </Link>
          ))}
      </div>

      {/* Database Status (Admin only) */}
      {data?.features?.admin_settings && dbStatus && (
        <div className="bg-white dark:bg-slate-700 rounded-lg shadow p-6">
          <h2 className="text-xl font-osw font-bold text-slate-800 dark:text-white mb-4">Database Status</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Comment System Version</p>
              <p className="font-mono text-slate-800 dark:text-white">{dbStatus.version}</p>
            </div>

            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Migration Needed</p>
              <p
                className={`font-medium ${dbStatus.needs_migration ? "text-yellow-600" : "text-green-600"}`}
              >
                {dbStatus.needs_migration ? "Yes" : "No"}
              </p>
            </div>

            {dbStatus.tables && (
              <div className="col-span-2">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Tables</p>
                <div className="space-y-2">
                  {Object.entries(dbStatus.tables).map(([name, info]) => (
                    <div key={name} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-slate-600 dark:text-slate-300">{name}</span>
                      <span className={info.exists ? "text-green-500" : "text-red-500"}>
                        {info.exists ? `${info.rows} rows` : "Not created"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {dbStatus.vote_migration && dbStatus.vote_migration.started && (
              <div className="col-span-2">
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Vote Migration</p>
                <div className="bg-slate-100 dark:bg-slate-600 rounded p-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>
                      {dbStatus.vote_migration.migrated_count} migrated
                      {dbStatus.vote_migration.completed && " (Complete)"}
                    </span>
                  </div>
                  {!dbStatus.vote_migration.completed && (
                    <Link
                      href="/admin/settings"
                      className="text-sm text-primary-500 hover:text-primary-600"
                    >
                      Continue migration &rarr;
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>

          {(dbStatus.needs_migration || !dbStatus.vote_migration?.started) && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600">
              <Link
                href="/admin/settings"
                className="text-sm text-primary-500 hover:text-primary-600"
              >
                Go to Settings to run migrations &rarr;
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
