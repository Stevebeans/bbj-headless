/** @type {import('next').NextConfig} */
// Build config for BBJ Next.js app
const nextConfig = {
  // Increase timeout for static page generation (default is 60s)
  staticPageGenerationTimeout: 120,
  async rewrites() {
    // Proxy WP media/assets through the apex so legacy absolute URLs
    // (https://bigbrotherjunkies.com/wp-content/...) keep working after the DNS flip.
    return [
      {
        source: "/wp-content/:path*",
        destination: "https://wp.bigbrotherjunkies.com/wp-content/:path*",
      },
      {
        source: "/wp-includes/:path*",
        destination: "https://wp.bigbrotherjunkies.com/wp-includes/:path*",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/bigbrother-players",
        destination: "/directory",
        permanent: true,
      },
      {
        source: "/bigbrother-seasons",
        destination: "/directory",
        permanent: true,
      },
      {
        source: "/live-feed-archives",
        destination: "/live-feed-updates",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  images: {
    unoptimized: true, // Images served directly from Cloudflare/origin CDNs — no Vercel transformations
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bigbrotherjunkies.com",
      },
      {
        protocol: "https",
        hostname: "stg-wp.bigbrotherjunkies.com",
      },
      {
        protocol: "http",
        hostname: "bbj.localhost",
      },
      {
        protocol: "https",
        hostname: "*.gravatar.com",
      },
      {
        protocol: "https",
        hostname: "secure.gravatar.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "static.wikia.nocookie.net",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
    ],
  },
};

module.exports = nextConfig;
