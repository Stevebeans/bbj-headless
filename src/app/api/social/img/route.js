import { NextResponse } from "next/server";

// Whitelisted image proxy for card sources whose CDNs lack CORS headers
// (X's pbs.twimg.com, Bluesky's cdn.bsky.app). STRICT https + host
// allowlist — this must never become an open proxy (SSRF).
const ALLOWED_HOSTS = new Set([
  "pbs.twimg.com",
  "abs.twimg.com",
  "cdn.bsky.app",
  // Own WP uploads (player photos on fan-fav snapshot cards).
  "wp.bigbrotherjunkies.com",
  "bigbrotherjunkies.com",
]);
// Instagram media (Stories inbox cards) is served from per-region subdomains
// like scontent-iad3-1.cdninstagram.com / scontent.xx.fbcdn.net. Meta-owned
// suffixes only - still not an open proxy.
const ALLOWED_SUFFIXES = [".cdninstagram.com", ".fbcdn.net"];

const isAllowedHost = (host) =>
  ALLOWED_HOSTS.has(host) || ALLOWED_SUFFIXES.some((s) => host.endsWith(s));

export async function GET(request) {
  const src = request.nextUrl.searchParams.get("src") || "";
  let target;
  try {
    target = new URL(src);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (target.protocol !== "https:" || !isAllowedHost(target.hostname)) {
    return new NextResponse(null, { status: 400 });
  }
  try {
    const img = await fetch(target.href, { cache: "no-store" });
    if (!img.ok) return new NextResponse(null, { status: 404 });
    const type = img.headers.get("content-type") || "";
    if (!type.startsWith("image/")) return new NextResponse(null, { status: 415 });
    const buf = await img.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=86400" },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
