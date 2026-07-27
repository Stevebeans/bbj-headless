import { getPosts } from "@/lib/api/posts";
import { SITE_URL } from "@/lib/seo";

/**
 * Google News sitemap — posts published in the last 48 hours only (per the
 * News sitemap spec; Google ignores older entries). This is what gets a fresh
 * spoiler article indexed in minutes instead of hours for Top Stories.
 *
 * Freshness path: the inner posts fetch is webhook-fresh (revalidateTag on
 * publish), which also marks this route stale, so a new post appears here on
 * the next request. The 300s revalidate is a safety floor for missed webhooks.
 * CF must serve this with a SHORT edge TTL — the sitemap cache rule, not the
 * 30-day archive rule.
 */
export const revalidate = 300;

const XML_ESCAPES = { "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" };
const escapeXml = (s) => String(s).replace(/[<>&'"]/g, (c) => XML_ESCAPES[c]);

export async function GET() {
  // 30 = the posts endpoint's per_page cap; far more than 48h of output.
  const posts = await getPosts({ limit: 30 });

  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const recent = (posts || []).filter((p) => {
    if (!p?.slug || !p?.date) return false;
    const t = new Date(p.date).getTime();
    return !Number.isNaN(t) && t >= cutoff;
  });

  const urls = recent
    .map(
      (p) => `  <url>
    <loc>${SITE_URL}/${escapeXml(p.slug)}</loc>
    <news:news>
      <news:publication>
        <news:name>Big Brother Junkies</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${escapeXml(p.date)}</news:publication_date>
      <news:title>${escapeXml(p.title || "")}</news:title>
    </news:news>
  </url>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
