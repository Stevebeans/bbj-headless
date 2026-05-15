"use client";

import { useState } from "react";
import { bulkSubscriberAction } from "@/lib/api/mailing";
import { FLAG_META } from "./FlagPill";

const CATEGORIES = [
  { key: "hard_bounced", explanation: "At least one hard bounce on record — safe to delete to clean up the DB.", defaultAction: "delete" },
  { key: "soft_bouncing", explanation: "3+ temporary delivery failures. Likely abandoned mailboxes.", defaultAction: "unsubscribe" },
  { key: "never_opened", explanation: "5+ emails sent, never opened. Hurts open rate and reputation.", defaultAction: "unsubscribe" },
  { key: "dormant", explanation: "Opened in the past, but nothing in the last 90 days. Engagement lapsed.", defaultAction: "unsubscribe" },
];

export default function ProblemCallout({ summary, byCategory, onActionComplete, onFilterByFlag }) {
  const [busy, setBusy] = useState(null);

  if (!summary) return null;

  if (summary.total_flagged === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 flex items-center gap-3">
        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <div>
          <p className="font-medium text-green-800 dark:text-green-300">List is clean</p>
          <p className="text-sm text-green-700 dark:text-green-400">No subscribers flagged for cleanup right now.</p>
        </div>
      </div>
    );
  }

  const handleBulk = async (categoryKey, action) => {
    const ids = byCategory?.[categoryKey] || [];
    if (ids.length === 0) return;
    const verb = action === "unsubscribe" ? "Unsubscribe" : "Delete";
    const consequence = action === "delete" ? " This removes them from ALL lists and cannot be undone via the UI." : " They will stop receiving emails.";
    if (!confirm(`${verb} ${ids.length} ${FLAG_META[categoryKey]?.label || categoryKey} subscribers?${consequence}`)) return;
    setBusy(`${categoryKey}-${action}`);
    try {
      const res = await bulkSubscriberAction(action, ids);
      onActionComplete?.({ category: categoryKey, action, processed: res.processed });
    } catch (err) {
      alert(`Failed: ${err.message || "unknown"}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-300 dark:border-amber-800 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-base font-osw font-bold text-amber-800 dark:text-amber-200">
          List Hygiene — {summary.total_flagged} subscriber{summary.total_flagged === 1 ? "" : "s"} flagged
        </h2>
      </div>
      <div className="space-y-2">
        {CATEGORIES.map((cat) => {
          const count = summary[cat.key] || 0;
          if (count === 0) return null;
          const meta = FLAG_META[cat.key];
          const busyKey = `${cat.key}-${cat.defaultAction}`;
          const actionLabel = cat.defaultAction === "delete" ? "Delete all" : "Unsubscribe all";
          return (
            <div
              key={cat.key}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white dark:bg-slate-900/50 rounded-md p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 dark:text-white text-sm">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${meta.dot}`} />
                  {meta.label} <span className="text-slate-500 dark:text-slate-400 font-normal">({count})</span>
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{cat.explanation}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onFilterByFlag?.(cat.key)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Review
                </button>
                <button
                  type="button"
                  onClick={() => handleBulk(cat.key, cat.defaultAction)}
                  disabled={busy === busyKey}
                  className={`px-2.5 py-1 text-xs font-medium text-white rounded transition-colors disabled:opacity-60 ${
                    cat.defaultAction === "delete"
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-amber-500 hover:bg-amber-600"
                  }`}
                >
                  {busy === busyKey ? `${actionLabel}…` : `${actionLabel} (${count})`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
