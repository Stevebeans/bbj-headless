"use client";

import { useEffect, useState, useCallback } from "react";
import { getBugReports, updateBugReport, getBugReportStats } from "@/lib/api/admin";

const FILTER_SELECT_CLASSES =
  "px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 dark:text-white";

/**
 * Format a snake_case status string for display
 */
function formatStatus(status) {
  return status.replaceAll("_", " ");
}

/**
 * Safely extract pathname from a URL string, falling back to the original string
 */
function getPathname(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
  { value: "wont_fix", label: "Won't Fix" },
];

const SEVERITY_OPTIONS = [
  { value: "all", label: "All" },
  { value: "critical", label: "Critical" },
  { value: "major", label: "Major" },
  { value: "minor", label: "Minor" },
  { value: "cosmetic", label: "Cosmetic" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "All" },
  { value: "ui_visual", label: "UI / Visual" },
  { value: "functionality", label: "Functionality" },
  { value: "performance", label: "Performance" },
  { value: "content", label: "Content" },
  { value: "other", label: "Other" },
];

const STATUS_COLORS = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
  wont_fix: "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300",
};

const SEVERITY_COLORS = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  major: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  minor: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  cosmetic: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

const TYPE_LABELS = {
  ui_visual: "UI / Visual",
  functionality: "Functionality",
  performance: "Performance",
  content: "Content",
  other: "Other",
};

