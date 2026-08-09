"use client";

import { useState } from "react";
import { listRevisions, getRevision } from "@/lib/api/editor";

// Collapsible "History" section for the editor sidebar. Lazy: nothing is
// fetched until the writer expands it. Preview + restore of WP revisions.
// The restore round-trip itself belongs to EditorPage (onRestore) — it has to
// disarm the pending auto-save before the request goes out.
export default function HistoryPanel({ postId, onRestore }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState(null); // null = not fetched yet
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null); // { id, date, title, content }
  const [busy, setBusy] = useState(false);

  // Also called after a restore, which adds a snapshot — setItems(null) alone
  // would leave the open panel stuck on "Loading…" with nothing fetching.
  async function loadList() {
    setError(null);
    setItems(null);
    try {
      const data = await listRevisions(postId);
      setItems(data.revisions || []);
    } catch (err) {
      console.error("Failed to load history:", err);
      setError("Couldn't load history");
    }
  }

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && items === null) loadList();
  }

  async function openPreview(revId) {
    setError(null);
    try {
      setPreview(await getRevision(postId, revId));
    } catch (err) {
      console.error("Failed to load revision:", err);
      setError("Couldn't load that snapshot");
    }
  }

  async function handleRestore() {
    if (!preview) return;
    // Honest copy: the *saved* state is what History holds. Keystrokes from the
    // un-saved window are gone either way — don't promise them back.
    if (!window.confirm("Replace the current draft with this snapshot? The last saved state stays in History.")) return;
    setBusy(true);
    try {
      await onRestore?.(preview.id);
      setPreview(null);
      loadList(); // the list just changed — refresh it in place
    } catch (err) {
      console.error("Restore failed:", err);
      setError("Restore failed — the draft was not changed");
    } finally {
      setBusy(false);
    }
  }

  function fmt(date) {
    const d = new Date(date.includes("T") ? date : date.replace(" ", "T"));
    return Number.isNaN(d.getTime())
      ? date
      : d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  return (
    <div className="border-t border-slate-200 dark:border-slate-700 pt-3">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between text-xs font-semibold text-secondary-500 uppercase tracking-wider"
      >
        <span>History</span>
        <svg
          className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 space-y-1">
          {error && <p className="text-xs text-red-600">{error}</p>}
          {items === null && !error && <p className="text-xs text-gray-400">Loading…</p>}
          {items?.length === 0 && <p className="text-xs text-gray-400">No snapshots yet.</p>}
          {items?.map((rev) => (
            <button
              key={rev.id}
              type="button"
              onClick={() => openPreview(rev.id)}
              className="w-full text-left text-xs rounded px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800 flex justify-between gap-2"
            >
              <span className="text-gray-700 dark:text-gray-300">{fmt(rev.date)}</span>
              <span className="text-gray-400 shrink-0">{rev.word_count} words</span>
            </button>
          ))}
        </div>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !busy && setPreview(null)} />
          <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="font-bold text-sm text-secondary-600">Snapshot — {fmt(preview.date)}</h3>
                <p className="text-xs text-gray-400">{preview.title}</p>
              </div>
              <button onClick={() => setPreview(null)} disabled={busy} className="text-gray-400 text-lg">{"✕"}</button>
            </div>
            <div
              className="prose prose-sm max-w-none p-4 overflow-y-auto"
              // Revision bodies were sanitized with wp_kses_post on save.
              dangerouslySetInnerHTML={{ __html: preview.content }}
            />
            <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreview(null)}
                disabled={busy}
                className="text-xs px-3 py-1.5 border border-gray-300 rounded"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleRestore}
                disabled={busy}
                className="text-xs px-3 py-1.5 bg-primary-500 text-white rounded font-bold disabled:opacity-50"
              >
                {busy ? "Restoring…" : "Restore this version"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
