"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const COLUMNS = [
  { key: "points", label: "PTS", title: "Career points" },
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

/**
 * Every-player sortable career table. Client-side sort + name filter over the
 * server-fetched list (~400 rows, no pagination needed).
 */
export function CareerTable({ players }) {
  const [sortKey, setSortKey] = useState("points");
  const [sortDir, setSortDir] = useState(-1);
  const [filter, setFilter] = useState("");

  const rows = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const filtered = q
      ? players.filter((p) => p.name.toLowerCase().includes(q))
      : players;
    return [...filtered].sort(
      (a, b) => ((a[sortKey] || 0) - (b[sortKey] || 0)) * sortDir
    );
  }, [players, sortKey, sortDir, filter]);

  const onSort = (key) => {
    if (key === sortKey) {
      setSortDir((d) => -d);
    } else {
      setSortKey(key);
      setSortDir(-1);
    }
  };

  return (
    <div>
      <input
        type="search"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Filter players..."
        className="mb-3 w-full max-w-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm"
      />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 pr-2">Player</th>
              {COLUMNS.map((c) => (
                <th key={c.key} className="py-2 px-1.5 text-center">
                  <button
                    type="button"
                    onClick={() => onSort(c.key)}
                    title={c.title}
                    className={`hover:text-primary-500 ${
                      sortKey === c.key ? "text-primary-500" : ""
                    }`}
                  >
                    {c.label}
                    {sortKey === c.key ? (sortDir === -1 ? " ↓" : " ↑") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr
                key={p.id}
                className="border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <td className="py-1.5 pr-2 whitespace-nowrap">
                  <Link
                    href={`/bigbrother-players/${p.slug}`}
                    className="hover:underline text-accent-red font-medium"
                  >
                    {p.name}
                  </Link>
                  {p.is_winner && (
                    <span className="ml-1" title="Season winner" aria-label="Season winner">👑</span>
                  )}
                </td>
                {COLUMNS.map((c) => (
                  <td
                    key={c.key}
                    className={`py-1.5 px-1.5 text-center tabular-nums ${
                      c.key === "points" ? "font-semibold" : ""
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
          <p className="py-6 text-center text-sm text-gray-500">No players match.</p>
        )}
      </div>
    </div>
  );
}
