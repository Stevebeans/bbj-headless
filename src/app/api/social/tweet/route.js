import { NextResponse } from "next/server";

// Import a single X post for the quickie-card composer via X's syndication
// endpoint — the same free, keyless source that powers X's official embed
// widgets (and this site's existing tweet embeds). Admin-only usage.
const TWEET_HOSTS = new Set(["x.com", "www.x.com", "twitter.com", "www.twitter.com", "mobile.twitter.com"]);

function tweetIdFrom(url) {
  try {
    const u = new URL(url);
    if (!TWEET_HOSTS.has(u.hostname)) return null;
    const m = u.pathname.match(/\/status(?:es)?\/(\d{5,25})/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

// Same token derivation X's own embed widgets compute client-side.
function syndicationToken(id) {
  return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, "");
}

// Normalize to the same UTC 'Y-m-d H:i:s' shape Bluesky rows use so the
// modal's existing time formatting works unchanged.
function toUtcSql(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 19).replace("T", " ");
}

const proxied = (src) => `/api/social/img?src=${encodeURIComponent(src)}`;

export async function GET(request) {
  const url = request.nextUrl.searchParams.get("url") || "";
  const id = tweetIdFrom(url);
  if (!id) {
    return NextResponse.json(
      { success: false, message: "That doesn't look like an X post URL." },
      { status: 400 }
    );
  }
  try {
    const res = await fetch(
      `https://cdn.syndication.twimg.com/tweet-result?id=${id}&token=${syndicationToken(id)}`,
      { cache: "no-store", headers: { "User-Agent": "Mozilla/5.0" } }
    );
    if (!res.ok) {
      return NextResponse.json(
        { success: false, message: `X's embed service returned ${res.status} for that post.` },
        { status: 502 }
      );
    }
    const t = await res.json();
    if (!t || t.__typename === "TweetTombstone" || !t.user) {
      return NextResponse.json(
        { success: false, message: "That post is unavailable (deleted, protected, or age-gated)." },
        { status: 404 }
      );
    }
    const photo = Array.isArray(t.photos) && t.photos.length ? t.photos[0].url : null;
    const avatar = t.user.profile_image_url_https
      ? proxied(t.user.profile_image_url_https.replace("_normal.", "_200x200."))
      : null;
    return NextResponse.json({
      success: true,
      post: {
        platform: "X",
        handle: t.user.screen_name,
        display_name: t.user.name || t.user.screen_name,
        text: t.text || "",
        posted_at: toUtcSql(t.created_at),
        avatar,
        image: photo ? proxied(photo) : null,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Couldn't reach X's embed service." },
      { status: 502 }
    );
  }
}
