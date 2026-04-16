import { getAllContentSlugs } from "@/lib/api/posts";
import { getAllPlayerSlugs } from "@/lib/api/players";
import { getAllSeasonSlugs } from "@/lib/api/seasons";
import { getFeedUpdates } from "@/lib/api/feedUpdates";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com";

export const revalidate = 3600;

const STATIC_ROUTES = [
  { path: "", changeFrequency: "daily", priority: 1.0 },
  { path: "/live-feed-updates", changeFrequency: "hourly", priority: 0.9 },
  { path: "/directory", changeFrequency: "weekly", priority: 0.8 },
  { path: "/become-supporter", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.4 },
];

async function safeList(fn) {
  try {
    const result = await fn();
    return Array.isArray(result) ? result : [];
  } catch (err) {
    console.error("sitemap fetch error:", err);
    return [];
  }
}

export default async function sitemap() {
  const now = new Date();

  const [contentSlugs, playerSlugs, seasonSlugs, feedResponse] = await Promise.all([
    safeList(getAllContentSlugs),
    safeList(getAllPlayerSlugs),
    safeList(getAllSeasonSlugs),
    (async () => {
      try {
        return await getFeedUpdates({ per_page: 200 });
      } catch {
        return { updates: [] };
      }
    })(),
  ]);

  const feedUpdates = feedResponse?.updates || feedResponse?.feed_updates || [];

  const staticEntries = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const contentEntries = contentSlugs.map((slug) => ({
    url: `${SITE_URL}/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const playerEntries = playerSlugs.map((slug) => ({
    url: `${SITE_URL}/bigbrother-players/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const seasonEntries = seasonSlugs.map((slug) => ({
    url: `${SITE_URL}/bigbrother-seasons/${slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const feedEntries = feedUpdates
    .filter((u) => u?.slug)
    .map((u) => ({
      url: `${SITE_URL}/live-feed-updates/${u.slug}`,
      lastModified: u.modified ? new Date(u.modified) : (u.date ? new Date(u.date) : now),
      changeFrequency: "daily",
      priority: 0.5,
    }));

  return [
    ...staticEntries,
    ...contentEntries,
    ...playerEntries,
    ...seasonEntries,
    ...feedEntries,
  ];
}
