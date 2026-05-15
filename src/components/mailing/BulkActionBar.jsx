"use client";

import { useState } from "react";
import { bulkSubscriberAction } from "@/lib/api/mailing";

export default function BulkActionBar({ selectedIds, onClearSelection, onActionComplete }) {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  if (selectedIds.length === 0) return null;

  const run = async (action) => {
    const verb = action === "unsubscribe" ? "Unsubscribe" : "Delete";
    const msg =
      action === "delete"
        ? `Delete ${selectedIds.length} subscriber${selectedIds.length === 1 ? "" : "s"}? This removes them from ALL lists and cannot be undone via the UI.`
        : `Unsubscribe ${selectedIds.length} subscriber${selectedIds.length === 1 ? "" : "s"}? They will stop receiving emails.`;
    if (!confirm(msg)) return;

    setLoading(action);
    setError(null);
    try {
      const res = await bulkSubscriberAction(action, selectedIds);
      onActionComplete?.({ action, processed: res.processed, errors: res.errors });
      onClearSelection?.();
    } catch (err) {
      setError(err.message || `${verb} failed`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="sticky bottom-2 z-30 mt-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-lg rounded-lg px-4 py-3 flex items-center gap-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {selectedIds.length} subscriber{selectedIds.length === 1 ? "" : "s"} selected
        </span>
        <div className="flex-1" />
        {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => run("unsubscribe")}
          className="px-3 py-1.5 text-sm font-medium bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-md transition-colors"
        >
          {loading === "unsubscribe" ? "Unsubscribing…" : "Unsubscribe Selected"}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => run("delete")}
          className="px-3 py-1.5 text-sm font-medium bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-md transition-colors"
        >
          {loading === "delete" ? "Deleting…" : "Delete Selected"}
        </button>
        <button
          type="button"
          onClick={onClearSelection}
          disabled={loading !== null}
          className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
