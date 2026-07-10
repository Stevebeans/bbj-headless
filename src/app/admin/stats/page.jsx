"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  getAnalyticsOverview,
  getAnalyticsPages,
  getAnalyticsSources,
  getAnalyticsAudience,
  getAnalyticsAdBlocker,
  getSearchConsole,
  getRankTracker,
  saveTrackedKeywords,
} from "@/lib/api/analytics";
import { getSeasons } from "@/lib/api/seasons";

// ========================================
// DATE HELPERS
// ========================================

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function subDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const PRESETS = [
  { label: "1D", days: 1 },
  { label: "7D", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 90 },
  { label: "6M", days: 180 },
  { label: "1Y", days: 365 },
];

const CHART_COLORS = {
  primary: "#35546e",
  secondary: "#FFBF0F",
  accent: "#E55C41",
  green: "#059669",
  purple: "#6366F1",
  pink: "#EC4899",
  amber: "#B45309",
  sky: "#0EA5E9",
};

const PIE_COLORS = [CHART_COLORS.primary, CHART_COLORS.secondary, CHART_COLORS.accent, CHART_COLORS.green, CHART_COLORS.purple];

// ========================================
// FORMAT HELPERS
// ========================================

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateWithDay(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// ========================================
// SECTION CARD + SKELETON COMPONENTS
// ========================================

function SectionCard({ title, children, className = "", fullWidth = false }) {
  return (
    <div
      className={`bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 ${
        fullWidth ? "col-span-full" : ""
      } ${className}`}
    >
      {title && (
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

function KPISkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 animate-pulse">
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
          <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton({ height = "h-64" }) {
  return (
    <div className={`${height} bg-slate-100 dark:bg-slate-800 rounded animate-pulse`} />
  );
}

function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse">
          <div className="h-4 flex-1 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-4 w-16 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      ))}
    </div>
  );
}

/**
 * Renders loading skeleton or content based on loading state.
 * When loading, wraps skeleton in a SectionCard with the given title.
 * When loaded, renders children (or nothing if children is falsy).
 */
function LoadingSection({ loading, title, skeleton, fullWidth = false, children }) {
  if (loading) {
    return (
      <SectionCard title={title} fullWidth={fullWidth}>
        {skeleton}
      </SectionCard>
    );
  }
  return children || null;
}

// ========================================
// GENERIC DATA TABLE
// ========================================

/**
 * Reusable data table component for analytics tables.
 *
 * @param {string} title - SectionCard title
 * @param {Array} data - Row data array
 * @param {Array} columns - Column definitions: { header, key, align, format, truncate }
 *   - header: Column header text
 *   - key: Property name on the row object
 *   - align: "left" (default) or "right"
 *   - format: Optional function to format the cell value
 *   - truncate: Optional max-width string (e.g. "200px") for truncation
 * @param {boolean} fullWidth - Whether card spans full width
 * @param {string} maxHeight - Optional max-height class (e.g. "max-h-80")
 */
function DataTable({ title, data, columns, fullWidth = false, maxHeight = "" }) {
  const scrollClass = `overflow-x-auto ${maxHeight ? `${maxHeight} overflow-y-auto` : ""}`;
  const stickyClass = maxHeight ? "sticky top-0 bg-slate-50 dark:bg-slate-800/50" : "";

  return (
    <SectionCard title={title} fullWidth={fullWidth}>
      <div className={scrollClass}>
        <table className="w-full text-sm">
          <thead className={stickyClass}>
            <tr className="text-left text-xs text-slate-500 dark:text-slate-400 uppercase">
              {columns.map((col, ci) => {
                const isLast = ci === columns.length - 1;
                const alignClass = col.align === "right" ? "text-right" : "";
                return (
                  <th key={col.header} className={`pb-2 ${isLast ? "" : "pr-2"} ${alignClass}`}>
                    {col.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {data.map((row, i) => (
              <tr key={i} className="text-slate-700 dark:text-slate-300">
                {columns.map((col, ci) => {
                  const isLast = ci === columns.length - 1;
                  const value = row[col.key];
                  const displayed = col.format ? col.format(value) : value;
                  const alignClass = col.align === "right" ? "text-right" : "";
                  const emphasisClass = col.align === "right" && ci === 1 ? "font-medium" : "";
                  const truncateClass = col.truncate ? "truncate" : "";
                  const truncateStyle = col.truncate ? { maxWidth: col.truncate } : {};

                  return (
                    <td
                      key={col.header}
                      className={`py-1.5 ${isLast ? "" : "pr-2"} ${alignClass} ${emphasisClass} ${truncateClass}`}
                      style={truncateStyle}
                      title={col.truncate ? value : undefined}
                    >
                      {displayed}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// ========================================
// TABLE COLUMN DEFINITIONS
// ========================================

const TOP_PAGES_COLUMNS = [
  { header: "Page", key: "path", truncate: "200px" },
  { header: "Views", key: "views", align: "right", format: formatNumber },
  { header: "Avg Time", key: "avg_time", align: "right", format: formatDuration },
];

const LANDING_PAGES_COLUMNS = [
  { header: "Entry Page", key: "path", truncate: "400px" },
  { header: "Sessions", key: "sessions", align: "right", format: formatNumber },
  { header: "Bounce Rate", key: "bounce_rate", align: "right", format: (v) => `${v}%` },
];

const REFERRERS_COLUMNS = [
  { header: "Source", key: "source", truncate: "160px" },
  { header: "Sessions", key: "sessions", align: "right", format: formatNumber },
  { header: "Users", key: "users", align: "right", format: formatNumber },
];

const GEOGRAPHY_COLUMNS = [
  { header: "Country", key: "country" },
  { header: "Users", key: "users", align: "right", format: formatNumber },
  { header: "Sessions", key: "sessions", align: "right", format: formatNumber },
];

const SEARCH_METRICS_COLUMNS = [
  { header: "Clicks", key: "clicks", align: "right", format: formatNumber },
  { header: "Impressions", key: "impressions", align: "right", format: formatNumber },
  { header: "CTR", key: "ctr", align: "right", format: (v) => `${v}%` },
  { header: "Position", key: "position", align: "right" },
];

const KEYWORDS_COLUMNS = [
  { header: "Keyword", key: "query", truncate: "250px" },
  ...SEARCH_METRICS_COLUMNS,
];

const SEARCH_PAGES_COLUMNS = [
  { header: "Page", key: "page", truncate: "300px" },
  ...SEARCH_METRICS_COLUMNS,
];

// ========================================
// KEYWORD RANK TRACKER
// ========================================

const RANK_COLORS = ["#e64c3c", "#35546e", "#f5c518", "#10b981", "#8b5cf6", "#f97316", "#0ea5e9", "#ec4899", "#64748b", "#84cc16"];

function RankDelta({ delta }) {
  if (delta === null || delta === undefined || delta === 0) {
    return <span className="text-gray-400 text-xs">—</span>;
  }
  // Positions count DOWN as you climb: negative delta = improvement.
  const improved = delta < 0;
  return (
    <span className={`text-xs font-semibold ${improved ? "text-emerald-600" : "text-red-500"}`}>
      {improved ? "▲" : "▼"} {Math.abs(delta)}
    </span>
  );
}

function RankTrackerSection({ data, onKeywordsSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  if (!data?.series) return null;

  // Merge per-keyword series into one row per date for the chart
  const byDate = new Map();
  for (const s of data.series) {
    for (const p of s.points) {
      if (!byDate.has(p.date)) byDate.set(p.date, { date: p.date });
      byDate.get(p.date)[s.keyword] = p.position;
    }
  }
  const chartData = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({ ...row, label: formatShortDate(row.date) }));

  const startEdit = () => {
    setDraft(data.keywords.join(", "));
    setSaveError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const keywords = draft.split(",").map((k) => k.trim()).filter(Boolean);
      await saveTrackedKeywords(keywords);
      setEditing(false);
      onKeywordsSaved?.();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard title="Keyword Rankings (Google)" fullWidth>
      {/* Summary chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {data.series.map((s, i) => (
          <div key={s.keyword} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: RANK_COLORS[i % RANK_COLORS.length] }} />
            <span className="text-sm text-gray-700 dark:text-gray-300">{s.keyword}</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {s.summary.position !== null ? `#${s.summary.position}` : "n/a"}
            </span>
            <RankDelta delta={s.summary.delta} />
          </div>
        ))}
        <button
          onClick={editing ? () => setEditing(false) : startEdit}
          className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-primary-500 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          {editing ? "Cancel" : "Edit keywords"}
        </button>
      </div>

      {editing && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="big brother 28, big brother spoilers, …"
            className="flex-1 min-w-[280px] px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-800 dark:text-white"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {saveError && <span className="text-xs text-red-500">{saveError}</span>}
          <span className="text-xs text-gray-400 w-full">Comma-separated, up to 10. Exact-match against Google queries.</span>
        </div>
      )}

      {/* Position over time — Y axis inverted so climbing = line going UP */}
      {chartData.length > 0 ? (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis reversed domain={[1, "auto"]} tick={{ fontSize: 11 }} label={{ value: "Position", angle: -90, position: "insideLeft", fontSize: 11 }} />
              <Tooltip formatter={(v) => [`#${v}`, undefined]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {data.series.map((s, i) => (
                <Line
                  key={s.keyword}
                  type="monotone"
                  dataKey={s.keyword}
                  stroke={RANK_COLORS[i % RANK_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-sm text-gray-500 py-8 text-center">
          No ranking data in this range yet — Google Search Console data lags about 2 days.
        </p>
      )}
      <p className="text-[11px] text-gray-400 mt-2">
        Daily average Google position per query (Search Console). Lower is better; data lags ~2 days. Position shown is a 3-day average; the arrow compares to a week earlier.
      </p>
    </SectionCard>
  );
}

// ========================================
// KPI CARDS
// ========================================

function KPICards({ data }) {
  const cards = [
    { label: "Total Users", value: formatNumber(data.total_users), color: "text-primary-500" },
    { label: "Page Views", value: formatNumber(data.page_views), color: "text-secondary-600" },
    { label: "Avg Session", value: formatDuration(data.avg_session_duration), color: "text-emerald-600" },
    { label: "Bounce Rate", value: `${data.bounce_rate}%`, color: "text-red-500" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            {card.label}
          </p>
          <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}

// ========================================
// CHART COMPONENTS
// ========================================

function TrafficChart({ data }) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatShortDate(d.date),
    fullLabel: formatDateWithDay(d.date),
  }));

  return (
    <SectionCard title="Traffic Over Time" fullWidth>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel || _} />
            <Legend />
            <Line type="monotone" dataKey="page_views" name="Page Views" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="users" name="Users" stroke={CHART_COLORS.secondary} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

function TrafficSourcesChart({ data }) {
  return (
    <SectionCard title="Traffic Sources">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="channel" tick={{ fontSize: 11 }} width={75} />
            <Tooltip />
            <Bar dataKey="sessions" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

function DeviceChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.sessions, 0);

  return (
    <SectionCard title="Devices">
      <div className="h-64 flex items-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="sessions" nameKey="device" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(val) => [`${formatNumber(val)} (${((val / total) * 100).toFixed(1)}%)`, "Sessions"]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

function PeakHoursChart({ data }) {
  const formatted = data.map((d) => ({
    ...d,
    label: `${d.hour}:00`,
  }));

  return (
    <SectionCard title="Peak Hours (EST)">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="page_views" name="Page Views" fill={CHART_COLORS.secondary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

function AdBlockerStats({ data }) {
  return (
    <SectionCard title="Ad Blocker Detection">
      <div className="text-center mb-4">
        <p className="text-3xl font-bold text-red-500">{data.percentage}%</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {formatNumber(data.total_events)} detections / {formatNumber(data.total_sessions)} sessions
        </p>
      </div>
      {data.daily?.length > 0 && (
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.daily.map((d) => ({ ...d, label: formatShortDate(d.date) }))}>
              <XAxis dataKey="label" tick={{ fontSize: 9 }} />
              <YAxis tick={{ fontSize: 9 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke={CHART_COLORS.accent} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  );
}

function ContentBreakdownChart({ data }) {
  const total = data.reduce((sum, d) => sum + d.views, 0);
  const withPercent = data.map((d) => ({
    ...d,
    percent: total > 0 ? ((d.views / total) * 100).toFixed(1) : 0,
  }));

  return (
    <SectionCard title="Content Type Breakdown" fullWidth>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={withPercent} layout="vertical" margin={{ left: 100 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={95} />
            <Tooltip formatter={(val) => [formatNumber(val), "Views"]} />
            <Bar dataKey="views" radius={[0, 4, 4, 0]}>
              {withPercent.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}

// ========================================
// DATE CONTROLS
// ========================================

function DateControls({ activePreset, onPresetChange, seasons, selectedSeason, onSeasonChange, customStart, customEnd, onCustomChange, showCustom, onToggleCustom }) {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => onPresetChange(p)}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              activePreset === p.label
                ? "bg-primary-500 text-white"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <select
        value={selectedSeason || ""}
        onChange={(e) => onSeasonChange(e.target.value || null)}
        className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
      >
        <option value="">Season...</option>
        {seasons.map((s) => (
          <option key={s.id} value={s.id}>
            {s.abbreviation || s.full_name}
            {s.start_date && s.end_date
              ? ` (${new Date(s.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(s.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})`
              : ""}
          </option>
        ))}
      </select>

      <button
        onClick={onToggleCustom}
        className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
          showCustom
            ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600"
            : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50"
        }`}
      >
        Custom
      </button>

      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customStart}
            onChange={(e) => onCustomChange(e.target.value, customEnd)}
            className="px-2 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          />
          <span className="text-slate-400">–</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => onCustomChange(customStart, e.target.value)}
            className="px-2 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          />
        </div>
      )}
    </div>
  );
}

// ========================================
// ERROR DISPLAY
// ========================================

function ErrorMessage({ message, onRetry }) {
  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
      <p className="text-red-600 dark:text-red-400 text-sm mb-2">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm text-red-600 dark:text-red-400 underline hover:no-underline">
          Retry
        </button>
      )}
    </div>
  );
}

// ========================================
// MAIN PAGE
// ========================================

export default function AdminStatsPage() {
  const today = new Date();
  const [activePreset, setActivePreset] = useState("7D");
  const [startDate, setStartDate] = useState(formatDate(subDays(today, 7)));
  const [endDate, setEndDate] = useState(formatDate(today));
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [showCustom, setShowCustom] = useState(false);

  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [overview, setOverview] = useState(null);
  const [pages, setPages] = useState(null);
  const [sources, setSources] = useState(null);
  const [audience, setAudience] = useState(null);
  const [adBlocker, setAdBlocker] = useState(null);
  const [searchConsole, setSearchConsole] = useState(null);
  const [rankTracker, setRankTracker] = useState(null);

  useEffect(() => {
    getSeasons({ orderBy: "start_date", order: "DESC" }).then(({ seasons: s }) => {
      setSeasons(s || []);
    });
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [overviewRes, pagesRes, sourcesRes, audienceRes, adBlockRes, searchConsoleRes, rankTrackerRes] = await Promise.all([
        getAnalyticsOverview(startDate, endDate),
        getAnalyticsPages(startDate, endDate),
        getAnalyticsSources(startDate, endDate),
        getAnalyticsAudience(startDate, endDate),
        getAnalyticsAdBlocker(startDate, endDate),
        getSearchConsole(startDate, endDate).catch(() => null),
        getRankTracker(startDate, endDate).catch(() => null),
      ]);

      setOverview(overviewRes);
      setPages(pagesRes);
      setSources(sourcesRes);
      setAudience(audienceRes);
      setAdBlocker(adBlockRes);
      setSearchConsole(searchConsoleRes);
      setRankTracker(rankTrackerRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handlePresetChange(preset) {
    setActivePreset(preset.label);
    setSelectedSeason(null);
    setShowCustom(false);
    setStartDate(formatDate(subDays(today, preset.days)));
    setEndDate(formatDate(today));
  }

  function handleSeasonChange(seasonId) {
    if (!seasonId) {
      setSelectedSeason(null);
      handlePresetChange(PRESETS.find((p) => p.label === "7D"));
      return;
    }
    const season = seasons.find((s) => String(s.id) === String(seasonId));
    if (!season || !season.start_date || !season.end_date) return;

    setSelectedSeason(seasonId);
    setActivePreset(null);
    setShowCustom(false);
    setStartDate(formatDate(subDays(new Date(season.start_date), 14)));
    setEndDate(formatDate(addDays(new Date(season.end_date), 14)));
  }

  function handleCustomChange(start, end) {
    setActivePreset(null);
    setSelectedSeason(null);
    if (start) setStartDate(start);
    if (end) setEndDate(end);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Site Analytics</h2>
        <a
          href="https://analytics.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400"
        >
          Open GA4 (real-time) &rarr;
        </a>
      </div>

      <DateControls
        activePreset={activePreset}
        onPresetChange={handlePresetChange}
        seasons={seasons}
        selectedSeason={selectedSeason}
        onSeasonChange={handleSeasonChange}
        customStart={startDate}
        customEnd={endDate}
        onCustomChange={handleCustomChange}
        showCustom={showCustom}
        onToggleCustom={() => setShowCustom((v) => !v)}
      />

      {error && <ErrorMessage message={error} onRetry={fetchData} />}

      {/* KPI Cards */}
      {loading ? <KPISkeleton /> : overview && <KPICards data={overview.kpi} />}

      <div className="mt-6 space-y-6">
        {/* Traffic Over Time */}
        <LoadingSection loading={loading} title="Traffic Over Time" fullWidth skeleton={<ChartSkeleton />}>
          {overview?.chart?.length > 0 && <TrafficChart data={overview.chart} />}
        </LoadingSection>

        {/* Top Pages + Referrers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSection loading={loading} title="Top Pages" skeleton={<TableSkeleton rows={8} />}>
            {pages?.top_pages && (
              <DataTable title="Top Pages" data={pages.top_pages} columns={TOP_PAGES_COLUMNS} maxHeight="max-h-80" />
            )}
          </LoadingSection>
          <LoadingSection loading={loading} title="Top Referrers" skeleton={<TableSkeleton rows={8} />}>
            {sources?.referrers && (
              <DataTable title="Top Referrers" data={sources.referrers} columns={REFERRERS_COLUMNS} maxHeight="max-h-64" />
            )}
          </LoadingSection>
        </div>

        {/* Traffic Sources + Devices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSection loading={loading} title="Traffic Sources" skeleton={<ChartSkeleton />}>
            {sources?.channels && <TrafficSourcesChart data={sources.channels} />}
          </LoadingSection>
          <LoadingSection loading={loading} title="Devices" skeleton={<ChartSkeleton />}>
            {audience?.devices && <DeviceChart data={audience.devices} />}
          </LoadingSection>
        </div>

        {/* Peak Hours + Geography */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSection loading={loading} title="Peak Hours" skeleton={<ChartSkeleton />}>
            {audience?.peak_hours && <PeakHoursChart data={audience.peak_hours} />}
          </LoadingSection>
          <LoadingSection loading={loading} title="Top Countries" skeleton={<TableSkeleton rows={8} />}>
            {audience?.countries && (
              <DataTable title="Top Countries" data={audience.countries} columns={GEOGRAPHY_COLUMNS} maxHeight="max-h-64" />
            )}
          </LoadingSection>
        </div>

        {/* Ad Blocker Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSection loading={loading} title="Ad Blocker Detection" skeleton={<ChartSkeleton height="h-40" />}>
            {adBlocker && <AdBlockerStats data={adBlocker} />}
          </LoadingSection>
        </div>

        {/* Search Console */}
        {searchConsole?.keywords?.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-2">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Google Search Console</h3>
              <span className="text-xs text-slate-400 dark:text-slate-500">Organic search performance</span>
            </div>
            {/* Keyword rank tracker — daily position for the terms Steve is chasing */}
            <LoadingSection loading={loading} title="Keyword Rankings (Google)" fullWidth skeleton={<ChartSkeleton />}>
              {rankTracker && <RankTrackerSection data={rankTracker} onKeywordsSaved={fetchData} />}
            </LoadingSection>
            <LoadingSection loading={loading} title="Top Search Keywords" fullWidth skeleton={<TableSkeleton rows={10} />}>
              <DataTable title="Top Search Keywords" data={searchConsole.keywords} columns={KEYWORDS_COLUMNS} fullWidth maxHeight="max-h-96" />
            </LoadingSection>
            {searchConsole?.pages?.length > 0 && (
              <LoadingSection loading={loading} title="Top Pages (Search)" fullWidth skeleton={<TableSkeleton rows={8} />}>
                <DataTable title="Top Pages (Search)" data={searchConsole.pages} columns={SEARCH_PAGES_COLUMNS} fullWidth maxHeight="max-h-80" />
              </LoadingSection>
            )}
          </>
        )}

        {/* Landing Pages */}
        <LoadingSection loading={loading} title="Landing Pages" fullWidth skeleton={<TableSkeleton rows={6} />}>
          {pages?.landing_pages?.length > 0 && (
            <DataTable title="Landing Pages" data={pages.landing_pages} columns={LANDING_PAGES_COLUMNS} fullWidth />
          )}
        </LoadingSection>

        {/* Content Type Breakdown */}
        <LoadingSection loading={loading} title="Content Type Breakdown" fullWidth skeleton={<ChartSkeleton height="h-48" />}>
          {pages?.content_breakdown && <ContentBreakdownChart data={pages.content_breakdown} />}
        </LoadingSection>
      </div>
    </div>
  );
}
