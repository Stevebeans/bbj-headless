import { NextResponse } from "next/server";

// Whitelisted image proxy for card sources whose CDNs lack CORS headers
// (X's pbs.twimg.com, Bluesky's cdn.bsky.app). STRICT https + host
// allowlist — this must never become an open proxy (SSRF).
const ALLOWED_HOSTS = new Set(["pbs.twimg.com", "abs.twimg.com", "cdn.bsky.app"]);

export async function GET(request) {
  const src = request.nextUrl.searchParams.get("src") || "";
  let target;
  try {
    target = new URL(src);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
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
