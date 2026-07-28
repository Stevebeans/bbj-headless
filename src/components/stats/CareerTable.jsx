"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const COLUMNS = [
  { key: "points", label: "Pts", title: "Career points" },
  { key: "seasons", label: "Seasons", title: "Seasons played" },
  { key: "hoh", label: "HoH", title: "Head of Household wins" },
  { key: "pov", label: "PoV", title: "Power of Veto wins" },
  { key: "misc", label: "Other", title: "Other comp wins (Block Buster, AI Arena, ...)" },
  { key: "nom", label: "Noms", title: "Times nominated" },
  { key: "survived", label: "Survived", title: "Eviction nights survived on the block" },
  { key: "saved", label: "Saved", title: "Times saved by the veto" },
  { key: "votes_received", label: "Votes", title: "Eviction votes received" },
  { key: "days", label: "Days", title: "Days in the house" },
];

export function Crown() {
  return (
    <svg
      className="ml-1 inline-block h-[11px] w-[11px] shrink-0 opacity-90"
      viewBox="0 0 24 24"
      fill="#C97A16"
      aria-label="Season winner"
    >
      <path d="M3 7l4.5 4L12 4l4.5 7L21 7l-2 12H5L3 7z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-gray-500 dark:text-gray-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

/**
 * Every-player sortable career table (Claude Design "BBJ Stats Hub" look):
 * mono numerics, sticky sortable headers, winners-only toggle, zero dimming.
 */
export function CareerTable({ players }) {
  const [sortKey, setSortKey] = useState("points");
  const [sortDir, setSortDir] = useState(-1);
  const [filter, setFilter] = useState("");
  const [winnersOnly, setWinnersOnly] = useState(false);
  const [showAll, setShowAll] = useState(false);

  // Soft cap keeps the initial page scannable; filtering or the winners
  // toggle already produce small sets, so the cap only applies to the
  // untouched full list.
  const CAP = 100;

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const filtered = players.filter(
      (p) =>
        (!winnersOnly || p.is_winner) &&
        (!q || p.name.toLowerCase().includes(q))
    );
    return [...filtered].sort((a, b) => {
      if (sortKey === "name") return a.name.localeCompare(b.name) * -sortDir;
      const d = ((a[sortKey] || 0) - (b[sortKey] || 0)) * sortDir;
      return d || a.name.localeCompare(b.name);
    });
  }, [players, sortKey, sortDir, filter, winnersOnly]);

  const capped = !showAll && !filter.trim() && !winnersOnly && rows.length > CAP;
  const visible = capped ? rows.slice(0, CAP) : rows;

  const onSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => -d);
    } else {
      setSortKey(key);
      setSortDir(-1);
    }
  };

  const thClass = (key, first = false) =>
    `sticky top-0 cursor-pointer select-none whitespace-nowrap border-b border-gray-300 dark:border-gray-600 bg-[#F3F1EA] dark:bg-gray-900 px-3 py-2.5 font-plexMono text-[9.5px] font-semibold uppercase tracking-[.08em] ${
      first ? "pl-5 text-left" : "text-right"
    } ${sortKey === key ? "text-primary-600 dark:text-secondary-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"}`;

  const arrow = (key) =>
    sortKey === key ? (sortDir === -1 ? " ↓" : " ↑") : "";

  return (
    <section className="mt-5 overflow-hidden rounded-[10px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex flex-wrap items-center gap-3.5 border-b border-gray-200 dark:border-gray-700 px-5 py-4">
        <h2 className="font-osw text-[19px] font-semibold uppercase tracking-[.05em] text-gray-900 dark:text-gray-100">
          Every Houseguest
        </h2>
        <span className="font-plexMono text-[10px] uppercase tracking-[.08em] text-gray-500 dark:text-gray-400">
          {capped ? `Top ${visible.length} of ${players.length}` : `${rows.length} of ${players.length}`} players
        </span>
        <span className="flex-1" />
        <button
          type="button"
          onClick={() => setWinnersOnly((w) => !w)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 font-plexMono text-[10.5px] font-semibold uppercase tracking-[.07em] transition-colors ${
            winnersOnly
              ? "border-primary-500 bg-primary-500 text-white"
              : "border-gray-300 dark:border-gray-600 bg-[#F3F1EA] dark:bg-gray-900 text-gray-700 dark:text-gray-300"
          }`}
        >
          Winners only
        </button>
        <label className="relative flex items-center">
          <SearchIcon />
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter players..."
            className="w-full rounded-full border border-gray-300 dark:border-gray-600 bg-[#F3F1EA] dark:bg-gray-900 py-2 pl-8 pr-3.5 text-[13.5px] text-gray-900 dark:text-gray-100 focus:border-primary-500 focus:bg-white dark:focus:bg-gray-800 focus:outline-none sm:w-[210px]"
          />
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={thClass("name", true)} onClick={() => onSort("name")}>
                Player{arrow("name")}
              </th>
              {COLUMNS.map((c) => (
                <th key={c.key} className={thClass(c.key)} title={c.title} onClick={() => onSort(c.key)}>
                  {c.label}
                  {arrow(c.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => (
              <tr
                key={p.id}
                className="border-b border-gray-100 dark:border-gray-700/60 last:border-0 even:bg-[#FCFCFB] dark:even:bg-white/[.02] hover:bg-[#F4F7FB] dark:hover:bg-white/[.05]"
              >
                <td className="whitespace-nowrap py-2.5 pl-5 pr-3 text-left text-sm">
                  <Link
                    href={`/bigbrother-players/${p.slug}`}
                    className="inline-flex items-center font-medium text-gray-900 dark:text-gray-100 hover:text-primary-500 dark:hover:text-secondary-400 hover:underline"
                  >
                    {p.name}
                    {p.is_winner && <Crown />}
                  </Link>
                </td>
                {COLUMNS.map((c) => (
                  <td
                    key={c.key}
                    className={`whitespace-nowrap px-3 py-2.5 text-right font-plexMono text-[13px] ${
                      c.key === "points"
                        ? "text-[13.5px] font-semibold text-gray-900 dark:text-gray-100"
                        : (p[c.key] || 0) === 0
                          ? "text-gray-300 dark:text-gray-600"
                          : "text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {p[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="px-5 py-8 text-center font-serifBody italic text-gray-500">
            No houseguest matches that filter.
          </p>
        )}
        {capped && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-3 text-center">
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="rounded-full border border-gray-300 dark:border-gray-600 bg-[#F3F1EA] dark:bg-gray-900 px-5 py-2 font-plexMono text-[10.5px] font-semibold uppercase tracking-[.07em] text-gray-700 dark:text-gray-300 transition-colors hover:border-primary-500 hover:text-primary-500"
            >
              Show all {rows.length} houseguests
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-4 border-t border-gray-200 dark:border-gray-700 bg-[#F3F1EA] dark:bg-gray-900 px-5 py-3 font-plexMono text-[9.5px] uppercase tracking-[.07em] text-gray-500 dark:text-gray-400">
        <span>👑 = season winner</span>
        <span>Pts: HoH 2.5 · Veto 2 · other comps 1 · survived block 1 · veto save 0.5 · nom -1</span>
        <span>Click any column to sort</span>
      </div>
    </section>
  );
}
