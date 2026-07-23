"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/api/admin";

// Stored timestamps are UTC 'Y-m-d H:i:s' with no zone marker. Render local.
function fmtTime(utc) {
  if (!utc) return "";
  const iso = utc.includes("T") ? utc : utc.replace(" ", "T") + "Z";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? utc : d.toLocaleString();
}

/**
 * DM abuse reports for moderators. Each report also lands in Steve's email;
 * this card is the browse/resolve surface. Collapsed by default so the
 * Users tab stays about users when the queue is empty.
 */
export default function DmReportsCard() {
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState("open"); // 'open' | 'all'
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [resolvingId, setResolvingId] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch(`/dm/reports?status=${status}`);
      setReports(res.reports || []);
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const resolve = async (id) => {
    setResolvingId(id);
    try {
      await adminFetch(`/dm/reports/${id}/resolve`, { method: "POST" });
      if (status === "open") {
        setReports((prev) => prev.filter((r) => r.id !== id));
      } else {
        setReports((prev) =>
          prev.map((r) => (r.id === id ? { ...r, resolved_at: new Date().toISOString() } : r))
        );
      }
    } catch (err) {
      setError(err.message || "Could not resolve the report.");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <h3 className="text-base font-osw font-bold text-slate-800 dark:text-white">
          DM Reports
          {!loading && status === "open" && reports.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
              {reports.length} open
            </span>
          )}
        </h3>
        <div className="flex gap-1">
          {["open", "all"].map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                status === s
                  ? "bg-primary-500 border-primary-500 text-white"
                  : "bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"
              }`}
            >
              {s === "open" ? "Open" : "All"}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mb-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {loading ? (
        <p className="text-sm text-slate-500 py-2">Loading...</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
          {status === "open" ? "No open reports. The house is behaving." : "No reports yet."}
        </p>
      ) : (
        <ul className="space-y-2">
          {reports.map((r) => {
            const open = expandedId === r.id;
            return (
              <li key={r.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div className="flex items-center gap-3 px-3 py-2 flex-wrap">
                  <span className="text-sm text-slate-800 dark:text-slate-200">
                    <strong>@{r.reporter_username || r.reporter_id}</strong> reported the
                    {" "}<strong>@{r.lo_username}</strong> / <strong>@{r.hi_username}</strong> conversation
                  </span>
                  <span className="text-xs text-slate-400">{fmtTime(r.created_at)}</span>
                  {r.resolved_at && (
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                      resolved
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    <button
                      onClick={() => setExpandedId(open ? null : r.id)}
                      className="px-2 py-1 text-xs text-primary-500 hover:text-primary-700 font-medium"
                    >
                      {open ? "Hide" : "View"}
                    </button>
                    {!r.resolved_at && (
                      <button
                        onClick={() => resolve(r.id)}
                        disabled={resolvingId === r.id}
                        className="px-2 py-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium disabled:opacity-50"
                      >
                        {resolvingId === r.id ? "..." : "Resolve"}
                      </button>
                    )}
                  </div>
                </div>

                {open && (
                  <div className="px-3 pb-3 border-t border-slate-100 dark:border-slate-700 pt-2 space-y-2">
                    {r.note && (
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">Reporter's note:</span> {r.note}
                      </p>
                    )}
                    {r.reported_body && (
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        <span className="font-semibold">Reported message:</span>{" "}
                        <span className="whitespace-pre-wrap">{r.reported_body}</span>
                      </p>
                    )}
                    {r.excerpt?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Recent messages in this conversation
                        </p>
                        <ul className="space-y-1">
                          {r.excerpt.map((m) => (
                            <li key={m.id} className="text-xs text-slate-600 dark:text-slate-400">
                              <span className="font-medium text-slate-800 dark:text-slate-200">@{m.sender_username}:</span>{" "}
                              <span className="whitespace-pre-wrap">{m.body}</span>{" "}
                              <span className="text-slate-400">({fmtTime(m.created_at)})</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
