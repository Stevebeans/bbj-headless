/**
 * Image proxy to bypass hotlink protection
 * Fetches external images server-side and returns them
 */

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new Response("Missing url parameter", { status: 400 });
  }

  try {
    // Validate URL is from allowed domains
    const url = new URL(imageUrl);
    const allowedDomains = [
      "static.wikia.nocookie.net",
      "upload.wikimedia.org",
      "vignette.wikia.nocookie.net",
    ];

    if (!allowedDomains.some(domain => url.hostname.includes(domain))) {
      return new Response("Domain not allowed", { status: 403 });
    }

    // Fetch the image server-side (no Referer header issues)
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "BBJ-PlayerPhotos/1.0 (bigbrotherjunkies.com)",
      },
    });

    if (!response.ok) {
      return new Response(`Failed to fetch image: ${response.status}`, { status: response.status });
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Return the image with caching headers
    return new Response(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return new Response("Failed to proxy image", { status: 500 });
  }
}
