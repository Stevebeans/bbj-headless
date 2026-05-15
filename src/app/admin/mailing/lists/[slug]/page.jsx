"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { getListSubscribers, getListProblems } from "@/lib/api/mailing";
import ProblemCallout from "@/components/mailing/ProblemCallout";
import SubscribersTable from "@/components/mailing/SubscribersTable";
import BulkActionBar from "@/components/mailing/BulkActionBar";

const TIMEFRAMES = [
  { value: "all", label: "All time" },
  { value: "90d", label: "Last 90 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "7d", label: "Last 7 days" },
];

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "subscribed", label: "Subscribed" },
  { value: "unconfirmed", label: "Unconfirmed" },
  { value: "unsubscribed", label: "Unsubscribed" },
  { value: "complained", label: "Complained" },
];

const FLAGS = [
  { value: "", label: "Show all" },
  { value: "hard_bounced", label: "Hard bounced" },
  { value: "soft_bouncing", label: "Soft bouncing" },
  { value: "never_opened", label: "Never opened" },
  { value: "dormant", label: "Dormant" },
];

export default function ListDetailPage({ params }) {
  const { slug } = use(params);

  const [problemsData, setProblemsData] = useState(null);
  const [subsData, setSubsData] = useState(null);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [error, setError] = useState(null);

  const [timeframe, setTimeframe] = useState("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [flagFilter, setFlagFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchProblems = useCallback(async () => {
    try {
      const res = await getListProblems(slug);
      setProblemsData(res);
    } catch (err) {
      setError(err.message);
    }
  }, [slug]);

  const fetchSubs = useCallback(async () => {
    setLoadingSubs(true);
    try {
      const res = await getListSubscribers(slug, {
        page,
        perPage,
        status: statusFilter,
        search,
        timeframe,
        flag: flagFilter,
      });
      setSubsData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingSubs(false);
    }
  }, [slug, page, perPage, statusFilter, search, timeframe, flagFilter]);

  useEffect(() => { fetchProblems(); }, [fetchProblems]);
  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  const refreshAll = () => {
    fetchProblems();
    fetchSubs();
    setSelectedIds([]);
  };

  const toggleId = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const togglePage = (pageIds, select) => {
    setSelectedIds((prev) => {
      if (select) return Array.from(new Set([...prev, ...pageIds]));
      return prev.filter((id) => !pageIds.includes(id));
    });
  };

  const handleFilterByFlag = (flag) => {
    setFlagFilter(flag);
    setPage(1);
    setSelectedIds([]);
  };

  const subs = subsData?.subscribers || [];
  const total = subsData?.total || 0;
  const totalPages = subsData?.total_pages || 1;
  const list = problemsData?.list;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <Link href="/admin/mailing/lists" className="text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
            &larr; All lists
          </Link>
          <h1 className="text-2xl font-osw font-bold text-slate-800 dark:text-white mt-1">
            {list?.name || slug}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <span className="font-mono">{slug}</span> · {new Intl.NumberFormat().format(total)} subscribers
          </p>
        </div>
        <button
          type="button"
          onClick={refreshAll}
          className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <ProblemCallout
        summary={problemsData?.summary}
        byCategory={problemsData?.by_category}
        onActionComplete={refreshAll}
        onFilterByFlag={handleFilterByFlag}
      />

      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="flex flex-col text-xs">
          <span className="uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Timeframe</span>
          <select
            value={timeframe}
            onChange={(e) => { setTimeframe(e.target.value); setPage(1); }}
            className="px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
          >
            {TIMEFRAMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col text-xs">
          <span className="uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
          >
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col text-xs">
          <span className="uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Flag</span>
          <select
            value={flagFilter}
            onChange={(e) => { setFlagFilter(e.target.value); setPage(1); }}
            className="px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
          >
            {FLAGS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col text-xs">
          <span className="uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Search email</span>
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="part of an email…"
            className="px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
          />
        </label>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <SubscribersTable
        subscribers={subs}
        loading={loadingSubs}
        selectedIds={selectedIds}
        onToggleId={toggleId}
        onTogglePage={togglePage}
        onRowActionComplete={refreshAll}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 text-sm text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span>Page size</span>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
          >
            {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Prev
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Next
          </button>
        </div>
      </div>

      <BulkActionBar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onActionComplete={refreshAll}
      />
    </div>
  );
}
