/** @type {import('next').NextConfig} */
// Build config for BBJ Next.js app
const nextConfig = {
  // Increase timeout for static page generation (default is 60s)
  staticPageGenerationTimeout: 120,
  images: {
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
