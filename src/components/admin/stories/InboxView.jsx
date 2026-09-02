"use client";

import { useCallback, useEffect, useState } from "react";
import { getInbox, dismissInboxItem, restoreInboxItem } from "@/lib/api/stories";
import InboxRepostModal from "./InboxRepostModal";

const SOURCES = ["", "instagram", "reddit", "rss"];
const fmt = (utc) => new Date(utc.replace(" ", "T") + "Z").toLocaleString();

export default function InboxView({ settings }) {
  const shows = Object.entries(settings.shows || {});
  const [filters, setFilters] = useState({ show: "", source: "", status: "new", sort: "score", days: 7, page: 1 });
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await getInbox({ ...filters, per_page: 40 })); } finally { setLoading(false); }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  const set = (k, v) => setFilters((f) => ({ ...f, [k]: v, page: 1 }));

  const dismiss = async (id) => { await dismissInboxItem(id); load(); };
  const restore = async (id) => { await restoreInboxItem(id); load(); };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-sm">
        <select value={filters.show} onChange={(e) => set("show", e.target.value)} className="border rounded px-1"><option value="">All shows</option>{shows.map(([slug, cfg]) => <option key={slug} value={slug}>{cfg.label || slug}</option>)}</select>
        <select value={filters.source} onChange={(e) => set("source", e.target.value)} className="border rounded px-1">{SOURCES.map((s) => <option key={s} value={s}>{s || "All sources"}</option>)}</select>
        <select value={filters.status} onChange={(e) => set("status", e.target.value)} className="border rounded px-1"><option value="new">New</option><option value="used">Used</option><option value="dismissed">Dismissed</option></select>
        <select value={filters.sort} onChange={(e) => set("sort", e.target.value)} className="border rounded px-1"><option value="score">Top engagement</option><option value="time">Newest</option></select>
        <select value={filters.days} onChange={(e) => set("days", Number(e.target.value))} className="border rounded px-1">{[1, 3, 7, 14].map((d) => <option key={d} value={d}>{d}d</option>)}</select>
        <span className="text-slate-500 self-center">{data.total} item(s)</span>
      </div>

      {loading && <p className="text-slate-500">Loading…</p>}
      {!loading && !data.items.length && <p className="text-slate-500">Nothing here. Run ingest from Settings or wait for the 15-minute poll.</p>}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.items.map((it) => (
          <article key={it.id} className="rounded border bg-white p-3 flex gap-3">
            {it.thumbnail_url ? <img src={it.thumbnail_url} alt="" className="h-24 w-24 flex-none rounded object-cover" referrerPolicy="no-referrer" /> : <div className="h-24 w-24 flex-none rounded bg-slate-100 text-xs flex items-center justify-center text-slate-400">{it.source}</div>}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="text-xs text-slate-500 flex gap-2"><span className="uppercase">{it.source}</span><span>{it.author}</span><span>{fmt(it.published_at)}</span>{it.trust === "trusted" && <span className="text-green-700">trusted</span>}</div>
              <div className="font-medium line-clamp-2">{it.title}</div>
              <div className="text-sm text-slate-600 line-clamp-3">{it.excerpt}</div>
              <div className="flex items-center gap-2 text-xs pt-1">
                <span className="text-slate-500">score {it.score}</span>
                <a href={it.url} target="_blank" rel="noreferrer" className="underline">open</a>
                {it.inbox_status === "new" && <>
                  <button type="button" onClick={() => setActive(it)} className="rounded bg-slate-900 px-2 py-1 text-white">Make quickie</button>
                  <button type="button" onClick={() => dismiss(it.id)} className="rounded border px-2 py-1">Dismiss</button>
                </>}
                {it.inbox_status === "used" && <span className="text-green-700">queued #{it.used_queue_id}</span>}
                {it.inbox_status === "dismissed" && <button type="button" onClick={() => restore(it.id)} className="rounded border px-2 py-1">Restore</button>}
              </div>
            </div>
          </article>
        ))}
      </div>

      {data.total > 40 && (
        <div className="flex gap-2 text-sm">
          <button type="button" disabled={filters.page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))} className="rounded border px-2 py-1">← Prev</button>
          <span className="self-center">Page {filters.page}</span>
          <button type="button" disabled={filters.page * 40 >= data.total} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))} className="rounded border px-2 py-1">Next →</button>
        </div>
      )}

      {active && <InboxRepostModal item={active} onClose={() => setActive(null)} onQueued={() => { setActive(null); load(); }} />}
    </div>
  );
}
