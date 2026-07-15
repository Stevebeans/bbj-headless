"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getWeeklyBundle, createWeek } from "@/lib/api/adminWeekly";
import { listAdminSeasons } from "@/lib/api/adminContent";
import WeekEditor from "./components/WeekEditor";

function weekSummaryLine(week, rosterById) {
  const name = (id) => rosterById[id]?.name?.split(" ")[0] || `#${id}`;
  const hoh = (week.comps || []).filter((c) => c.slug === "hoh").map((c) => name(c.player_id));
  const noms = (week.players || []).filter((p) => p.nom === 1).map((p) => name(p.player_id));
  const evicted = (week.players || []).filter((p) => p.evicted === 1).map((p) => name(p.player_id));
  const parts = [];
  if (hoh.length) parts.push(`HoH: ${hoh.join(", ")}`);
  if (noms.length) parts.push(`Noms: ${noms.join(", ")}`);
  if (evicted.length) parts.push(`Evicted: ${evicted.join(", ")}`);
  return parts.length ? parts.join(" · ") : "Empty week — click to fill in";
}

export default function AdminWeekly() {
  const [seasons, setSeasons] = useState([]);
  const [bundle, setBundle] = useState(null);
  const [seasonId, setSeasonId] = useState(0); // 0 = current season
  const [selectedWeekId, setSelectedWeekId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBundle = useCallback(async (id, keepWeek = null) => {
    setLoading(true);
    setError("");
    try {
      const data = await getWeeklyBundle(id);
      setBundle(data);
      setSeasonId(data.season_id);
      setSelectedWeekId(keepWeek);
    } catch (err) {
      setError(err.message || "Failed to load weekly data");
      setBundle(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    listAdminSeasons().then((d) => setSeasons(d.seasons || [])).catch(() => {});
    loadBundle(0);
  }, [loadBundle]);

  const handleAddWeek = async () => {
    try {
      const created = await createWeek(seasonId);
      await loadBundle(seasonId, created.id);
    } catch (err) {
      setError(err.message || "Failed to create week");
    }
  };

  const rosterById = {};
  for (const r of bundle?.roster || []) rosterById[r.id] = r;
  const selectedWeek = (bundle?.weeks || []).find((w) => w.id === selectedWeekId) || null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white">Weekly Results</h2>
          {bundle?.season_slug && (
            <Link
              href={`/bigbrother-seasons/${bundle.season_slug}/edit`}
              className="text-sm text-primary-500 dark:text-secondary-500 hover:underline"
            >
              Edit spoiler bar →
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <select
            value={seasonId}
            onChange={(e) => loadBundle(Number(e.target.value))}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          >
            {!seasons.some((s) => s.id === seasonId) && <option value={seasonId}>Current season</option>}
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name}</option>
            ))}
          </select>
          <button onClick={handleAddWeek} disabled={loading || !seasonId} className="btn-primary text-sm">+ Add Week</button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 text-sm rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full" />
        </div>
      ) : !bundle ? null : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            {bundle.weeks.length === 0 && (
              <p className="text-gray-500 dark:text-gray-400 text-sm py-6 text-center">
                No weeks yet for this season. Click &ldquo;+ Add Week&rdquo; to start Week 1.
              </p>
            )}
            {bundle.weeks.map((w) => (
              <button
                key={w.id}
                onClick={() => setSelectedWeekId(w.id)}
                className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                  w.id === selectedWeekId
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
              >
                <div className="font-medium text-sm text-gray-900 dark:text-gray-100">Week {w.week_num}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{weekSummaryLine(w, rosterById)}</div>
              </button>
            ))}
          </div>

          <div className="lg:col-span-2">
            {selectedWeek ? (
              <WeekEditor
                key={selectedWeek.id}
                week={selectedWeek}
                weeks={bundle.weeks}
                roster={bundle.roster}
                compTypes={bundle.comp_types}
                onSaved={() => loadBundle(seasonId, selectedWeek.id)}
                onDeleted={() => loadBundle(seasonId)}
              />
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm py-10 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
                Select a week to edit, or add a new one.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
