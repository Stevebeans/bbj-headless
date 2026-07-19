"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/api/admin";

function fmtWhen(mysql) {
  if (!mysql) return "";
  const d = new Date(mysql.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return mysql;
  return d.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/**
 * What are members actually asking the Bean? Questions only (answers are
 * never logged). Product research + FAQ mining for the shared facts sheet.
 */
export default function BeanPromptsViewer() {
  const [prompts, setPrompts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await adminFetch(`/bean/prompts?page=${page}`);
      setPrompts(res.prompts || []);
      setTotal(res.total || 0);
    } catch (e) {
      setError(e.message || "Failed to load prompts");
    }
  }, [page]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">💬 Bean Questions</h2>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <span>{total} total</span>
          <button
            type="button"
            onClick={load}
            className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
          >
            ↻
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-400 mb-3">
        What members ask the Bean (questions only). Spot recurring ones and add answers to the
        shared facts sheet above.
      </p>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
      {!error && prompts.length === 0 && (
        <p className="text-sm text-slate-500">No questions logged yet - they start recording from tonight's deploy.</p>
      )}

      <ul className="divide-y divide-slate-100 dark:divide-slate-700">
        {prompts.map((p) => (
          <li key={p.id} className="py-2">
            <span className="text-sm text-slate-800 dark:text-slate-100">{p.question}</span>
            <span className="ml-2 text-xs text-slate-400">
              {p.display_name || `user ${p.user_id}`} · {fmtWhen(p.created_at)}
            </span>
          </li>
        ))}
      </ul>

      {total > 50 && (
        <div className="mt-3 flex items-center gap-2 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40"
          >
            ← Newer
          </button>
          <button
            type="button"
            disabled={page * 50 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40"
          >
            Older →
          </button>
        </div>
      )}
    </section>
  );
}
