import Image from "next/image";
import Link from "next/link";
import { displayName } from "./playerName";
import { toRelativeHref } from "@/lib/utils/url";
import { playerPoints, pointsBreakdown, survivedCount } from "@/lib/bbPoints";

/**
 * Full season stats table — the homepage sidebar table expanded to every
 * scoring input (points, comps, survived nights, veto saves, have-nots).
 * HoH/PoV/Nom counts come from the weekly junction faces when the season is
 * tracked (same source as Weekly Results; the aggregate stats are stale for
 * hand-entered seasons), falling back to the API stats otherwise.
 */
function tallyFromWeeks(weeks) {
  const byId = new Map();
  const bump = (id, key) => {
    const entry = byId.get(id) || { hoh: 0, pov: 0, nom: 0 };
    entry[key] += 1;
    byId.set(id, entry);
  };
  for (const w of weeks || []) {
    for (const f of w.faces?.hoh || []) bump(f.id, "hoh");
    for (const f of w.faces?.pov || []) bump(f.id, "pov");
    for (const f of w.faces?.noms || []) bump(f.id, "nom");
  }
  return byId;
}

function StatsAvatar({ player }) {
  if (player.photo) {
    return (
      <Image
        src={player.photo}
        alt=""
        width={24}
        height={24}
        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
      />
    );
  }
  return (
    <span className="flex-shrink-0 grid place-items-center w-6 h-6 rounded-full bg-primary-500 text-white text-[9px] font-bold">
      {(player.name || "?").slice(0, 2).toUpperCase()}
    </span>
  );
}

export function SeasonStats({ players, weeks, season }) {
  if (!players?.length) return null;

  const weekTallies = tallyFromWeeks(weeks);

  const rows = players.map((p) => {
    const tallied = weekTallies.get(p.id) || weekTallies.get(p.player_id);
    const s = p.stats || {};
    const isOut = Boolean(p.game_status?.evicted || p.game_status?.jury);
    const stats = {
      hoh: tallied ? tallied.hoh : Number(s.hoh) || 0,
      pov: tallied ? tallied.pov : Number(s.pov) || 0,
      nom: tallied ? tallied.nom : Number(s.nom) || 0,
      misc: Number(s.misc) || 0,
      saved: Number(s.saved) || 0,
      on_block: Boolean(season?.is_active && p.game_status?.nom),
    };
    return {
      id: p.id,
      player: p,
      isOut,
      stats,
      pts: playerPoints(stats, isOut),
      breakdown: pointsBreakdown(stats, isOut),
      survived: survivedCount(stats, isOut),
      votes: Number(s.votes_received) || 0,
      havenot: Number(s.havenot) || 0,
      days: Number(s.days_in_house) || 0,
    };
  });

  rows.sort((a, b) => (a.isOut ? 1 : 0) - (b.isOut ? 1 : 0) || b.pts - a.pts);

  // Columns with no data season-wide just add noise — drop them.
  const showHavenot = rows.some((r) => r.havenot > 0);
  const showDays = rows.some((r) => r.days > 0);

  const cols = [
    { key: "pts", label: "PTS", title: "Season points" },
    { key: "hoh", label: "H", title: "HoH wins" },
    { key: "pov", label: "V", title: "Veto wins" },
    { key: "nom", label: "N", title: "Nominations" },
    { key: "misc", label: "OC", title: "Other comp wins (Block Buster, AI Arena, ...)" },
    { key: "survived", label: "SB", title: "Eviction nights survived on the block" },
    { key: "saved", label: "VS", title: "Times saved by the veto" },
    { key: "votes", label: "VR", title: "Eviction votes received" },
    ...(showHavenot ? [{ key: "havenot", label: "HN", title: "Have-Not weeks" }] : []),
    ...(showDays ? [{ key: "days", label: "TD", title: "Total days in house" }] : []),
  ];

  const cellValue = (r, key) =>
    key === "pts" ? r.pts
      : key in r.stats ? r.stats[key]
      : r[key];

  return (
    <section id="stats">
      <div className="sech"><h2>Stats</h2><span className="sub">Full season table</span></div>
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200 dark:border-slate-700">
                <th className="text-left py-1.5 pr-2">Player</th>
                {cols.map((c) => (
                  <th key={c.key} className="text-center py-1.5 px-1.5" title={c.title}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className={`border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                    r.isOut ? "text-slate-400 dark:text-slate-500" : ""
                  }`}
                >
                  <td className="py-1.5 pr-2">
                    <Link
                      href={r.player.permalink ? toRelativeHref(r.player.permalink) : "#"}
                      className="flex items-center gap-2 hover:underline"
                    >
                      <StatsAvatar player={r.player} />
                      <span className="truncate">{displayName(r.player)}</span>
                    </Link>
                  </td>
                  {cols.map((c) => (
                    <td
                      key={c.key}
                      className={`text-center tabular-nums px-1.5 ${c.key === "pts" ? "font-semibold" : ""}`}
                      title={c.key === "pts" ? r.breakdown : undefined}
                    >
                      {cellValue(r, c.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-slate-500 italic">
          PTS: HoH 2.5, Veto 2, other comps 1, surviving the block 1, veto save 0.5, nomination -1.
          OC = other comp wins, SB = survived the block, VS = veto saves, VR = votes received
          {showHavenot ? ", HN = Have-Not weeks" : ""}{showDays ? ", TD = total days" : ""}.
        </p>
      </div>
    </section>
  );
}
