"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch, getFacebookPages, getRecentFeedUpdates, queueFeedShares } from "@/lib/api/admin";

function fmtWhen(gmt) {
  if (!gmt) return "";
  const d = new Date(gmt.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return gmt;
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function FeedShareQueue() {
  const [updates, setUpdates] = useState([]);
  const [checked, setChecked] = useState({});
  const [pages, setPages] = useState([]);
  const [pageId, setPageId] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const [spacing, setSpacing] = useState(20);
  const [spacingSaved, setSpacingSaved] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await getRecentFeedUpdates();
      setUpdates(res.updates || []);
    } catch (e) {
      setStatus({ ok: false, msg: e.message || "Failed to load feed updates" });
    }
  }, []);

  useEffect(() => {
    load();
    getFacebookPages()
      .then((res) => {
        const withToken = (res.pages || []).filter((p) => p.has_token);
        setPages(withToken);
        if (withToken.length) setPageId(withToken[0].id);
      })
      .catch(() => {});
    adminFetch("/social/config")
      .then((res) => {
        const mins = Number(res.settings?.queue_spacing_minutes);
        if (mins > 0) setSpacing(mins);
      })
      .catch(() => {});
  }, [load]);

  const saveSpacing = async () => {
    setSpacingSaved(null);
    try {
      const res = await adminFetch("/social/config", {
        method: "POST",
        body: JSON.stringify({ queue_spacing_minutes: spacing }),
      });
      const mins = Number(res.settings?.queue_spacing_minutes);
      if (mins > 0) setSpacing(mins);
      setSpacingSaved({ ok: true, msg: "Saved ✓" });
    } catch (e) {
      setSpacingSaved({ ok: false, msg: e.message || "Save failed" });
    }
  };

  const selected = Object.keys(checked).filter((id) => checked[id]);

  const queue = async () => {
    if (!pageId || selected.length === 0) return;
    setBusy(true);
    setStatus(null);
    try {
      const page = pages.find((p) => p.id === pageId);
      const res = await queueFeedShares(pageId, selected.map(Number), page?.name || "");
      if (res.success) {
        setStatus({ ok: true, msg: `Queued ${res.queued.length} share(s), ${spacing} min apart ✓` });
        setChecked({});
        load();
      } else {
        setStatus({ ok: false, msg: res.message || "Queue failed" });
      }
    } catch (e) {
      setStatus({ ok: false, msg: e.message || "Queue failed" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          🔗 Share Feed Updates to FB
        </h2>
        <div className="flex items-center gap-2">
          <select
            value={pageId}
            onChange={(e) => setPageId(e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-1.5 text-sm"
          >
            {pages.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={queue}
            disabled={busy || !pageId || selected.length === 0}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "Queueing…" : `Queue ${selected.length || ""} share${selected.length === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>

      {status && (
        <p className={`mb-3 text-sm ${status.ok ? "text-emerald-600" : "text-red-600"}`}>{status.msg}</p>
      )}

      <ul className="divide-y divide-slate-100 dark:divide-slate-700">
        {updates.map((u) => (
          <li key={u.id} className="py-2 flex items-center gap-3">
            <input
              type="checkbox"
              disabled={u.shared}
              checked={!!checked[u.id]}
              onChange={(e) => setChecked((c) => ({ ...c, [u.id]: e.target.checked }))}
              className="h-4 w-4"
            />
            <div className="min-w-0 flex-1">
              <span className="text-sm text-slate-800 dark:text-slate-100">{u.title}</span>
              <span className="ml-2 text-xs text-slate-400">{fmtWhen(u.published_gmt)}</span>
            </div>
            {u.shared && (
              <span className="text-[10px] font-bold uppercase text-emerald-600">shared</span>
            )}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>Queue spacing:</span>
        <input
          type="number"
          min={5}
          max={180}
          value={spacing}
          onChange={(e) => setSpacing(Number(e.target.value))}
          className="w-16 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-1 text-sm text-slate-800 dark:text-slate-100"
        />
        <span>min between posts (applies to quickie cards too)</span>
        <button
          type="button"
          onClick={saveSpacing}
          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium"
        >
          Save
        </button>
        {spacingSaved && (
          <span className={spacingSaved.ok ? "text-emerald-600" : "text-red-600"}>{spacingSaved.msg}</span>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-400">
        Shares post as link posts from the next free queue slot.
        Review, edit, reschedule or delete them in the In Queue section above.
      </p>
    </section>
  );
}
