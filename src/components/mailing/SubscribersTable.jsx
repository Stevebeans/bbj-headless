"use client";

import { useState } from "react";
import FlagPill from "./FlagPill";
import { bulkSubscriberAction } from "@/lib/api/mailing";

const STATUS_STYLES = {
  subscribed: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  unconfirmed: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  unsubscribed: "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
  complained: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

function fmtDate(s) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" });
}

export default function SubscribersTable({
  subscribers,
  loading,
  selectedIds,
  onToggleId,
  onTogglePage,
  onRowActionComplete,
}) {
  const [rowLoading, setRowLoading] = useState(null);

  const handleRowAction = async (subscriberId, action) => {
    const verb = action === "unsubscribe" ? "Unsubscribe" : "Delete";
    if (!confirm(`${verb} this subscriber?${action === "delete" ? " This removes them from ALL lists and cannot be undone." : ""}`)) return;
    setRowLoading(`${subscriberId}-${action}`);
    try {
      await bulkSubscriberAction(action, [subscriberId]);
      onRowActionComplete?.();
    } catch (err) {
      alert(`Failed: ${err.message || "unknown error"}`);
    } finally {
      setRowLoading(null);
    }
  };

  const pageIds = subscribers.map((s) => s.id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded" />
        ))}
      </div>
    );
  }

  if (subscribers.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-sm">
        No subscribers match these filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
            <th className="px-2 py-2 w-8">
              <input
                type="checkbox"
                checked={allOnPageSelected}
                onChange={() => onTogglePage(pageIds, !allOnPageSelected)}
                aria-label="Select all on this page"
              />
            </th>
            <th className="px-2 py-2 font-medium">Email</th>
            <th className="px-2 py-2 font-medium">Status</th>
            <th className="px-2 py-2 font-medium">Flags</th>
            <th className="px-2 py-2 font-medium text-right">Sends</th>
            <th className="px-2 py-2 font-medium text-right">Opens</th>
            <th className="px-2 py-2 font-medium">Last Open</th>
            <th className="px-2 py-2 font-medium text-right">Clicks</th>
            <th className="px-2 py-2 font-medium text-right">Bounces</th>
            <th className="px-2 py-2 font-medium">Subscribed</th>
            <th className="px-2 py-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {subscribers.map((s) => {
            const checked = selectedIds.includes(s.id);
            const statusClass = STATUS_STYLES[s.status] || STATUS_STYLES.unsubscribed;
            return (
              <tr key={s.id} className="text-slate-700 dark:text-slate-300">
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleId(s.id)}
                    aria-label={`Select ${s.email}`}
                  />
                </td>
                <td className="px-2 py-2 max-w-xs truncate" title={s.email}>{s.email}</td>
                <td className="px-2 py-2">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-2 py-2">
                  {s.problem_flags?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {s.problem_flags.map((f) => <FlagPill key={f} flag={f} />)}
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-2 py-2 text-right font-mono">{s.total_sends ?? 0}</td>
                <td className="px-2 py-2 text-right font-mono">{s.total_opens ?? 0}</td>
                <td className="px-2 py-2">{fmtDate(s.last_open_at)}</td>
                <td className="px-2 py-2 text-right font-mono">{s.total_clicks ?? 0}</td>
                <td className="px-2 py-2 text-right font-mono">{s.total_bounces ?? 0}</td>
                <td className="px-2 py-2">{fmtDate(s.subscribed_at || s.created_at)}</td>
                <td className="px-2 py-2 text-right whitespace-nowrap">
                  {s.status !== "unsubscribed" && (
                    <button
                      type="button"
                      onClick={() => handleRowAction(s.id, "unsubscribe")}
                      disabled={rowLoading === `${s.id}-unsubscribe`}
                      className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:underline disabled:opacity-50 mr-3"
                    >
                      {rowLoading === `${s.id}-unsubscribe` ? "…" : "Unsub"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRowAction(s.id, "delete")}
                    disabled={rowLoading === `${s.id}-delete`}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline disabled:opacity-50"
                  >
                    {rowLoading === `${s.id}-delete` ? "…" : "Delete"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
