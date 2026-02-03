export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/settings", "/login", "/reset-password"],
      },
    ],
    sitemap: "https://bigbrotherjunkies.com/sitemap.xml",
  };
}
