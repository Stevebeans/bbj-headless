"use client";

import { useMemo, useState } from "react";
import { deriveActiveIds, weekToForm, collectJuryVotes, formToPayload } from "@/lib/weekly/editorState";
import { saveWeek, deleteWeek } from "@/lib/api/adminWeekly";

const inputCls = "w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white";
const labelCls = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

function PlayerSelect({ value, onChange, players, allowEmpty = true }) {
  return (
    <select value={value || 0} onChange={(e) => onChange(Number(e.target.value))} className={inputCls}>
      {allowEmpty && <option value={0}>—</option>}
      {players.map((p) => (
        <option key={p.id} value={p.id}>{p.name}</option>
      ))}
    </select>
  );
}

export default function WeekEditor({ week, weeks, roster, compTypes, onSaved, onDeleted }) {
  const [form, setForm] = useState(() => weekToForm(week));
  const [showFinale, setShowFinale] = useState(() => Object.keys(collectJuryVotes(weeks)).length > 0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);
  const [savedFlash, setSavedFlash] = useState(false);

  const rosterById = useMemo(() => Object.fromEntries(roster.map((r) => [r.id, r])), [roster]);
  const activeIds = useMemo(
    () => deriveActiveIds(roster.map((r) => r.id), weeks, week.week_num),
    [roster, weeks, week.week_num]
  );
  const activePlayers = useMemo(
    () => roster.filter((r) => activeIds.includes(r.id)),
    [roster, activeIds]
  );

  // Final noms = nominees minus the veto-saved one; they're the vote targets.
  const finalNoms = form.noms.filter((id) => id !== form.vetoUsedOn);
  // Voters: active players who aren't on the block (HoH included — ties happen).
  const voters = activePlayers.filter((p) => !finalNoms.includes(p.id));
  // Jurors: anyone evicted in ANY week of the season.
  const jurors = useMemo(() => {
    const ids = new Set();
    for (const w of weeks) for (const row of w.players || []) if (Number(row.evicted) === 1) ids.add(Number(row.player_id));
    return roster.filter((r) => ids.has(r.id));
  }, [weeks, roster]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const toggleIn = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const handleSave = async () => {
    setSaving(true);
    setErrors([]);
    try {
      const payload = formToPayload(
        showFinale ? form : { ...form, juryVotes: {} },
        activeIds
      );
      await saveWeek(week.id, payload);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
      onSaved();
    } catch (err) {
      setErrors([err.message || "Save failed"]);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete Week ${week.week_num}? All its results are removed and season totals are recomputed.`)) return;
    try {
      await deleteWeek(week.id);
      onDeleted();
    } catch (err) {
      setErrors([err.message || "Delete failed"]);
    }
  };

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-osw font-bold text-slate-800 dark:text-white">Week {week.week_num}</h3>
        <button onClick={handleDelete} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete week</button>
      </div>

      {errors.length > 0 && (
        <div className="px-3 py-2 text-sm rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
          {errors.map((e, i) => <div key={i}>{e}</div>)}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Start date</label>
          <input type="date" value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>End date</label>
          <input type="date" value={form.endDate} onChange={(e) => set({ endDate: e.target.value })} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>HoH winner</label>
          <PlayerSelect value={form.hoh} onChange={(v) => set({ hoh: v })} players={activePlayers} />
        </div>
        <div>
          <label className={labelCls}>Veto winner</label>
          <PlayerSelect value={form.pov} onChange={(v) => set({ pov: v })} players={activePlayers} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Nominees (all who sat on the block this week, incl. replacement)</label>
        <div className="flex flex-wrap gap-2">
          {activePlayers.map((p) => (
            <label key={p.id} className={`px-2 py-1 rounded-full text-xs cursor-pointer border ${form.noms.includes(p.id) ? "bg-amber-100 dark:bg-amber-900/40 border-amber-400 text-amber-900 dark:text-amber-200" : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"}`}>
              <input type="checkbox" className="sr-only" checked={form.noms.includes(p.id)} onChange={() => set({ noms: toggleIn(form.noms, p.id) })} />
              {p.name}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Veto used on (saved nominee)</label>
          <PlayerSelect value={form.vetoUsedOn} onChange={(v) => set({ vetoUsedOn: v })} players={roster.filter((r) => form.noms.includes(r.id))} />
        </div>
        <div>
          <label className={labelCls}>Evicted</label>
          <div className="flex flex-wrap gap-2 pt-1">
            {activePlayers.filter((p) => finalNoms.includes(p.id) || form.evicted.includes(p.id)).map((p) => (
              <label key={p.id} className={`px-2 py-1 rounded-full text-xs cursor-pointer border ${form.evicted.includes(p.id) ? "bg-red-100 dark:bg-red-900/40 border-red-400 text-red-900 dark:text-red-200" : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300"}`}>
                <input type="checkbox" className="sr-only" checked={form.evicted.includes(p.id)} onChange={() => set({ evicted: toggleIn(form.evicted, p.id) })} />
                {p.name}
              </label>
            ))}
            {finalNoms.length === 0 && form.evicted.length === 0 && (
              <span className="text-xs text-gray-400 dark:text-gray-500 pt-1">Pick nominees first</span>
            )}
          </div>
        </div>
      </div>

      {finalNoms.length > 0 && (
        <div>
          <label className={labelCls}>Eviction votes (each houseguest → voted to evict)</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {voters.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-300 w-24 truncate" title={p.name}>{p.name}</span>
                <select
                  value={form.votes[p.id] || 0}
                  onChange={(e) => set({ votes: { ...form.votes, [p.id]: Number(e.target.value) } })}
                  className={inputCls}
                >
                  <option value={0}>—</option>
                  {finalNoms.map((id) => (
                    <option key={id} value={id}>{rosterById[id]?.name || id}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className={labelCls}>Other comp wins (Block Buster, AI Arena, co-HoH…)</label>
          <button
            onClick={() => set({ miscComps: [...form.miscComps, { player_id: 0, comp_type_id: 0, notes: "" }] })}
            className="text-primary-500 hover:text-primary-600 text-xs font-medium"
          >+ Add</button>
        </div>
        {form.miscComps.map((mc, i) => (
          <div key={i} className="flex items-center gap-2 mb-2">
            <div className="flex-1">
              <PlayerSelect value={mc.player_id} onChange={(v) => {
                const next = [...form.miscComps]; next[i] = { ...mc, player_id: v }; set({ miscComps: next });
              }} players={activePlayers} />
            </div>
            <div className="flex-1">
              <select value={mc.comp_type_id || 0} onChange={(e) => {
                const next = [...form.miscComps]; next[i] = { ...mc, comp_type_id: Number(e.target.value) }; set({ miscComps: next });
              }} className={inputCls}>
                <option value={0}>Comp type…</option>
                {compTypes.map((ct) => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
              </select>
            </div>
            <input value={mc.notes} placeholder="notes" onChange={(e) => {
              const next = [...form.miscComps]; next[i] = { ...mc, notes: e.target.value }; set({ miscComps: next });
            }} className={`${inputCls} flex-1`} />
            <button onClick={() => set({ miscComps: form.miscComps.filter((_, j) => j !== i) })} className="text-red-500 text-xs">✕</button>
          </div>
        ))}
      </div>

      <div>
        <label className={labelCls}>Week summary (shows on the season page)</label>
        <textarea rows={3} value={form.summary} onChange={(e) => set({ summary: e.target.value })} className={inputCls} />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input type="checkbox" checked={showFinale} onChange={(e) => {
            setShowFinale(e.target.checked);
            if (e.target.checked && Object.keys(form.juryVotes).length === 0) {
              set({ juryVotes: collectJuryVotes(weeks) });
            }
          }} className="rounded" />
          Finale week — record jury votes to win
        </label>
        {showFinale && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
            {jurors.map((p) => (
              <div key={p.id} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-300 w-24 truncate" title={p.name}>{p.name}</span>
                <select
                  value={form.juryVotes[p.id] || 0}
                  onChange={(e) => set({ juryVotes: { ...form.juryVotes, [p.id]: Number(e.target.value) } })}
                  className={inputCls}
                >
                  <option value={0}>—</option>
                  {activePlayers.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
            ))}
            {jurors.length === 0 && <span className="text-xs text-gray-400">No evicted players yet — jury shows up as evictions are recorded.</span>}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
        <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
          {saving ? "Saving…" : "Save Week"}
        </button>
        {savedFlash && <span className="text-green-600 dark:text-green-400 text-sm">Saved ✓</span>}
      </div>
    </div>
  );
}
