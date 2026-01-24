import { getPosts } from "@/lib/api/posts";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com";
const SITE_TITLE = "Big Brother Junkies";
const SITE_DESCRIPTION = "Your source for Big Brother news, spoilers, and live feed updates.";

function escapeXml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

export async function GET() {
  const posts = await getPosts({ limit: 20 });

  const rssItems = posts
    .map((post) => {
      const title = escapeXml(stripHtml(post.title));
      const description = escapeXml(stripHtml(post.excerpt));
      const link = `${SITE_URL}/${post.slug}`;
      const pubDate = new Date(post.date).toUTCString();
      const author = escapeXml(post.author?.name || "Big Brother Junkies");
      const categories = post.categories
        ?.map((cat) => `<category>${escapeXml(cat)}</category>`)
        .join("\n        ");

      return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      <author>${author}</author>
      ${categories}
      ${post.featuredImage ? `<enclosure url="${escapeXml(post.featuredImage)}" type="image/jpeg" />` : ""}
    </item>`;
    })
    .join("\n");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed" rel="self" type="application/rss+xml"/>
${rssItems}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
