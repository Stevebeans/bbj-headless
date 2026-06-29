import { SITE_URL, IS_PROD } from "@/lib/seo";

export default function robots() {
  // Staging/preview/localhost: block everything so search engines never index
  // a non-prod mirror that competes with the real site for the same content.
  if (!IS_PROD) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/settings",
          "/login",
          "/register",
          "/reset-password",
          "/compare/",
          "/search",
          "/bigbrother-seasons/*/edit",
          "/bigbrother-players/*/edit",
        ],
      },
      // Block SEO/backlink scrapers that deep-crawl the whole 17.5K-page archive and
      // run up Vercel render cost for zero value to us. (These honor robots.txt.)
      ...BLOCKED_BOTS.map((bot) => ({ userAgent: bot, disallow: "/" })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

// Non-search crawlers we don't want walking the site (backlink/SEO data scrapers).
const BLOCKED_BOTS = [
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "DataForSeoBot",
  "BLEXBot",
];
