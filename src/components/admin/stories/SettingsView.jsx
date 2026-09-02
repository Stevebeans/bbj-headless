"use client";

import { useState } from "react";
import { saveStoriesSettings, resolveIgUserId, runIngest } from "@/lib/api/stories";

const SHOW_FIELDS = [
  ["enabled", "Enabled", "checkbox"],
  ["publish_mode", "Publish mode", "select", ["inbox_only", "engine"]],
  ["fb_max_per_day", "FB max per day", "number"],
];

export default function SettingsView({ settings, onSaved }) {
  const [draft, setDraft] = useState({ paused: settings.paused, ig_enabled: settings.ig_enabled, shows: settings.shows || {} });
  const [newShow, setNewShow] = useState("");
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const setShow = (slug, key, value) =>
    setDraft((d) => ({ ...d, shows: { ...d.shows, [slug]: { ...d.shows[slug], [key]: value } } }));

  const addShow = () => {
    const label = newShow.trim();
    if (!label) return;
    const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setDraft((d) => ({ ...d, shows: { ...d.shows, [slug]: { label, enabled: false, publish_mode: "inbox_only", fb_max_per_day: 6 } } }));
    setNewShow("");
  };

  const save = async () => {
    setBusy(true); setStatus(null);
    try {
      const res = await saveStoriesSettings(draft);
      onSaved(res.settings);
      setStatus({ ok: true, msg: "Saved." });
    } catch (e) { setStatus({ ok: false, msg: e.message }); } finally { setBusy(false); }
  };

  const resolve = async () => {
    setBusy(true); setStatus(null);
    try {
      const res = await resolveIgUserId();
      setStatus({ ok: true, msg: `Instagram business user id: ${res.ig_user_id}` });
      onSaved({ ...settings, ig_user_id: res.ig_user_id });
    } catch (e) { setStatus({ ok: false, msg: e.message }); } finally { setBusy(false); }
  };

  const ingestNow = async () => {
    setBusy(true); setStatus(null);
    try {
      const res = await runIngest();
      setStatus({ ok: true, msg: res.skipped ? "Skipped (no enabled shows or already running)." : `Ingested ${res.ingested} items${res.errors?.length ? `; ${res.errors.length} source error(s)` : ""}.` });
    } catch (e) { setStatus({ ok: false, msg: e.message }); } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <section className="rounded border p-4 space-y-3">
        <h2 className="font-semibold">Global</h2>
        <label className="flex items-center gap-2"><input type="checkbox" checked={!!draft.paused} onChange={(e) => setDraft({ ...draft, paused: e.target.checked })} /> Pause all ingestion</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={!!draft.ig_enabled} onChange={(e) => setDraft({ ...draft, ig_enabled: e.target.checked })} /> Instagram enabled (flip only after Meta approves Business Discovery)</label>
        <div className="flex items-center gap-2 text-sm">
          <span>IG business user id: <code>{settings.ig_user_id || "not set"}</code></span>
          <button type="button" disabled={busy} onClick={resolve} className="rounded border px-2 py-1">Resolve from page</button>
        </div>
      </section>

      <section className="rounded border p-4 space-y-3">
        <h2 className="font-semibold">Shows</h2>
        {Object.entries(draft.shows).map(([slug, cfg]) => (
          <div key={slug} className="grid grid-cols-2 md:grid-cols-4 gap-2 items-center border-b py-2">
            <div className="font-medium">{cfg.label || slug} <span className="text-xs text-slate-400">{slug}</span></div>
            {SHOW_FIELDS.map(([key, label, type, opts]) => (
              <label key={key} className="text-sm flex items-center gap-1">
                {type === "checkbox" && <input type="checkbox" checked={!!cfg[key]} onChange={(e) => setShow(slug, key, e.target.checked)} />}
                {type === "select" && (
                  <select value={cfg[key] || opts[0]} onChange={(e) => setShow(slug, key, e.target.value)} className="border rounded px-1">
                    {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                )}
                {type === "number" && <input type="number" value={cfg[key] ?? 0} onChange={(e) => setShow(slug, key, Number(e.target.value))} className="border rounded px-1 w-20" />}
                {label}
              </label>
            ))}
          </div>
        ))}
        <div className="flex gap-2">
          <input value={newShow} onChange={(e) => setNewShow(e.target.value)} placeholder="Add show (e.g. Big Brother)" className="border rounded px-2 py-1" />
          <button type="button" onClick={addShow} className="rounded border px-2 py-1">Add</button>
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="button" disabled={busy} onClick={save} className="rounded bg-slate-900 px-4 py-2 text-white">Save</button>
        <button type="button" disabled={busy} onClick={ingestNow} className="rounded border px-4 py-2">Run ingest now</button>
        {status && <span className={status.ok ? "text-green-700" : "text-red-600"}>{status.msg}</span>}
      </div>
    </div>
  );
}
