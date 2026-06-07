export default function manifest() {
  return {
    name: "Big Brother Junkies",
    short_name: "BBJ",
    description: "Big Brother spoilers, live feed updates, and player stats.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#35546e",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      // Stopgap: using icon-512.png for maskable until a proper safe-zone icon is created.
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
