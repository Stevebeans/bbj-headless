import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * On-demand revalidation webhook endpoint
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
    const { secret, type, slug, path, tag } = body;

    // Verify secret
    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json(
        { error: "Invalid secret" },
        { status: 401 }
      );
    }

    // Revalidate by tag if provided
    if (tag) {
      revalidateTag(tag);
      return NextResponse.json({
        revalidated: true,
        type: "tag",
        tag,
      });
    }

    // Revalidate by path if provided
    if (path) {
      revalidatePath(path);
      return NextResponse.json({
        revalidated: true,
        type: "path",
        path,
      });
    }

    // Revalidate by content type
    switch (type) {
      case "post":
        if (slug) {
          revalidatePath(`/posts/${slug}`);
        }
        revalidatePath("/");
        revalidateTag("posts");
        break;

      case "spoiler-bar":
        revalidateTag("spoiler-bar");
        revalidatePath("/");
        break;

      case "feed-update":
        revalidateTag("feed-updates");
        revalidatePath("/feed-updates");
        revalidatePath("/");
        break;

      case "comment":
        if (slug) {
          revalidatePath(`/posts/${slug}`);
          revalidateTag(`post-${slug}`);
        }
        break;

      case "player":
        revalidateTag("players");
        if (slug) {
          revalidatePath(`/players/${slug}`);
        }
        revalidatePath("/players");
        break;

      case "all":
        revalidatePath("/", "layout");
        break;

      default:
        return NextResponse.json(
          { error: "Invalid type" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      revalidated: true,
      type,
      slug,
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
    return NextResponse.json({ revalidated: true, path });
  }

  return NextResponse.json(
    { error: "Provide path or tag parameter" },
    { status: 400 }
  );
}
