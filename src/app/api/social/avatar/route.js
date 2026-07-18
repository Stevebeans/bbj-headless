import { NextResponse } from "next/server";

// Same-origin proxy for Bluesky avatars. cdn.bsky.app serves images with no
// CORS headers, so the quickie-card composer can neither fetch them nor let
// html-to-image rasterize them; proxying through our own origin fixes both.
// Admin-only usage (card composer), so volume is a handful of requests/day.
export async function GET(request) {
  const actor = request.nextUrl.searchParams.get("actor") || "";
  if (!/^[a-z0-9.-]{1,253}$/i.test(actor)) {
    return new NextResponse(null, { status: 400 });
  }
  try {
    const prof = await fetch(
      `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${encodeURIComponent(actor)}`,
      { cache: "no-store" }
    );
    if (!prof.ok) return new NextResponse(null, { status: 404 });
    const data = await prof.json();
    if (!data.avatar) return new NextResponse(null, { status: 404 });

    const img = await fetch(data.avatar, { cache: "no-store" });
    if (!img.ok) return new NextResponse(null, { status: 404 });
    const buf = await img.arrayBuffer();
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": img.headers.get("content-type") || "image/jpeg",
        // Browser-side caching only; avatars change rarely.
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
