"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getConductMembers } from "@/lib/api/adminConduct";

const fmtDate = (s) => (s ? new Date(s.replace(" ", "T") + "Z").toLocaleString() : "");

function ActiveBadge({ active }) {
  if (!active?.length) return null;
  const ban = active.some((a) => a.action === "ban");
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ban ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"}`}>
      {ban ? "Banned" : "Timeout"}
    </span>
  );
}

export default function ConductQueue() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (p) => {
    setLoading(true);
    setError(null);
    try {
      setData(await getConductMembers(p));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [load, page]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Conduct</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Every member report, comments and DMs together, grouped by the member reported.
        </p>
      </div>
      {error && <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">{error}</div>}
      {loading ? (
        <div className="py-12 text-center text-gray-500">Loading...</div>
      ) : !data?.members?.length ? (
        <div className="py-12 text-center text-gray-500">No reported members. Quiet house.</div>
      ) : (
        <div className="space-y-3">
          {data.members.map((m) => (
            <Link key={m.user.id} href={`/admin/conduct/${m.user.id}`}
              className="flex items-center gap-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-500 transition-colors">
              {m.user.avatar ? (
                <img src={m.user.avatar} alt="" className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{m.user.name}</span>
                  <ActiveBadge active={m.active} />
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {m.comment_reports > 0 && <span>{m.comment_reports} comment {m.comment_reports === 1 ? "report" : "reports"}</span>}
                  {m.comment_reports > 0 && m.dm_reports > 0 && <span> · </span>}
                  {m.dm_reports > 0 && <span>{m.dm_reports} DM {m.dm_reports === 1 ? "report" : "reports"}</span>}
                  <span> · last {fmtDate(m.last_report_at)}</span>
                </div>
              </div>
              {m.open_reports > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm font-semibold">
                  {m.open_reports} open
                </span>
              )}
              {m.action_count > 0 && (
                <span className="text-xs text-gray-400">{m.action_count} past {m.action_count === 1 ? "action" : "actions"}</span>
              )}
            </Link>
          ))}
        </div>
      )}
      {data?.pagination?.total_pages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: data.pagination.total_pages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)}
              className={`px-3 py-1.5 rounded ${page === i + 1 ? "bg-primary-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300"}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
