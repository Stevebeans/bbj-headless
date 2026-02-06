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
// SECTION CARD COMPONENT
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

// ========================================
// SKELETON LOADING
// ========================================

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
// TRAFFIC OVER TIME CHART
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

// ========================================
// TOP PAGES TABLE
// ========================================

function TopPagesTable({ data }) {
  return (
    <SectionCard title="Top Pages">
      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/50">
            <tr className="text-left text-xs text-slate-500 dark:text-slate-400 uppercase">
              <th className="pb-2 pr-2">Page</th>
              <th className="pb-2 pr-2 text-right">Views</th>
              <th className="pb-2 text-right">Avg Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {data.map((row, i) => (
              <tr key={i} className="text-slate-700 dark:text-slate-300">
                <td className="py-1.5 pr-2 truncate max-w-[200px]" title={row.path}>
                  {row.path}
                </td>
                <td className="py-1.5 pr-2 text-right font-medium">{formatNumber(row.views)}</td>
                <td className="py-1.5 text-right">{formatDuration(row.avg_time)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// ========================================
// LANDING PAGES TABLE
// ========================================

function LandingPagesTable({ data }) {
  return (
    <SectionCard title="Landing Pages" fullWidth>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 dark:text-slate-400 uppercase">
              <th className="pb-2 pr-2">Entry Page</th>
              <th className="pb-2 pr-2 text-right">Sessions</th>
              <th className="pb-2 text-right">Bounce Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {data.map((row, i) => (
              <tr key={i} className="text-slate-700 dark:text-slate-300">
                <td className="py-1.5 pr-2 truncate max-w-[400px]" title={row.path}>
                  {row.path}
                </td>
                <td className="py-1.5 pr-2 text-right font-medium">{formatNumber(row.sessions)}</td>
                <td className="py-1.5 text-right">{row.bounce_rate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// ========================================
// TRAFFIC SOURCES BAR CHART
// ========================================

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

// ========================================
// TOP REFERRERS TABLE
// ========================================

function ReferrersTable({ data }) {
  return (
    <SectionCard title="Top Referrers">
      <div className="overflow-x-auto max-h-64 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/50">
            <tr className="text-left text-xs text-slate-500 dark:text-slate-400 uppercase">
              <th className="pb-2 pr-2">Source</th>
              <th className="pb-2 pr-2 text-right">Sessions</th>
              <th className="pb-2 text-right">Users</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {data.map((row, i) => (
              <tr key={i} className="text-slate-700 dark:text-slate-300">
                <td className="py-1.5 pr-2 truncate max-w-[160px]" title={row.source}>
                  {row.source}
                </td>
                <td className="py-1.5 pr-2 text-right font-medium">{formatNumber(row.sessions)}</td>
                <td className="py-1.5 text-right">{formatNumber(row.users)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// ========================================
// DEVICE DONUT CHART
// ========================================

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

// ========================================
// PEAK HOURS BAR CHART
// ========================================

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

// ========================================
// GEOGRAPHY TABLE
// ========================================

function GeographyTable({ data }) {
  return (
    <SectionCard title="Top Countries">
      <div className="overflow-x-auto max-h-64 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/50">
            <tr className="text-left text-xs text-slate-500 dark:text-slate-400 uppercase">
              <th className="pb-2 pr-2">Country</th>
              <th className="pb-2 pr-2 text-right">Users</th>
              <th className="pb-2 text-right">Sessions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {data.map((row, i) => (
              <tr key={i} className="text-slate-700 dark:text-slate-300">
                <td className="py-1.5 pr-2">{row.country}</td>
                <td className="py-1.5 pr-2 text-right font-medium">{formatNumber(row.users)}</td>
                <td className="py-1.5 text-right">{formatNumber(row.sessions)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// ========================================
// AD BLOCKER STATS
// ========================================

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

// ========================================
// SEARCH CONSOLE: TOP KEYWORDS
// ========================================

function TopKeywordsTable({ data }) {
  return (
    <SectionCard title="Top Search Keywords" fullWidth>
      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/50">
            <tr className="text-left text-xs text-slate-500 dark:text-slate-400 uppercase">
              <th className="pb-2 pr-2">Keyword</th>
              <th className="pb-2 pr-2 text-right">Clicks</th>
              <th className="pb-2 pr-2 text-right">Impressions</th>
              <th className="pb-2 pr-2 text-right">CTR</th>
              <th className="pb-2 text-right">Position</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {data.map((row, i) => (
              <tr key={i} className="text-slate-700 dark:text-slate-300">
                <td className="py-1.5 pr-2 max-w-[250px] truncate" title={row.query}>
                  {row.query}
                </td>
                <td className="py-1.5 pr-2 text-right font-medium">{formatNumber(row.clicks)}</td>
                <td className="py-1.5 pr-2 text-right">{formatNumber(row.impressions)}</td>
                <td className="py-1.5 pr-2 text-right">{row.ctr}%</td>
                <td className="py-1.5 text-right">{row.position}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// ========================================
// SEARCH CONSOLE: TOP PAGES BY SEARCH
// ========================================

function SearchPagesTable({ data }) {
  return (
    <SectionCard title="Top Pages (Search)" fullWidth>
      <div className="overflow-x-auto max-h-80 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/50">
            <tr className="text-left text-xs text-slate-500 dark:text-slate-400 uppercase">
              <th className="pb-2 pr-2">Page</th>
              <th className="pb-2 pr-2 text-right">Clicks</th>
              <th className="pb-2 pr-2 text-right">Impressions</th>
              <th className="pb-2 pr-2 text-right">CTR</th>
              <th className="pb-2 text-right">Position</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {data.map((row, i) => (
              <tr key={i} className="text-slate-700 dark:text-slate-300">
                <td className="py-1.5 pr-2 max-w-[300px] truncate" title={row.page}>
                  {row.page}
                </td>
                <td className="py-1.5 pr-2 text-right font-medium">{formatNumber(row.clicks)}</td>
                <td className="py-1.5 pr-2 text-right">{formatNumber(row.impressions)}</td>
                <td className="py-1.5 pr-2 text-right">{row.ctr}%</td>
                <td className="py-1.5 text-right">{row.position}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}

// ========================================
// CONTENT TYPE BREAKDOWN
// ========================================

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
      {/* Preset buttons */}
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

      {/* Season dropdown */}
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

      {/* Custom toggle */}
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

      {/* Custom date inputs */}
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

  // Load seasons on mount
  useEffect(() => {
    getSeasons({ orderBy: "start_date", order: "DESC" }).then(({ seasons: s }) => {
      setSeasons(s || []);
    });
  }, []);

  // Fetch analytics data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [overviewRes, pagesRes, sourcesRes, audienceRes, adBlockRes, searchConsoleRes] = await Promise.all([
        getAnalyticsOverview(startDate, endDate),
        getAnalyticsPages(startDate, endDate),
        getAnalyticsSources(startDate, endDate),
        getAnalyticsAudience(startDate, endDate),
        getAnalyticsAdBlocker(startDate, endDate),
        getSearchConsole(startDate, endDate).catch(() => null),
      ]);

      setOverview(overviewRes);
      setPages(pagesRes);
      setSources(sourcesRes);
      setAudience(audienceRes);
      setAdBlocker(adBlockRes);
      setSearchConsole(searchConsoleRes);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Preset change handler
  function handlePresetChange(preset) {
    setActivePreset(preset.label);
    setSelectedSeason(null);
    setShowCustom(false);
    setStartDate(formatDate(subDays(today, preset.days)));
    setEndDate(formatDate(today));
  }

  // Season change handler
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

  // Custom date change handler
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

      {/* Row 1: KPI Cards */}
      {loading ? <KPISkeleton /> : overview && <KPICards data={overview.kpi} />}

      <div className="mt-6 space-y-6">
        {/* Row 2: Traffic Over Time */}
        {loading ? (
          <SectionCard title="Traffic Over Time" fullWidth><ChartSkeleton /></SectionCard>
        ) : (
          overview?.chart?.length > 0 && <TrafficChart data={overview.chart} />
        )}

        {/* Row 3: Top Pages + Referrers side-by-side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <>
              <SectionCard title="Top Pages"><TableSkeleton rows={8} /></SectionCard>
              <SectionCard title="Top Referrers"><TableSkeleton rows={8} /></SectionCard>
            </>
          ) : (
            <>
              {pages?.top_pages && <TopPagesTable data={pages.top_pages} />}
              {sources?.referrers && <ReferrersTable data={sources.referrers} />}
            </>
          )}
        </div>

        {/* Row 4: Traffic Sources + Devices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <>
              <SectionCard title="Traffic Sources"><ChartSkeleton /></SectionCard>
              <SectionCard title="Devices"><ChartSkeleton /></SectionCard>
            </>
          ) : (
            <>
              {sources?.channels && <TrafficSourcesChart data={sources.channels} />}
              {audience?.devices && <DeviceChart data={audience.devices} />}
            </>
          )}
        </div>

        {/* Row 5: Peak Hours + Geography */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <>
              <SectionCard title="Peak Hours"><ChartSkeleton /></SectionCard>
              <SectionCard title="Top Countries"><TableSkeleton rows={8} /></SectionCard>
            </>
          ) : (
            <>
              {audience?.peak_hours && <PeakHoursChart data={audience.peak_hours} />}
              {audience?.countries && <GeographyTable data={audience.countries} />}
            </>
          )}
        </div>

        {/* Row 6: Ad Blocker Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {loading ? (
            <SectionCard title="Ad Blocker Detection"><ChartSkeleton height="h-40" /></SectionCard>
          ) : (
            adBlocker && <AdBlockerStats data={adBlocker} />
          )}
        </div>

        {/* Row 7: Search Console - Keywords & Pages */}
        {searchConsole?.keywords?.length > 0 && (
          <>
            <div className="flex items-center gap-2 mt-2">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Google Search Console</h3>
              <span className="text-xs text-slate-400 dark:text-slate-500">Organic search performance</span>
            </div>
            {loading ? (
              <SectionCard title="Top Search Keywords" fullWidth><TableSkeleton rows={10} /></SectionCard>
            ) : (
              <TopKeywordsTable data={searchConsole.keywords} />
            )}
            {searchConsole?.pages?.length > 0 && (
              loading ? (
                <SectionCard title="Top Pages (Search)" fullWidth><TableSkeleton rows={8} /></SectionCard>
              ) : (
                <SearchPagesTable data={searchConsole.pages} />
              )
            )}
          </>
        )}

        {/* Row 8: Landing Pages */}
        {loading ? (
          <SectionCard title="Landing Pages" fullWidth><TableSkeleton rows={6} /></SectionCard>
        ) : (
          pages?.landing_pages?.length > 0 && <LandingPagesTable data={pages.landing_pages} />
        )}

        {/* Row 8: Content Type Breakdown */}
        {loading ? (
          <SectionCard title="Content Type Breakdown" fullWidth><ChartSkeleton height="h-48" /></SectionCard>
        ) : (
          pages?.content_breakdown && <ContentBreakdownChart data={pages.content_breakdown} />
        )}
      </div>
    </div>
  );
}
