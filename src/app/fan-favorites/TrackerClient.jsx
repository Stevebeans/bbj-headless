"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getTracker, saveMoverNote, getMyBallot, savePrefs } from "@/lib/api/fanVotes";
import { getToken } from "@/lib/auth/cookies";
import {
  chartModel,
  thinLabels,
  formatDelta,
  playerColorMap,
  standingsRows,
  dodgeYs,
  seasonShort,
} from "@/lib/fanvotes/tracker";
import { usePermissions } from "@/hooks/usePermissions";
import BallotPanel from "./BallotPanel";
import PlayerAvatar, { playerInitials } from "./PlayerAvatar";
import { SectionHeader } from "@/components/home/SectionHeader";

// Tailwind dark mode is class-driven; watch <html class="dark"> so the chart
// swaps to the dark-validated palette in sync with the site theme toggle.
function useIsDark() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const apply = () => setIsDark(el.classList.contains("dark"));
    apply();
    const mo = new MutationObserver(apply);
    mo.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return isDark;
}

const RANGES = [
  { label: "7D", days: 7 },
  { label: "30D", days: 30 },
  { label: "Season", days: 120 },
];

// Chart-only filters (single-select). Mirrors the plugin's PREF_CHART_FILTERS.
const CHART_FILTERS = [
  { id: "all", label: "All" },
  { id: "top5", label: "Top 5" },
  { id: "top10", label: "Top 10" },
  { id: "in_house", label: "In the house" },
];
const FILTER_IDS = CHART_FILTERS.map((f) => f.id);
const PREF_DAYS = RANGES.map((r) => r.days);
const PREFS_STORAGE_KEY = "bbj_fanfav_prefs";

const playerHref = (slug) => `/bigbrother-players/${slug}`;

