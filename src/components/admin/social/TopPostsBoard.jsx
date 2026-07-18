"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getTopSocialPosts } from "@/lib/api/admin";
import QuickieCardModal from "./QuickieCardModal";

const WINDOWS = [
  { hours: 6, label: "6h" },
  { hours: 12, label: "12h" },
  { hours: 24, label: "24h" },
];

// Row totals; wpdb serializes counts as strings, so coerce.
const totalOf = (p) =>
  Number(p.likes || 0) + Number(p.reposts || 0) + Number(p.replies || 0) + Number(p.quotes || 0);

const SORTS = [
  { id: "top", label: "Top" }, // server order: likes + 2x reposts, airing-window downweight
  { id: "trending", label: "📈 Trending" }, // server: <2h old, ranked by engagement/minute
  { id: "likes", label: "♥" },
  { id: "reposts", label: "↻" },
  { id: "replies", label: "💬" },
  { id: "total", label: "Σ Total" },
];

function sortPosts(list, sort) {
  if (sort === "top" || sort === "trending") return list; // server-ordered
  const val =
    sort === "total" ? totalOf : (p) => Number(p[sort] || 0);
  return [...list].sort((a, b) => val(b) - val(a));
}

// UTC 'Y-m-d H:i:s' -> short local time.
function fmtTime(utc) {
  if (!utc) return "";
  const d = new Date(utc.replace(" ", "T") + "Z");
  if (Number.isNaN(d.getTime())) return utc;
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Pull the first attached image (fullsize) per post from Bluesky's public
// API, batched 25 URIs per getPosts call. The poller only stores text, so
// meme/screenshot posts need this hydration pass to card properly.
async function fetchEmbedImages(uris) {
  const map = {};
  for (let i = 0; i < uris.length; i += 25) {
    const batch = uris.slice(i, i + 25);
    const qs = batch.map((u) => `uris=${encodeURIComponent(u)}`).join("&");
    try {
      const res = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getPosts?${qs}`);
      const data = await res.json();
      for (const post of data.posts || []) {
        const embed = post.embed || {};
        const images =
          embed.$type === "app.bsky.embed.images#view"
            ? embed.images
            : embed.$type === "app.bsky.embed.recordWithMedia#view" &&
                embed.media?.$type === "app.bsky.embed.images#view"
              ? embed.media.images
              : null;
        if (images?.length && images[0].fullsize) {
          map[post.uri] = images[0].fullsize;
        }
      }
    } catch {
      /* board still works without thumbnails */
    }
  }
  return map;
}

const proxied = (src) => `/api/social/img?src=${encodeURIComponent(src)}`;

export default function TopPostsBoard() {
  const [hours, setHours] = useState(24);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cardPost, setCardPost] = useState(null);
  const [images, setImages] = useState({});
  const [sort, setSort] = useState("top");

  const displayed = useMemo(() => sortPosts(posts, sort), [posts, sort]);

  // Trending is a different server query (velocity over the last 2h);
  // the other sorts rearrange the fetched Top pool client-side.
  const serverSort = sort === "trending" ? "trending" : "top";

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getTopSocialPosts(hours, 25, serverSort);
      const list = res.posts || [];
      setPosts(list);
      // Hydrate attached images in the background; rows fill in as it lands.
      fetchEmbedImages(list.map((p) => p.uri).filter(Boolean)).then(setImages);
    } catch (e) {
      setError(e.message || "Failed to load top posts");
    } finally {
      setLoading(false);
    }
  }, [hours, serverSort]);

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

      <div className="flex flex-wrap items-center gap-1.5 mb-3 text-xs text-slate-400">
        <span className="mr-1">Sort:</span>
        {SORTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSort(s.id)}
            className={`px-2.5 py-1 rounded-full font-medium ${
              sort === s.id
                ? "bg-primary-500 text-white"
                : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      {loading && <p className="text-sm text-slate-500">Loading…</p>}
      {!loading && posts.length === 0 && !error && (
        <p className="text-sm text-slate-500">No posts with engagement in this window yet.</p>
      )}

      <ul className="divide-y divide-slate-100 dark:divide-slate-700">
        {displayed.map((p, i) => (
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
                ♥ {p.likes} · ↻ {p.reposts} · 💬 {p.replies} · Σ {totalOf(p)}
                {sort === "trending" && p.velocity != null && (
                  <span className="text-emerald-600 font-medium"> · 📈 {p.velocity}/min</span>
                )}
              </div>
            </div>
            {images[p.uri] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={proxied(images[p.uri])}
                alt=""
                className="shrink-0 h-12 w-12 rounded object-cover"
              />
            )}
            <button
              type="button"
              onClick={() =>
                setCardPost(images[p.uri] ? { ...p, image: proxied(images[p.uri]) } : p)
              }
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