export default function BugReportsAdmin() {
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("open");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Expanded report
  const [expandedId, setExpandedId] = useState(null);

  // Admin notes editing
  const [editingNotes, setEditingNotes] = useState({});
  const [updatingId, setUpdatingId] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const [reportsData, statsData] = await Promise.all([
        getBugReports(statusFilter, severityFilter, typeFilter, page),
        getBugReportStats(),
      ]);
      setReports(reportsData.reports || []);
      setPagination(reportsData.pagination);
      setStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter, typeFilter, page]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  async function handleStatusChange(reportId, newStatus) {
    setUpdatingId(reportId);
    try {
      await updateBugReport(reportId, { status: newStatus });
      await fetchReports();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleSaveNotes(reportId) {
    setUpdatingId(reportId);
    try {
      await updateBugReport(reportId, { admin_notes: editingNotes[reportId] || "" });
      await fetchReports();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingId(null);
    }
  }

  function formatDate(dateStr) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <div>
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Open", count: stats.open, color: "text-blue-600" },
            { label: "In Progress", count: stats.in_progress, color: "text-yellow-600" },
            { label: "Resolved", count: stats.resolved, color: "text-green-600" },
            { label: "Closed", count: stats.closed, color: "text-gray-600" },
            { label: "Total", count: stats.total, color: "text-slate-800 dark:text-white" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { value: statusFilter, setter: setStatusFilter, options: STATUS_OPTIONS },
          { value: severityFilter, setter: setSeverityFilter, options: SEVERITY_OPTIONS },
          { value: typeFilter, setter: setTypeFilter, options: TYPE_OPTIONS },
        ].map((filter, i) => (
          <select
            key={i}
            value={filter.value}
            onChange={(e) => { filter.setter(e.target.value); setPage(1); }}
            className={FILTER_SELECT_CLASSES}
          >
            {filter.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg h-24" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 p-8 text-center">
          <p className="text-slate-500 dark:text-slate-400">No bug reports found matching filters.</p>
        </div>
      ) : (
        /* Report Cards */
        <div className="space-y-4">
          {reports.map((report) => {
            const isExpanded = expandedId === report.id;
            return (
              <div
                key={report.id}
                className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
              >
                {/* Report Summary Row */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-600/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : report.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[report.status]}`}>
                          {formatStatus(report.status)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[report.severity]}`}>
                          {report.severity}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-600 dark:text-gray-300">
                          {TYPE_LABELS[report.type] || report.type}
                        </span>
                      </div>
                      <p className="text-sm text-slate-800 dark:text-white line-clamp-2">
                        {report.description}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>by {report.reporter_name || "Unknown"}</span>
                        <span>{formatDate(report.created_at)}</span>
                        {report.page_url && (
                          <a
                            href={report.page_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-500 hover:underline truncate max-w-[200px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {getPathname(report.page_url)}
                          </a>
                        )}
                      </div>
                    </div>
                    <svg
                      className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-600 p-4 space-y-4 bg-gray-50 dark:bg-slate-800/50">
                    {/* Full Description */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">Description</h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                        {report.description}
                      </p>
                    </div>

                    {/* Steps to Reproduce */}
                    {report.steps_to_reproduce && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">Steps to Reproduce</h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {report.steps_to_reproduce}
                        </p>
                      </div>
                    )}

                    {/* Expected Behavior */}
                    {report.expected_behavior && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">Expected Behavior</h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {report.expected_behavior}
                        </p>
                      </div>
                    )}

                    {/* Screenshot */}
                    {report.screenshot_url && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">Screenshot</h4>
                        <a href={report.screenshot_url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={report.screenshot_url}
                            alt="Bug screenshot"
                            className="max-w-sm rounded-lg border border-gray-200 dark:border-gray-600 hover:opacity-90 transition-opacity"
                          />
                        </a>
                      </div>
                    )}

                    {/* Browser Info */}
                    {report.browser_info && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">Browser Info</h4>
                        <div className="bg-white dark:bg-slate-700 rounded-lg p-3 text-xs font-mono space-y-1">
                          {Object.entries(report.browser_info).map(([key, val]) => (
                            <div key={key} className="flex">
                              <span className="text-gray-500 w-32 flex-shrink-0">{key}:</span>
                              <span className="text-slate-700 dark:text-slate-300 break-all">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Console Errors */}
                    {report.console_errors && report.console_errors.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">
                          Console Errors ({report.console_errors.length})
                        </h4>
                        <div className="bg-gray-900 rounded-lg p-3 text-xs font-mono space-y-1 max-h-40 overflow-y-auto">
                          {report.console_errors.map((err, i) => (
                            <div key={i} className="text-red-400">
                              <span className="text-gray-500">[{err.timestamp}]</span> {err.message}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Admin Notes */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-gray-500 mb-1">Admin Notes</h4>
                      <textarea
                        value={editingNotes[report.id] ?? report.admin_notes ?? ""}
                        onChange={(e) => setEditingNotes((prev) => ({ ...prev, [report.id]: e.target.value }))}
                        placeholder="Add notes about this bug..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        rows={2}
                      />
                      {(editingNotes[report.id] !== undefined && editingNotes[report.id] !== (report.admin_notes || "")) && (
                        <button
                          onClick={() => handleSaveNotes(report.id)}
                          disabled={updatingId === report.id}
                          className="mt-1 px-3 py-1 text-xs bg-primary-500 text-white rounded hover:bg-primary-600 disabled:opacity-50"
                        >
                          {updatingId === report.id ? "Saving..." : "Save Notes"}
                        </button>
                      )}
                    </div>

                    {/* Status Actions */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase text-gray-500 mb-2">Change Status</h4>
                      <div className="flex flex-wrap gap-2">
                        {["open", "in_progress", "resolved", "closed", "wont_fix"].map((s) => (
                          <button
                            key={s}
                            onClick={() => handleStatusChange(report.id, s)}
                            disabled={report.status === s || updatingId === report.id}
                            className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                              report.status === s
                                ? "bg-gray-300 dark:bg-gray-600 cursor-default"
                                : "bg-white dark:bg-slate-600 border border-gray-300 dark:border-gray-500 hover:bg-gray-100 dark:hover:bg-slate-500 text-slate-700 dark:text-white"
                            }`}
                          >
                            {formatStatus(s)}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Resolved info */}
                    {report.resolved_at && (
                      <p className="text-xs text-gray-500">
                        Resolved by {report.resolved_by_name || "admin"} on {formatDate(report.resolved_at)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400">
            Page {page} of {pagination.total_pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
            disabled={page === pagination.total_pages}
            className="px-3 py-1 text-sm rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