function fmtTick(d) {
  const dt = new Date(`${d}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/* -------------------------------------------------------------------------- */
/* Hero chart (Option A)                                                       */
/* -------------------------------------------------------------------------- */

function HeroChart({ payload, filterIds, onFace, highlightId = null }) {
  // Taller canvas on narrow screens: early-season shares cluster hard and the
  // extra vertical resolution keeps overlapping faces readable.
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => setIsNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // Desktop renders in the ~560px column beside the 300px ballot, so it gets a
  // portrait viewBox that lands at roughly the My Rankings card height instead
  // of a wide canvas scaled down to half size.
  const WIDTH = isNarrow ? 1000 : 640;
  const HEIGHT = isNarrow ? 620 : 660;
  const PAD = 40;

  const isDark = useIsDark();
  const colorMap = useMemo(
    () => playerColorMap(payload?.players, isDark ? "dark" : "light"),
    [payload, isDark]
  );
  const model = chartModel(payload, { topN: 5, filterIds, width: WIDTH, height: HEIGHT, colorMap });
  const { lines, xLabels, yMax, x, y } = model;

  // Tied/near-tied shares stack end-faces on top of each other: dodge them
  // apart vertically and remember each player's face position.
  const faceY = useMemo(() => {
    const adjusted = dodgeYs(
      lines.map((l) => ({ y: l.end?.y ?? 0, r: l.solid ? 20 : 12 })),
      PAD,
      HEIGHT - PAD
    );
    return new Map(lines.map((l, i) => [l.player.id, adjusted[i]]));
  }, [lines, HEIGHT]);

  const isDim = (id) => highlightId != null && highlightId !== id;

  const containerRef = useRef(null);
  // Hover tooltip: { name, share, x, y } in container-relative pixels, or null.
  const [tip, setTip] = useState(null);

  const showTip = useCallback((e, l) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const py = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
    setTip({ name: l.player.name, share: Number(l.player.share ?? 0), x: px, y: py });
  }, []);
  const hideTip = useCallback(() => setTip(null), []);

  if (!lines.length || !x || xLabels.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
        The chart will fill in as daily snapshots accumulate.
      </div>
    );
  }

  // Horizontal gridlines: 5% steps while the axis is zoomed in, 10% later.
  const gridStep = yMax <= 25 ? 5 : 10;
  const gridVals = [];
  for (let g = 0; g <= yMax; g += gridStep) gridVals.push(g);

  const ticks = thinLabels(xLabels, 7);
  const solid = lines.filter((l) => l.solid);
  const pack = lines.filter((l) => !l.solid);

  return (
    <div ref={containerRef} className="relative">
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
              <circle cx={l.end.x} cy={faceY.get(l.player.id) ?? l.end.y} r={l.solid ? 19 : 12} />
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

        {/* Dashed pack lines (drawn under solid). A rail-highlighted pack
            player gets its stable color and a solid stroke so it pops. */}
        {pack.map((l) => (
          <path
            key={`line-${l.player.id}`}
            d={l.path}
            fill="none"
            stroke={highlightId === l.player.id ? colorMap[l.player.id] : l.color}
            strokeWidth={highlightId === l.player.id ? 2.5 : 1.5}
            strokeDasharray={highlightId === l.player.id ? undefined : "4 4"}
            strokeOpacity={isDim(l.player.id) ? 0.15 : 1}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}

        {/* Solid top-5 lines + dots */}
        {solid.map((l) => (
          <g key={`line-${l.player.id}`} opacity={isDim(l.player.id) ? 0.15 : 1}>
            <path
              d={l.path}
              fill="none"
              stroke={l.color}
              strokeWidth={highlightId === l.player.id ? 3.5 : 2.5}
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

        {/* Dodge connectors — hairline from the true line end to a face that
            was nudged aside by a tie/near-tie */}
        {lines.map((l) => {
          const fy = faceY.get(l.player.id) ?? l.end.y;
          if (Math.abs(fy - l.end.y) <= 2) return null;
          return (
            <line
              key={`lead-${l.player.id}`}
              x1={l.end.x}
              y1={l.end.y}
              x2={l.end.x}
              y2={fy}
              stroke={l.solid ? l.color : "#9ca3af"}
              strokeWidth="1"
              strokeOpacity={isDim(l.player.id) ? 0.1 : 0.5}
            />
          );
        })}

        {/* Pack faces — small, faded, brighten to full opacity on hover */}
        {pack.map((l) => {
          const fy = faceY.get(l.player.id) ?? l.end.y;
          const lit = highlightId === l.player.id;
          return (
            <g
              key={`face-${l.player.id}`}
              className="cursor-pointer"
              opacity={isDim(l.player.id) ? 0.2 : 1}
              onClick={() => onFace(l.player.slug)}
              onMouseEnter={(e) => showTip(e, l)}
              onMouseMove={(e) => showTip(e, l)}
              onMouseLeave={hideTip}
            >
              {l.player.photo ? (
                <image
                  href={l.player.photo}
                  x={l.end.x - 12}
                  y={fy - 12}
                  width="24"
                  height="24"
                  clipPath={`url(#ff-clip-${l.player.id})`}
                  className={lit ? "" : "opacity-40 transition-opacity hover:opacity-100"}
                  preserveAspectRatio="xMidYMid slice"
                />
              ) : (
                <g className={lit ? "" : "opacity-40 transition-opacity hover:opacity-100"}>
                  <circle cx={l.end.x} cy={fy} r="12" fill={colorMap[l.player.id] ?? l.color} />
                  <text
                    x={l.end.x}
                    y={fy + 3.5}
                    textAnchor="middle"
                    fontSize="9"
                    fontWeight="700"
                    fill="#ffffff"
                  >
                    {playerInitials(l.player.name)}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Solid faces — no name label (hover tooltip instead) */}
        {solid.map((l) => {
          const fy = faceY.get(l.player.id) ?? l.end.y;
          return (
            <g
              key={`face-${l.player.id}`}
              className="cursor-pointer"
              opacity={isDim(l.player.id) ? 0.2 : 1}
              onClick={() => onFace(l.player.slug)}
              onMouseEnter={(e) => showTip(e, l)}
              onMouseMove={(e) => showTip(e, l)}
              onMouseLeave={hideTip}
            >
              <circle
                cx={l.end.x}
                cy={fy}
                r="20"
                fill="#ffffff"
                stroke={l.color}
                strokeWidth="2.5"
              />
              {l.player.photo ? (
                <image
                  href={l.player.photo}
                  x={l.end.x - 19}
                  y={fy - 19}
                  width="38"
                  height="38"
                  clipPath={`url(#ff-clip-${l.player.id})`}
                  preserveAspectRatio="xMidYMid slice"
                />
              ) : (
                <g>
                  <circle cx={l.end.x} cy={fy} r="19" fill={l.color} />
                  <text
                    x={l.end.x}
                    y={fy + 5}
                    textAnchor="middle"
                    fontSize="14"
                    fontWeight="700"
                    fill="#ffffff"
                  >
                    {playerInitials(l.player.name)}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
      </div>

      {tip && (
        <div
          className="pointer-events-none absolute z-10 rounded-md bg-gray-900/95 px-2 py-1 text-xs font-medium text-white shadow-lg"
          style={{ left: tip.x + 12, top: tip.y + 12 }}
        >
          {tip.name} · {tip.share.toFixed(1)}%
        </div>
      )}
    </div>
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
/* Standings rail — full cast, competition-ranked, hover highlights the chart  */
/* -------------------------------------------------------------------------- */

function StandingsRail({ players, highlightId, onHighlight }) {
  const isDark = useIsDark();
  const colorMap = useMemo(
    () => playerColorMap(players, isDark ? "dark" : "light"),
    [players, isDark]
  );
  const rows = useMemo(() => standingsRows(players), [players]);
  const top5 = new Set(players.slice(0, 5).map((p) => p.id));
  // Click pins a highlight (mobile has no hover); click again to unpin.
  const [pinned, setPinned] = useState(null);

  return (
    <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
      <h2 className="mb-1 font-display text-xl text-primary-500 dark:text-primary-400">
        Standings
      </h2>
      <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
        Tap a player to spotlight their line.
      </p>
      <ol onMouseLeave={() => onHighlight(pinned)}>
        {rows.map(({ rank, tied, player: p }) => {
          const active = highlightId === p.id;
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => {
                  const next = pinned === p.id ? null : p.id;
                  setPinned(next);
                  onHighlight(next);
                }}
                onMouseEnter={() => onHighlight(p.id)}
                aria-pressed={active}
                className={`flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left transition-colors ${
                  active ? "bg-primary-50 dark:bg-primary-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <span
                  className="w-7 shrink-0 text-center text-xs font-bold tabular-nums text-gray-400"
                  title={tied ? "Tied" : undefined}
                >
                  {tied ? `T${rank}` : rank}
                </span>
                <span
                  aria-hidden="true"
                  className="h-4 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: top5.has(p.id) ? colorMap[p.id] : "transparent" }}
                />
                <PlayerAvatar player={p} size={28} />
                <span className="min-w-0 flex-grow truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                  {p.name}
                </span>
                <span className="shrink-0 text-sm font-bold tabular-nums text-gray-800 dark:text-gray-100">
                  {Number(p.share ?? 0).toFixed(1)}%
                </span>
                <span className="w-14 shrink-0 text-right text-xs">
                  <DeltaBadge delta={p.delta24h} />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
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
          <PlayerAvatar player={player} size={40} />
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
  // Auth-state signal for the prefs hydration effect below. Recomputed every
  // render — TrackerClient already re-renders on login/logout transitions
  // via usePermissions()'s internal useAuth() subscription, same mechanism
  // BallotPanel relies on for its own isAuthed.
  const isAuthed = Boolean(getToken());

  const [days, setDays] = useState(30);
  const [chartFilter, setChartFilter] = useState("all");
  const [payload, setPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Rail hover/click spotlight: the player id whose chart line to emphasize.
  const [highlightId, setHighlightId] = useState(null);

  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Single shared ballot fetch: BallotPanel needs order/weight, TrackerClient
  // needs prefs from the SAME /fan-vote/ballot response. Cache-keyed by token
  // so a mount dedupes to one request, but an in-place login/logout re-fetches.
  const ballotCache = useRef({ token: undefined, promise: null });
  const getSharedBallot = useCallback(() => {
    const token = getToken();
    if (ballotCache.current.token !== token) {
      ballotCache.current = { token, promise: getMyBallot() };
    }
    return ballotCache.current.promise;
  }, []);

  // Persistence is enabled only after prefs hydration so the initial
  // localStorage/server reads don't echo straight back out as writes.
  const prefsHydrated = useRef(false);
  // Mirrors BallotPanel's prevAuthRef: null = "not yet initialized" (first
  // run = mount, not a transition); after that, any change to isAuthed is
  // an in-place login/logout via the modal, with no page reload.
  const prevAuthRef = useRef(null);

  // Hydrate prefs on mount, and re-hydrate on an in-place auth transition
  // (login/logout via the modal, no page reload). On mount: instant paint
  // from localStorage, then — if logged in — the server-stored prefs
  // (cross-device) win. On a login transition: server prefs are applied
  // over whatever's on screen (the guest's localStorage-seeded values).
  // On a logout transition: current UI state is left alone; server prefs
  // simply stop being authoritative going forward (localStorage-only).
  useEffect(() => {
    const authChanged = prevAuthRef.current !== null && prevAuthRef.current !== isAuthed;
    prevAuthRef.current = isAuthed;
    let cancelled = false;

    const applyServerPrefs = () =>
      getSharedBallot()
        .then((b) => {
          if (cancelled || !mounted.current) return;
          const p = b?.prefs;
          if (p?.chart_filter && FILTER_IDS.includes(p.chart_filter)) setChartFilter(p.chart_filter);
          if (p?.days && PREF_DAYS.includes(Number(p.days))) setDays(Number(p.days));
        })
        .catch(() => {})
        .finally(() => {
          prefsHydrated.current = true;
        });

    if (!authChanged) {
      // Initial mount.
      try {
        const raw = localStorage.getItem(PREFS_STORAGE_KEY);
        if (raw) {
          const p = JSON.parse(raw);
          if (FILTER_IDS.includes(p.chart_filter)) setChartFilter(p.chart_filter);
          if (PREF_DAYS.includes(Number(p.days))) setDays(Number(p.days));
        }
      } catch {
        /* ignore malformed localStorage */
      }
      if (isAuthed) {
        applyServerPrefs();
      } else {
        prefsHydrated.current = true;
      }
    } else if (isAuthed) {
      // Login transition: guard the persist effect off (synchronously,
      // before the await) so applying the freshly-fetched server prefs
      // doesn't immediately POST them straight back as a "change".
      prefsHydrated.current = false;
      applyServerPrefs();
    } else {
      // Logout transition: keep current chart/range state as-is. Server
      // prefs are no longer authoritative — savePrefs is already gated on
      // getToken() in the persist effect below, so future changes only
      // reach localStorage.
      prefsHydrated.current = true;
    }

    return () => {
      cancelled = true;
    };
  }, [isAuthed, getSharedBallot]);

  // Persist range + filter whenever either changes (post-hydration).
  // localStorage always; server (fire-and-forget) when logged in.
  useEffect(() => {
    if (!prefsHydrated.current) return;
    const next = { chart_filter: chartFilter, days };
    try {
      localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore quota/availability errors */
    }
    if (getToken()) savePrefs(next).catch(() => {});
  }, [chartFilter, days]);

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

  // Biggest movers — client-side sort by |delta|, drop tiny moves, take 5.
  const movers = players
    .filter((p) => Math.abs(Number(p.delta24h) || 0) >= 0.1)
    .sort((a, b) => Math.abs(Number(b.delta24h) || 0) - Math.abs(Number(a.delta24h) || 0))
    .slice(0, 5);
  const maxMove = movers.reduce(
    (m, p) => Math.max(m, Math.abs(Number(p.delta24h) || 0)),
    0.1
  );

  // Chart-only filter -> the player ids whose lines to draw (null = all).
  const filterIds = useMemo(() => {
    switch (chartFilter) {
      case "top5":
        return players.slice(0, 5).map((p) => p.id);
      case "top10":
        return players.slice(0, 10).map((p) => p.id);
      case "in_house":
        return players.filter((p) => p.active).map((p) => p.id);
      default:
        return null;
    }
  }, [chartFilter, players]);

  const seasonTag = seasonShort(payload?.season_slug);

  return (
    <div className="space-y-6">
      {/* Season-driven heading (server shell renders the generic version) */}
      <div>
        <SectionHeader as="h1">
          {seasonTag ? `${seasonTag} Fan Favorite Tracker` : "Fan Favorite Tracker"}
        </SectionHeader>
        <p className="-mt-2 text-gray-600 dark:text-gray-400">
          Live standings, daily history — powered by BBJ reader votes.
        </p>
      </div>

      {/* Range toggle + chart filters */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
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
          <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5">
            {CHART_FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setChartFilter(f.id)}
                aria-pressed={chartFilter === f.id}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  chartFilter === f.id
                    ? "bg-primary-500 text-white"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        {payload?.as_of && (
          <span className="whitespace-nowrap text-xs text-gray-400" suppressHydrationWarning>
            As of {payload.as_of}
          </span>
        )}
      </div>

      {/* TOP ROW — hero chart / empty-state (fluid) + ballot panel (fixed ~300px) */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
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
              filterIds={filterIds}
              onFace={(slug) => router.push(playerHref(slug))}
              highlightId={highlightId}
            />
          )}
        </div>
        <div className="min-w-0">
          {!tooFew && players.length > 0 ? (
            <StandingsRail
              players={players}
              highlightId={highlightId}
              onHighlight={setHighlightId}
            />
          ) : (
            <BallotPanel players={players} onSaved={refetch} getBallot={getSharedBallot} />
          )}
        </div>
      </div>

      {/* SECOND ROW — ballot + biggest movers (standings live beside the chart) */}
      {!tooFew && players.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <div className="min-w-0">
            <BallotPanel players={players} onSaved={refetch} getBallot={getSharedBallot} />
          </div>

          <div className="min-w-0">
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
