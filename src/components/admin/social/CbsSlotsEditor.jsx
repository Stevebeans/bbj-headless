"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/api/admin";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DURATIONS = [30, 60, 90, 120];

export default function CbsSlotsEditor() {
  const [slots, setSlots] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    adminFetch("/social/config")
      .then((res) => {
        setSlots(res.settings?.cbs_slots || []);
        setLoaded(true);
      })
      .catch(() => setStatus({ ok: false, msg: "Failed to load CBS slots" }));
  }, []);

  const update = (i, patch) =>
    setSlots((s) => s.map((slot, idx) => (idx === i ? { ...slot, ...patch } : slot)));

  const save = async () => {
    setSaving(true);
    setStatus(null);
    try {
      await adminFetch("/social/config", {
        method: "POST",
        body: JSON.stringify({ cbs_slots: slots }),
      });
      setStatus({ ok: true, msg: "Saved ✓" });
    } catch (e) {
      setStatus({ ok: false, msg: e.message || "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">📺 CBS Air Schedule</h2>
      <p className="text-xs text-slate-400 mb-4">
        During each airing (ET) and the PT re-air 3 hours later (+30 min tail), all AI
        summarizers ignore episode-reaction posts and the Top Posts board downweights them.
      </p>

      {loaded &&
        slots.map((slot, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 mb-2">
            <select
              value={slot.day}
              onChange={(e) => update(i, { day: Number(e.target.value) })}
              className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-1.5 text-sm"
            >
              {DAYS.map((d, idx) => (
                <option key={d} value={idx}>{d}</option>
              ))}
            </select>
            <input
              type="time"
              value={slot.time_et}
              onChange={(e) => update(i, { time_et: e.target.value })}
              className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-1.5 text-sm"
            />
            <span className="text-xs text-slate-400">ET</span>
            <select
              value={slot.duration_min}
              onChange={(e) => update(i, { duration_min: Number(e.target.value) })}
              className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 p-1.5 text-sm"
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>{d} min</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setSlots((s) => s.filter((_, idx) => idx !== i))}
              className="text-red-400 hover:text-red-600 text-sm"
            >
              ✕
            </button>
          </div>
        ))}

      <div className="flex items-center gap-3 mt-3">
        <button
          type="button"
          onClick={() => setSlots((s) => [...s, { day: 0, time_et: "20:00", duration_min: 60 }])}
          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm"
        >
          + Add slot
        </button>
        <button
          type="button"
          onClick={save}
          disabled={saving || !loaded}
          className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save schedule"}
        </button>
        {status && (
          <span className={`text-sm ${status.ok ? "text-emerald-600" : "text-red-600"}`}>{status.msg}</span>
        )}
      </div>
    </section>
  );
}
