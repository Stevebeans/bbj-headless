"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTracker, saveMoverNote } from "@/lib/api/fanVotes";
import { chartModel, thinLabels, formatDelta } from "@/lib/fanvotes/tracker";
import { usePermissions } from "@/hooks/usePermissions";
import BallotPanel from "./BallotPanel";

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "Season", days: 120 },
];

const playerHref = (slug) => `/bigbrother-players/${slug}`;

function fmtTick(d) {
  const dt = new Date(`${d}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* -------------------------------------------------------------------------- */
/* Hero chart (Option A)                                                       */
/* -------------------------------------------------------------------------- */

function HeroChart({ payload, onFace }) {
  const model = chartModel(payload, { topN: 5 });
  const { lines, xLabels, yMax, x, y } = model;

  if (!lines.length || !x || xLabels.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
        The chart will fill in as daily snapshots accumulate.
      </div>
    );
  }

  const WIDTH = 1000;
  const HEIGHT = 380;
  const PAD = 40;

  // Horizontal gridlines every 10% up to yMax.
  const gridVals = [];
  for (let g = 0; g <= yMax; g += 10) gridVals.push(g);

  const ticks = thinLabels(xLabels, 7);
  const solid = lines.filter((l) => l.solid);
  const pack = lines.filter((l) => !l.solid);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full min-w-[560px]"
        role="img"
        aria-label="Fan favorite vote share over time"
        style={{ overflow: "visible" }}
      >
        <defs>
          {lines.map((l) => (
            <clipPath key={`clip-${l.player.id}`} id={`ff-clip-${l.player.id}`}>
              <circle cx={l.end.x} cy={l.end.y} r={l.solid ? 14 : 9} />
            </clipPath>
          ))}
        </defs>

        {/* Gridlines + y labels */}
        {gridVals.map((g) => (
          <g key={`grid-${g}`}>
            <line
              x1={PAD}
              x2={WIDTH - PAD}
              y1={y(g)}
              y2={y(g)}
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeWidth="1"
            />
            <text
              x={PAD - 8}
              y={y(g) + 4}
              textAnchor="end"
              fontSize="12"
              fill="currentColor"
              fillOpacity="0.5"
            >
              {g}%
            </text>
          </g>
        ))}

        {/* X tick labels */}
        {ticks.map((t) => (
          <text
            key={`tick-${t.index}`}
            x={x(t.index)}
            y={HEIGHT - PAD + 22}
            textAnchor="middle"
            fontSize="12"
            fill="currentColor"
            fillOpacity="0.5"
          >
            {fmtTick(t.date)}
          </text>
        ))}

        {/* Dashed pack lines (drawn under solid) */}
        {pack.map((l) => (
          <path
            key={`line-${l.player.id}`}
            d={l.path}
            fill="none"
            stroke={l.color}
            strokeWidth="1.5"
            strokeDasharray="4 4"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* Solid top-5 lines + dots */}
        {solid.map((l) => (
          <g key={`line-${l.player.id}`}>
            <path
              d={l.path}
              fill="none"
              stroke={l.color}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {l.points.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r="3"
                fill="#ffffff"
                stroke={l.color}
                strokeWidth="1.5"
              />
            ))}
          </g>
        ))}

        {/* Pack faces — small, faded, no label */}
        {pack.map((l) => (
          <g
            key={`face-${l.player.id}`}
            className="cursor-pointer"
            onClick={() => onFace(l.player.slug)}
          >
            {l.player.photo ? (
              <image
                href={l.player.photo}
                x={l.end.x - 9}
                y={l.end.y - 9}
                width="18"
                height="18"
                clipPath={`url(#ff-clip-${l.player.id})`}
                opacity="0.4"
                preserveAspectRatio="xMidYMid slice"
              />
            ) : (
              <circle cx={l.end.x} cy={l.end.y} r="9" fill={l.color} opacity="0.4" />
            )}
          </g>
        ))}

        {/* Solid faces + name labels */}
        {solid.map((l) => (
          <g
            key={`face-${l.player.id}`}
            className="cursor-pointer"
            onClick={() => onFace(l.player.slug)}
          >
            <circle
              cx={l.end.x}
              cy={l.end.y}
              r="15"
              fill="#ffffff"
              stroke={l.color}
              strokeWidth="2"
            />
            {l.player.photo ? (
              <image
                href={l.player.photo}
                x={l.end.x - 14}
                y={l.end.y - 14}
                width="28"
                height="28"
                clipPath={`url(#ff-clip-${l.player.id})`}
                preserveAspectRatio="xMidYMid slice"
              />
            ) : (
              <circle cx={l.end.x} cy={l.end.y} r="14" fill={l.color} />
            )}
            <text
              x={l.end.x + 22}
              y={l.end.y + 4}
              fontSize="13"
              fontWeight="600"
              fill={l.color}
            >
              {l.player.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Sparkline — last <=7 series points, normalized per-row                      */
/* -------------------------------------------------------------------------- */

function Sparkline({ values, color = "#1e3a5f" }) {
  const W = 84;
  const H = 24;
  const P = 3;
  if (!values || values.length === 0) {
    return <svg width={W} height={H} aria-hidden="true" />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const n = values.length;
  const xAt = (i) => (n === 1 ? W / 2 : P + (i / (n - 1)) * (W - 2 * P));
  const yAt = (v) => (range === 0 ? H / 2 : H - P - ((v - min) / range) * (H - 2 * P));

  if (n === 1) {
    return (
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
        <circle cx={xAt(0)} cy={yAt(values[0])} r="2.5" fill={color} />
      </svg>
    );
  }

  const d = values
    .map((v, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(v).toFixed(1)}`)
    .join(" ");

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Delta badge                                                                 */
/* -------------------------------------------------------------------------- */

function DeltaBadge({ delta }) {
  const { text, dir } = formatDelta(delta);
  const color =
    dir === "up" ? "text-green-600" : dir === "down" ? "text-red-500" : "text-gray-400";
  const arrow = dir === "up" ? "▲" : dir === "down" ? "▼" : "";
  return (
    <span className={`inline-flex items-center gap-0.5 font-medium tabular-nums ${color}`}>
      {arrow && <span aria-hidden="true">{arrow}</span>}
      {text}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Biggest Movers row (+ admin inline note edit)                               */
/* -------------------------------------------------------------------------- */

function MoverRow({ player, max, isAdmin, onSaved }) {
  const delta = Number(player.delta24h) || 0;
  const rising = delta > 0;
  const pct = Math.min(100, (Math.abs(delta) / (max || 1)) * 100);

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(player.note || "");
  const [saving, setSaving] = useState(false);
  const committed = useRef(false);

  useEffect(() => {
    setValue(player.note || "");
  }, [player.note]);

  const commit = async () => {
    if (committed.current) return;
    committed.current = true;
    const trimmed = value.trim().slice(0, 140);
    setEditing(false);
    if (trimmed === (player.note || "")) {
      committed.current = false;
      return;
    }
    setSaving(true);
    try {
      await saveMoverNote(player.id, trimmed);
      await onSaved();
    } catch {
      /* leave the note as-is on failure */
    } finally {
      setSaving(false);
      committed.current = false;
    }
  };

  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3">
        <Link href={playerHref(player.slug)} className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={player.photo}
            alt={player.name}
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover bg-gray-100 dark:bg-gray-800"
          />
        </Link>
        <div className="min-w-0 flex-grow">
          <Link
            href={playerHref(player.slug)}
            className="block truncate font-medium text-gray-800 dark:text-gray-100 hover:text-primary-500"
          >
            {player.name}
          </Link>

          {/* Note line */}
          {player.note ? (
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{player.note}</p>
          ) : isAdmin ? (
            editing ? (
              <input
                type="text"
                autoFocus
                maxLength={140}
                value={value}
                disabled={saving}
                onChange={(e) => setValue(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.currentTarget.blur();
                  if (e.key === "Escape") {
                    committed.current = true;
                    setEditing(false);
                    setValue(player.note || "");
                    committed.current = false;
                  }
                }}
                placeholder="Add a note (140 max)…"
                className="mt-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs text-gray-800 dark:text-gray-100"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  committed.current = false;
                  setEditing(true);
                }}
                className="text-xs text-gray-400 hover:text-primary-500"
              >
                + add note
              </button>
            )
          ) : null}
        </div>

        {/* Delta + caption */}
        <div className="shrink-0 text-right">
          <div className={`text-lg font-bold tabular-nums ${rising ? "text-green-600" : "text-red-500"}`}>
            {formatDelta(delta).text}
          </div>
          <div className={`text-[10px] font-semibold uppercase tracking-wide ${rising ? "text-green-600" : "text-red-500"}`}>
            {rising ? "Rising" : "Cooling"}
          </div>
        </div>
      </div>

      {/* Magnitude bar */}
      <div className="mt-2 h-1 w-full rounded bg-gray-100 dark:bg-gray-800">
        <div
          className={`h-1 rounded ${rising ? "bg-green-500" : "bg-red-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/* Main client                                                                 */
/* -------------------------------------------------------------------------- */

export function TrackerClient() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const isAdmin = hasPermission("season_management");

  const [days, setDays] = useState(30);
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showFullCast, setShowFullCast] = useState(false);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Tracks the currently selected range so a stale in-flight fetch (e.g. a
  // 7D request that resolves after the user has already toggled to 30D)
  // can be dropped instead of overwriting the newer selection's payload.
  const latestDays = useRef(days);
  useEffect(() => {
    latestDays.current = days;
  }, [days]);

  const load = useCallback(async (d, { silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const data = await getTracker(d);
      if (!mounted.current || d !== latestDays.current) return;
      setPayload(data);
      setError(false);
    } catch {
      if (mounted.current && d === latestDays.current && !silent) setError(true);
    } finally {
      if (mounted.current && d === latestDays.current && !silent) setLoading(false);
    }
  }, []);

  // Refetch on range change (and initial mount).
  useEffect(() => {
    load(days);
  }, [days, load]);

  // Auto-refresh every 60s, skipped while the tab is hidden.
  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) load(days, { silent: true });
    }, 60000);
    return () => clearInterval(id);
  }, [days, load]);

  const refetch = useCallback(() => load(days, { silent: true }), [days, load]);

  const players = payload?.players || [];
  const series = payload?.series || [];
  const tooFew =
    payload && Number(payload.total_voters) < Number(payload.min_voters);

  // Sparkline values per player from the last <=7 daily snapshots.
  const sparkFor = (id) =>
    series.slice(-7).map((s) => Number(s.shares?.[id] ?? 0));

  // Biggest movers — client-side sort by |delta|, drop tiny moves, take 5.
  const movers = players
    .filter((p) => Math.abs(Number(p.delta24h) || 0) >= 0.1)
    .sort((a, b) => Math.abs(Number(b.delta24h) || 0) - Math.abs(Number(a.delta24h) || 0))
    .slice(0, 5);
  const maxMove = movers.reduce(
    (m, p) => Math.max(m, Math.abs(Number(p.delta24h) || 0)),
    0.1
  );

  const leaderboard = showFullCast ? players : players.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Range toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                days === r.days
                  ? "bg-primary-500 text-white"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        {payload?.as_of && (
          <span className="text-xs text-gray-400" suppressHydrationWarning>
            As of {payload.as_of}
          </span>
        )}
      </div>

      {/* TOP ROW — hero chart / empty-state (80%) + ballot panel (20%) */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-4 min-w-0">
          {/* Hero chart / empty-state */}
          {loading && !payload ? (
            <div className="h-64 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          ) : error && !payload ? (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-sm text-gray-500">
              Standings are taking a moment to load. They will refresh automatically.
            </div>
          ) : tooFew ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-primary-300 dark:border-primary-700 bg-primary-50/40 dark:bg-primary-900/10 px-6 py-12 text-center">
              <p className="text-base font-medium text-gray-700 dark:text-gray-200">
                Not enough votes yet — visit your favorite player&apos;s page and be one of the first ♥
              </p>
            </div>
          ) : (
            <HeroChart
              payload={payload}
              onFace={(slug) => router.push(playerHref(slug))}
            />
          )}
        </div>
        <div className="lg:col-span-1 min-w-0">
          <BallotPanel players={players} onSaved={refetch} />
        </div>
      </div>

      {/* Standings grid — only once we have enough voters */}
      {!tooFew && players.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-5">
          {/* LEFT — Top 5 Today */}
          <div className="lg:col-span-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl text-primary-500 dark:text-primary-400">
                {showFullCast ? "Full Cast" : "Top 5 Today"}
              </h2>
              {players.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowFullCast((v) => !v)}
                  className="text-sm text-primary-500 hover:text-primary-600"
                >
                  {showFullCast ? "Show top 5" : "Show full cast"}
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-2 font-medium">#</th>
                    <th className="py-2 pr-2 font-medium">Player</th>
                    <th className="py-2 px-2 font-medium">7-day</th>
                    <th className="py-2 px-2 font-medium text-right">Share</th>
                    <th className="py-2 pl-2 font-medium text-right">Δ 24h</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((p, i) => (
                    <tr
                      key={p.id}
                      className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                    >
                      <td className="py-2 pr-2 text-gray-400 tabular-nums">{i + 1}</td>
                      <td className="py-2 pr-2">
                        <Link
                          href={playerHref(p.slug)}
                          className="flex items-center gap-2 hover:text-primary-500"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.photo}
                            alt={p.name}
                            width={40}
                            height={40}
                            className="h-10 w-10 rounded-full object-cover bg-gray-100 dark:bg-gray-800"
                          />
                          <span className="font-medium text-gray-800 dark:text-gray-100">
                            {p.name}
                          </span>
                        </Link>
                      </td>
                      <td className="py-2 px-2">
                        <Sparkline values={sparkFor(p.id)} />
                      </td>
                      <td className="py-2 px-2 text-right font-bold tabular-nums text-gray-800 dark:text-gray-100">
                        <div>{Number(p.share ?? 0).toFixed(1)}%</div>
                        <div className="text-[10px] font-normal text-gray-400 tabular-nums">
                          {Number(p.points ?? 0).toFixed(1)} pts
                        </div>
                      </td>
                      <td className="py-2 pl-2 text-right">
                        <DeltaBadge delta={p.delta24h} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT — Biggest Movers */}
          <div className="lg:col-span-2">
            <h2 className="mb-3 font-display text-xl text-primary-500 dark:text-primary-400">
              Biggest Movers · last 24h
            </h2>
            {movers.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 px-4 py-6 text-center text-sm text-gray-500">
                No big moves in the last 24 hours.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                {movers.map((p) => (
                  <MoverRow
                    key={p.id}
                    player={p}
                    max={maxMove}
                    isAdmin={isAdmin}
                    onSaved={refetch}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
