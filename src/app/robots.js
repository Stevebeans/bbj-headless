export default function robots() {
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
    sitemap: "https://bigbrotherjunkies.com/sitemap.xml",
  };
}
