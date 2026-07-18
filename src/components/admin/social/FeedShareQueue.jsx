"use client";

import { useCallback, useEffect, useState } from "react";
import { getFacebookPages, getRecentFeedUpdates, queueFeedShares } from "@/lib/api/admin";

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
  }, [load]);

  const selected = Object.keys(checked).filter((id) => checked[id]);

  const queue = async () => {
    if (!pageId || selected.length === 0) return;
    setBusy(true);
    setStatus(null);
    try {
      const page = pages.find((p) => p.id === pageId);
      const res = await queueFeedShares(pageId, selected.map(Number), page?.name || "");
      if (res.success) {
        setStatus({ ok: true, msg: `Queued ${res.queued.length} share(s), 20 min apart ✓` });
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
      <p className="mt-3 text-xs text-slate-400">
        Shares post as link posts, spaced 20 minutes apart from the next free queue slot.
        Reschedule or delete from the Content Engine → Queue tab.
      </p>
    </section>
  );
}
