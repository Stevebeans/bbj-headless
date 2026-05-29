import { getAllContentSlugs } from "@/lib/api/posts";
import { getAllPlayerSlugs } from "@/lib/api/players";
import { getAllSeasonSlugs } from "@/lib/api/seasons";
import { getAllFeedUpdateSitemapEntries } from "@/lib/api/feedUpdates";
import { SITE_URL } from "@/lib/seo";

// Sitemap revalidates every 6h — content URLs don't need minute-fresh listing,
// and this fetches ~17k URLs across posts/players/seasons/feed, so we avoid
// re-running it hourly. Served ISR-cached; regeneration runs in the background.
export const revalidate = 21600;

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

export default async function sitemap() {
  const [contentSlugs, playerSlugs, seasonSlugs, feedEntries] = await Promise.all([
    safeList(getAllContentSlugs), // [{ slug, modified }]
    safeList(getAllPlayerSlugs), // [slug]  (API has no per-item modified)
    safeList(getAllSeasonSlugs), // [slug]
    safeList(getAllFeedUpdateSitemapEntries), // [{ slug, modified }]
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

  const feedSitemapEntries = feedEntries.map((u) =>
    withLastMod(
      {
        url: `${SITE_URL}/live-feed-updates/${u.slug}`,
        changeFrequency: "daily",
        priority: 0.5,
      },
      u.modified
    )
  );

  return [
    ...staticEntries,
    ...contentEntries,
    ...playerEntries,
    ...seasonEntries,
    ...feedSitemapEntries,
  ];
}
