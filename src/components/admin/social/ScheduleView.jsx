"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getSchedule } from "@/lib/api/admin";

// Source -> human label + badge color. Covers both scheduled (queue) rows and
// posted items merged from the FB feed. Unknown sources read as "manual post".
const SOURCE_META = {
  social_quickie: { label: "quickie card", cls: "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300" },
  feed_update_share: { label: "feed share", cls: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
  feed_share: { label: "feed share", cls: "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" },
  batch: { label: "batch post", cls: "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300" },
  manual_fb: { label: "posted by hand", cls: "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300" },
};

function sourceMeta(src) {
  return (
    SOURCE_META[src] || {
      label: "manual post",
      cls: "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
    }
  );
}

// Stored timestamps are UTC 'Y-m-d H:i:s' with no zone marker.
function toDate(utc) {
  if (!utc) return null;
  const iso = utc.includes("T") ? utc : utc.replace(" ", "T");
  const d = new Date(iso.endsWith("Z") ? iso : iso + "Z");
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtTime(utc) {
  const d = toDate(utc);
  if (!d) return "--";
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Countdown for still-upcoming rows on the current day. Empty once due/past.
function countdown(utc, now) {
  const d = toDate(utc);
  if (!d) return "";
  const mins = Math.round((d.getTime() - now) / 60000);
  if (mins <= 0) return "";
  if (mins < 90) return `in ${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `in ${h}h ${m}m`;
}

// 1200 -> "1.2K"; small numbers render as-is.
function compactNum(n) {
  const v = Number(n) || 0;
  if (v < 1000) return String(v);
  return (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1) + "K";
}

// Some bodies arrive emoji-entity-encoded (utf8mb3-era storage). Decode + clip.
function preview(str, max = 100) {
  let s = str || "";
  if (typeof document !== "undefined") {
    const el = document.createElement("textarea");
    el.innerHTML = s;
    s = el.value;
  }
  return s.length > max ? s.slice(0, max) + "..." : s;
}

// Local midnight for a given day offset from today, as a Date.
function localMidnight(offsetDays) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offsetDays);
  return d;
}

// Date -> UTC 'Y-m-d H:i:s' for the endpoint's window bounds.
function toUtcString(d) {
  return d.toISOString().slice(0, 19).replace("T", " ");
}

function SourceBadge({ source }) {
  const meta = sourceMeta(source);
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

function MetricChip({ label, value, title }) {
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
    >
      <span className="font-semibold text-slate-800 dark:text-slate-100">{compactNum(value)}</span>
      {label}
    </span>
  );
}

function PostedRow({ item, isWinner }) {
  const m = item.metrics;
  return (
    <li
      className={`border rounded-lg p-4 ${
        isWinner
          ? "border-amber-300 dark:border-amber-600 ring-2 ring-amber-400 dark:ring-amber-500"
          : "border-slate-200 dark:border-slate-700"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {fmtTime(item.posted_at)}
        </span>
        <SourceBadge source={item.source} />
        {isWinner && <span title="Top reach this day">🏆</span>}
        {item.permalink && (
          <a
            href={item.permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-primary-500 hover:text-primary-600 font-medium"
          >
            View on FB
          </a>
        )}
      </div>

      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
        {preview(item.body)}
      </p>

      {m && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          <MetricChip label="Reach" value={m.reach} title={`${compactNum(m.impressions)} impressions`} />
          <MetricChip label="Clicks" value={m.clicks} />
          <MetricChip label="Reactions" value={m.reactions} />
          <MetricChip label="Comments" value={m.comments} />
          <MetricChip label="Shares" value={m.shares} />
        </div>
      )}
    </li>
  );
}

function ScheduledRow({ row, now }) {
  const cd = countdown(row.scheduled_at, now);
  return (
    <li className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {fmtTime(row.scheduled_at)}
        </span>
        <SourceBadge source={row.source} />
        {cd && (
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
            {cd}
          </span>
        )}
        {Number(row.has_image) > 0 && (
          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded text-xs">
            🖼 card
          </span>
        )}
        {row.target_page_name && (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded text-xs">
            {row.target_page_name}
          </span>
        )}
      </div>
      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
        {preview(row.body)}
      </p>
    </li>
  );
}

export default function ScheduleView() {
  const [offset, setOffset] = useState(0); // 0 = today, negatives = past, positives = future
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(() => Date.now());

  const anchor = useMemo(() => localMidnight(offset), [offset]);
  const dateLabel = anchor.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const load = useCallback(async (dayOffset) => {
    setLoading(true);
    setError(null);
    const start = localMidnight(dayOffset);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    try {
      const res = await getSchedule(toUtcString(start), toUtcString(end));
      setData(res);
      setNow(Date.now());
    } catch (err) {
      setError(err.message || "Failed to load the schedule.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(offset);
  }, [offset, load]);

  // Normalize the three response shapes into scheduled rows + posted items +
  // one insights_error (top-level on past, nested under posted on mixed).
  const { mode, scheduled, posted, insightsError } = useMemo(() => {
    const d = data || {};
    const m = d.mode || "future";
    if (m === "future") {
      return { mode: m, scheduled: d.items || [], posted: [], insightsError: null };
    }
    if (m === "mixed") {
      return {
        mode: m,
        scheduled: d.scheduled || [],
        posted: d.posted?.items || [],
        insightsError: d.posted?.insights_error || d.insights_error || null,
      };
    }
    // past
    return { mode: m, scheduled: [], posted: d.items || [], insightsError: d.insights_error || null };
  }, [data]);

  const winnerId = useMemo(() => {
    let best = null;
    let bestReach = 0;
    for (const it of posted) {
      const reach = it.metrics ? Number(it.metrics.reach) || 0 : 0;
      if (reach > bestReach) {
        bestReach = reach;
        best = it.fb_post_id;
      }
    }
    return bestReach > 0 ? best : null;
  }, [posted]);

  const showPosted = mode === "past" || mode === "mixed";
  const showScheduled = mode === "future" || mode === "mixed";

  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl shadow p-6 mb-6">
      {/* Day navigation */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOffset((o) => o - 1)}
            aria-label="Previous day"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 text-lg leading-none"
          >
            ‹
          </button>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 min-w-[12rem] text-center">
            {dateLabel}
          </h2>
          <button
            type="button"
            onClick={() => setOffset((o) => o + 1)}
            aria-label="Next day"
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 text-lg leading-none"
          >
            ›
          </button>
        </div>
        <button
          type="button"
          onClick={() => setOffset(0)}
          disabled={offset === 0}
          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Today
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 dark:text-red-400 py-6 text-center">{error}</p>
      ) : (
        <div className="space-y-6">
          {/* Posted (past + mixed) */}
          {showPosted && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
                Posted
              </h3>

              {insightsError && (
                <div className="mb-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                  FB metrics unavailable: {insightsError}
                </div>
              )}

              {posted.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm py-6 text-center">
                  No page posts went out this day.
                </p>
              ) : (
                <ul className="space-y-3">
                  {posted.map((item) => (
                    <PostedRow
                      key={item.fb_post_id}
                      item={item}
                      isWinner={winnerId != null && item.fb_post_id === winnerId}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Scheduled (future + mixed) */}
          {showScheduled && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
                Scheduled
              </h3>
              {scheduled.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400 text-sm py-6 text-center">
                  Nothing scheduled for this day.
                </p>
              ) : (
                <ul className="space-y-3">
                  {scheduled.map((row) => (
                    <ScheduledRow key={row.id} row={row} now={now} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
