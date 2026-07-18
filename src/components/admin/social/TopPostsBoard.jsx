"use client";

import { useCallback, useEffect, useState } from "react";
import { getTopSocialPosts } from "@/lib/api/admin";
import QuickieCardModal from "./QuickieCardModal";

const WINDOWS = [
  { hours: 6, label: "6h" },
  { hours: 12, label: "12h" },
  { hours: 24, label: "24h" },
];

// UTC 'Y-m-d H:i:s' -> short local time.
function fmtTime(utc) {
  if (!utc) return "";
  const d = new Date(utc.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return utc;
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function TopPostsBoard() {
  const [hours, setHours] = useState(24);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardPost, setCardPost] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTopSocialPosts(hours);
      setPosts(res.posts || []);
    } catch (e) {
      setError(e.message || "Failed to load top posts");
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          🔥 Top Posts
        </h2>
        <div className="flex items-center gap-2">
          {WINDOWS.map((w) => (
            <button
              key={w.hours}
              type="button"
              onClick={() => setHours(w.hours)}
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                hours === w.hours
                  ? "bg-primary-500 text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              {w.label}
            </button>
          ))}
          <button
            type="button"
            onClick={load}
            className="px-3 py-1 rounded-full text-sm bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
          >
            ↻
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {!loading && posts.length === 0 && !error && (
        <p className="text-sm text-slate-500">No posts with engagement in this window yet.</p>
      )}

      <ul className="divide-y divide-slate-100 dark:divide-slate-700">
        {posts.map((p, i) => (
          <li key={p.id} className="py-3 flex items-start gap-3">
            <span className="w-6 shrink-0 text-right text-sm font-bold text-slate-400">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 text-sm">
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {p.display_name || p.handle}
                </span>
                <span className="text-slate-400">@{p.handle}</span>
                <span className="text-slate-400">· {fmtTime(p.posted_at)}</span>
                {p.source === "trusted" && (
                  <span className="text-[10px] font-bold uppercase text-emerald-600">trusted</span>
                )}
                {p.in_airing_window && (
                  <span
                    className="text-xs"
                    title="Posted during a CBS airing window - may be episode reaction, downweighted"
                  >
                    📺
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap break-words">
                {p.text}
              </p>
              <div className="mt-1 text-xs text-slate-400">
                ♥ {p.likes} · ↻ {p.reposts} · 💬 {p.replies}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCardPost(p)}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
            >
              FB Card
            </button>
          </li>
        ))}
      </ul>

      {cardPost && <QuickieCardModal post={cardPost} onClose={() => setCardPost(null)} />}
    </section>
  );
}
