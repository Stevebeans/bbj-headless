import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * On-demand revalidation webhook endpoint
 *
 * Invalidates both Next.js ISR (Vercel) AND Cloudflare's edge cache for the
 * affected URLs. Without the CF purge, Vercel rebuilds in seconds but users
 * keep seeing stale HTML until CF's edge TTL expires.
 *
 * Called from WordPress when content changes:
 * - Post published/updated
 * - Spoiler bar updated
 * - Comment posted
 * - Feed update posted
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { secret, type, slug, path, tag, postId } = body;

    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json(
        { error: "Invalid secret" },
        { status: 401 }
      );
    }

    if (tag) {
      revalidateTag(tag);
      return NextResponse.json({
        revalidated: true,
        type: "tag",
        tag,
      });
    }

    if (path) {
      revalidatePath(path);
      await purgeCloudflare([path]);
      return NextResponse.json({
        revalidated: true,
        type: "path",
        path,
      });
    }

    const cfPurgePaths = [];
    let cfPurgeAll = false;

    switch (type) {
      case "post":
        if (slug) {
          revalidatePath(`/${slug}`);
          revalidateTag(`post-${slug}`);
          cfPurgePaths.push(`/${slug}`);
        }
        revalidatePath("/");
        revalidateTag("posts");
        cfPurgePaths.push("/");
        break;

      case "spoiler-bar":
        revalidateTag("spoiler-bar");
        revalidateTag("houseboard");
        revalidateTag("season-stats");
        revalidatePath("/");
        cfPurgePaths.push("/");
        break;

      case "feed-update":
        revalidateTag("feed-updates");
        if (slug) {
          revalidateTag(`feed-update-${slug}`);
          cfPurgePaths.push(`/live-feed-updates/${slug}`);
        }
        revalidatePath("/live-feed-updates");
        revalidatePath("/");
        cfPurgePaths.push("/live-feed-updates", "/");
        break;

      case "comment":
        revalidateTag("comments");
        if (slug) {
          revalidatePath(`/${slug}`);
          revalidateTag(`post-${slug}`);
          cfPurgePaths.push(`/${slug}`);
        }
        break;

      case "player":
        revalidateTag("players");
        revalidateTag("season-stats");
        revalidateTag("houseboard");
        if (slug) {
          revalidatePath(`/bigbrother-players/${slug}`);
          revalidateTag(`player-${slug}`);
          cfPurgePaths.push(`/bigbrother-players/${slug}`);
        }
        revalidatePath("/bigbrother-players");
        cfPurgePaths.push("/bigbrother-players");
        break;

      case "season":
        revalidateTag("seasons");
        if (slug) {
          revalidatePath(`/bigbrother-seasons/${slug}`);
          revalidatePath(`/bigbrother-seasons/${slug}/edit`);
          revalidateTag(`season-${slug}`);
          cfPurgePaths.push(`/bigbrother-seasons/${slug}`);
        }
        revalidatePath("/bigbrother-seasons");
        revalidateTag("spoiler-bar");
        cfPurgePaths.push("/bigbrother-seasons");
        break;

      case "ad-scripts":
        revalidateTag("ad-scripts");
        break;

      case "ad-settings":
        revalidateTag("ad-settings");
        break;

      case "live-thread-state":
        // Open / close / take-over: layout-level chrome needs to flip.
        revalidateTag("live-thread-active");
        revalidatePath("/", "layout");
        if (slug) {
          revalidatePath(`/${slug}`);
          revalidateTag(`live-thread-${postId || slug}`);
          cfPurgePaths.push(`/${slug}`);
        }
        revalidatePath("/");
        cfPurgePaths.push("/");
        break;

      case "live-thread-update":
        // New feed-update in an active thread: only that thread's page needs to update.
        if (postId) {
          revalidateTag(`live-thread-${postId}`);
        }
        if (slug) {
          revalidatePath(`/${slug}`);
          cfPurgePaths.push(`/${slug}`);
        }
        break;

      case "all":
        revalidatePath("/", "layout");
        cfPurgeAll = true;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid type" },
          { status: 400 }
        );
    }

    if (cfPurgeAll) {
      await purgeCloudflare("all");
    } else if (cfPurgePaths.length > 0) {
      await purgeCloudflare(cfPurgePaths);
    }

    // Keep "Ask the Bean"'s knowledge fresh (best-effort; never block revalidation).
    // No-ops if Upstash env vars are absent (e.g. previews without the index configured).
    try {
      if (type === "post" && slug && process.env.UPSTASH_VECTOR_REST_URL) {
        const { reindexPostBySlug } = await import("@/lib/bean/reindexOne.js");
        await reindexPostBySlug(slug);
      }
    } catch (e) {
      console.error("[bean] reindex on publish failed:", e?.message);
    }

    return NextResponse.json({
      revalidated: true,
      type,
      slug,
      cf_purged: cfPurgeAll ? "all" : cfPurgePaths,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Revalidation error:", error);
    return NextResponse.json(
      { error: "Revalidation failed" },
      { status: 500 }
    );
  }
}

/**
 * Purge URLs from Cloudflare's edge cache. Silently no-ops if env vars are
 * missing (local dev, preview deploys without CF in front). Failures are
 * logged but don't break the revalidation flow — the Vercel revalidate
 * already succeeded; worst case is stale-on-CF until natural TTL.
 *
 * @param {string[] | "all"} target  Array of paths/URLs, or "all" for purge_everything
 */
/**
 * Production apex — hardcoded because this is the only CF-proxied host on the
 * zone. Using process.env.NEXT_PUBLIC_SITE_URL here would break: preview
 * deploys set that to staging.bigbrotherjunkies.com which is DNS-only / not
 * CF-cached, so purges would silently no-op against the wrong host.
 */
const CF_PURGE_BASE_URL = "https://bigbrotherjunkies.com";

async function purgeCloudflare(target) {
  const token = process.env.CLOUDFLARE_PURGE_TOKEN;
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  if (!token || !zoneId) return;

  const body =
    target === "all"
      ? { purge_everything: true }
      : {
          files: [...new Set(target)].map((p) =>
            p.startsWith("http") ? p : `${CF_PURGE_BASE_URL}${p}`
          ),
        };

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      console.error(`[CF Purge] HTTP ${res.status}: ${err}`);
    }
  } catch (err) {
    console.error("[CF Purge] error:", err.message);
  }
}

// GET for simple testing
export async function GET(request) {
  const searchParams = request.nextUrl.searchParams;
  const secret = searchParams.get("secret");
  const path = searchParams.get("path");
  const tag = searchParams.get("tag");

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json(
      { error: "Invalid secret" },
      { status: 401 }
    );
  }

  if (tag) {
    revalidateTag(tag);
    return NextResponse.json({ revalidated: true, tag });
  }

  if (path) {
    revalidatePath(path);
    await purgeCloudflare([path]);
    return NextResponse.json({ revalidated: true, path });
  }

  return NextResponse.json(
    { error: "Provide path or tag parameter" },
    { status: 400 }
  );
}
