"use client";

import React, { useState } from "react";
import { saveStoriesSettings, testStorySource } from "@/lib/api/stories";

const TYPES = ["reddit", "rss", "instagram"];
const TIERS = ["trusted", "standard", "low"];
const KEY_HINT = { reddit: "subreddit (no r/)", rss: "feed URL (news, podcast, YouTube channel)", instagram: "IG username (Business/Creator only)" };

export default function SourcesView({ settings, onSaved }) {
  const shows = Object.entries(settings.shows || {});
  const [rows, setRows] = useState(settings.sources || []);
  const [status, setStatus] = useState(null);
  const [test, setTest] = useState({}); // id -> {items,error,busy}
  const [busy, setBusy] = useState(false);

  const update = (i, key, value) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: value } : row)));
  const remove = (i) => setRows((r) => r.filter((_, idx) => idx !== i));
  const add = () => setRows((r) => [...r, { show: shows[0]?.[0] || "", type: "rss", key: "", trust: "standard", flair: "", enabled: true }]);

  const save = async () => {
    setBusy(true); setStatus(null);
    try {
      const res = await saveStoriesSettings({ sources: rows });
      setRows(res.settings.sources);
      onSaved(res.settings);
      setStatus({ ok: true, msg: `Saved ${res.settings.sources.length} source(s). Invalid rows were dropped.` });
    } catch (e) { setStatus({ ok: false, msg: e.message }); } finally { setBusy(false); }
  };

  const runTest = async (i) => {
    const row = rows[i];
    const k = row.id || `row-${i}`;
    setTest((t) => ({ ...t, [k]: { busy: true } }));
    try {
      const res = await testStorySource(row);
      setTest((t) => ({ ...t, [k]: { items: res.items, error: res.error } }));
    } catch (e) {
      setTest((t) => ({ ...t, [k]: { items: [], error: e.message } }));
    }
  };

  if (!shows.length) return <p className="text-slate-500">Add a show under Settings first.</p>;

  return (
    <div className="space-y-4">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-slate-500"><th>Show</th><th>Type</th><th>Key</th><th>Trust</th><th>Flair (reddit)</th><th>On</th><th></th></tr></thead>
        <tbody>
          {rows.map((row, i) => {
            const k = row.id || `row-${i}`;
            const t = test[k];
            return (
              <React.Fragment key={k}>
                <tr className="border-t align-top">
                  <td><select value={row.show} onChange={(e) => update(i, "show", e.target.value)} className="border rounded px-1">{shows.map(([slug, cfg]) => <option key={slug} value={slug}>{cfg.label || slug}</option>)}</select></td>
                  <td><select value={row.type} onChange={(e) => update(i, "type", e.target.value)} className="border rounded px-1">{TYPES.map((x) => <option key={x}>{x}</option>)}</select></td>
                  <td><input value={row.key} onChange={(e) => update(i, "key", e.target.value)} placeholder={KEY_HINT[row.type]} className="border rounded px-2 py-1 w-72" /></td>
                  <td><select value={row.trust} onChange={(e) => update(i, "trust", e.target.value)} className="border rounded px-1">{TIERS.map((x) => <option key={x}>{x}</option>)}</select></td>
                  <td>{row.type === "reddit" && <input value={row.flair || ""} onChange={(e) => update(i, "flair", e.target.value)} placeholder="Spoilers, Former Houseguests" className="border rounded px-2 py-1 w-48" />}</td>
                  <td><input type="checkbox" checked={row.enabled !== false} onChange={(e) => update(i, "enabled", e.target.checked)} /></td>
                  <td className="whitespace-nowrap">
                    <button type="button" onClick={() => runTest(i)} className="rounded border px-2 py-1 mr-1" disabled={t?.busy}>Test</button>
                    <button type="button" onClick={() => remove(i)} className="text-red-600">✕</button>
                  </td>
                </tr>
                {t && !t.busy && (
                  <tr><td colSpan={7} className="bg-slate-50 p-2">
                    {t.error && <div className="text-red-600">{t.error}</div>}
                    {(t.items || []).map((it) => <div key={it.url} className="truncate"><a href={it.url} target="_blank" rel="noreferrer" className="underline">{it.title || it.url}</a> <span className="text-slate-400">{it.author} · {it.published_at} UTC</span></div>)}
                    {!t.error && !(t.items || []).length && <div className="text-slate-500">No items returned.</div>}
                  </td></tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
      <div className="flex items-center gap-3">
        <button type="button" onClick={add} className="rounded border px-3 py-1">+ Add source</button>
        <button type="button" onClick={save} disabled={busy} className="rounded bg-slate-900 px-4 py-2 text-white">Save sources</button>
        {status && <span className={status.ok ? "text-green-700" : "text-red-600"}>{status.msg}</span>}
      </div>
    </div>
  );
}
