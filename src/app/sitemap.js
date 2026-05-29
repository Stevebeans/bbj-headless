import { getAllContentSlugs } from "@/lib/api/posts";
import { getAllPlayerSlugs } from "@/lib/api/players";
import { getAllSeasonSlugs } from "@/lib/api/seasons";
import {
  getFeedUpdatesCount,
  getFeedUpdateSitemapEntries,
} from "@/lib/api/feedUpdates";
import { SITE_URL } from "@/lib/seo";

export const revalidate = 3600;

// Feed updates are ~14k URLs — far past what belongs in one fetch. Shard them so
// each /sitemap/N.xml fetches + caches its own slice (Next emits a sitemap index
// at /sitemap.xml). Shard 0 = core content (static + posts + players + seasons);
// shards 1..N = feed-update windows.
const FEED_SHARD_SIZE = 5000;

async function safeList(fn) {
  try {
    const result = await fn();
    return Array.isArray(result) ? result : [];
  } catch (err) {
    console.error("sitemap fetch error:", err);
    return [];
  }
}

// Only attach lastModified when we have a REAL timestamp. Google ignores a
// sitemap's lastmod entirely if it looks fabricated (e.g. always "now"), so
// entries without a known modified date carry no lastModified at all.
function withLastMod(base, modified) {
  if (!modified) return base;
  const d = new Date(modified);
  return Number.isNaN(d.getTime()) ? base : { ...base, lastModified: d };
}

export async function generateSitemaps() {
  const total = await getFeedUpdatesCount();
  const feedShards = Math.max(1, Math.ceil(total / FEED_SHARD_SIZE));
  // id 0 = core, ids 1..feedShards = feed windows
  return Array.from({ length: feedShards + 1 }, (_, i) => ({ id: i }));
}

async function coreSitemap() {
  const [contentSlugs, playerSlugs, seasonSlugs] = await Promise.all([
    safeList(getAllContentSlugs), // [{ slug, modified }]
    safeList(getAllPlayerSlugs), // [slug]  (API has no per-item modified)
    safeList(getAllSeasonSlugs), // [slug]
  ]);

  const staticEntries = [
    { path: "", changeFrequency: "daily", priority: 1.0 },
    { path: "/live-feed-updates", changeFrequency: "hourly", priority: 0.9 },
    { path: "/directory", changeFrequency: "weekly", priority: 0.8 },
    { path: "/become-supporter", changeFrequency: "monthly", priority: 0.6 },
    { path: "/contact", changeFrequency: "yearly", priority: 0.4 },
  ].map((r) => ({
    url: `${SITE_URL}${r.path}`,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const contentEntries = contentSlugs.map((c) =>
    withLastMod(
      { url: `${SITE_URL}/${c.slug}`, changeFrequency: "weekly", priority: 0.7 },
      c.modified
    )
  );

  const playerEntries = playerSlugs.map((slug) => ({
    url: `${SITE_URL}/bigbrother-players/${slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const seasonEntries = seasonSlugs.map((slug) => ({
    url: `${SITE_URL}/bigbrother-seasons/${slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...contentEntries, ...playerEntries, ...seasonEntries];
}

async function feedSitemap(shardIndex) {
  const offset = (shardIndex - 1) * FEED_SHARD_SIZE;
  const entries = await getFeedUpdateSitemapEntries({ offset, limit: FEED_SHARD_SIZE });
  return entries.map((u) =>
    withLastMod(
      {
        url: `${SITE_URL}/live-feed-updates/${u.slug}`,
        changeFrequency: "daily",
        priority: 0.5,
      },
      u.modified
    )
  );
}

export default async function sitemap({ id }) {
  return id === 0 ? coreSitemap() : feedSitemap(id);
}
