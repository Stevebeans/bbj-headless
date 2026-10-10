"use client";

import { useEffect, useState } from "react";
import { getHomepageMode, setHomepageMode } from "@/lib/api/admin";

const MODES = [
  { id: "season", label: "BB season", hint: "Spoiler bar, house strip, BB stats. Use while Big Brother is airing." },
  { id: "offseason", label: "Off-season", hint: "What's Airing cards for every show, all-show feed, Our Shows sidebar." },
];

export default function HomepageModeCard() {
  const [mode, setMode] = useState(null);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    getHomepageMode()
      .then((res) => setMode(res.mode))
      .catch(() => setStatus({ ok: false, msg: "Couldn't load the homepage mode" }));
  }, []);

  const save = async (next) => {
    if (next === mode || saving) return;
    setSaving(true);
    setStatus(null);
    try {
      const res = await setHomepageMode(next);
      setMode(res.mode);
      setStatus({
        ok: true,
        msg: res.revalidated ? "Saved. Homepage refreshed." : "Saved. The homepage picks it up within a few minutes.",
      });
    } catch (e) {
      setStatus({ ok: false, msg: e.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
      <h3 className="font-osw font-bold text-slate-800 dark:text-white">Homepage mode</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            disabled={mode === null || saving}
            onClick={() => save(m.id)}
            className={`rounded-lg border p-3 text-left disabled:opacity-60 ${
              mode === m.id
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                : "border-slate-200 dark:border-slate-600 hover:border-slate-300"
            }`}
          >
            <div className="font-semibold text-sm text-slate-800 dark:text-slate-100">
              {m.label} {mode === m.id && "✓"}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{m.hint}</div>
          </button>
        ))}
      </div>
      {status && (
        <p className={`mt-2 text-sm ${status.ok ? "text-emerald-600" : "text-red-600"}`}>{status.msg}</p>
      )}
    </div>
  );
}
