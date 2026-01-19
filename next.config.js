/** @type {import('next').NextConfig} */
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
    ],
  },
};

module.exports = nextConfig;
