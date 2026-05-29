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
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
