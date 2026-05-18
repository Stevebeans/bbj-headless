import { NextResponse } from "next/server";
import { getCurrentSeasonPlayers } from "@/lib/api/players";

// Edge-cached endpoint so client-side spoiler-bar fetches don't burn a
// function invocation per visit. Webhook revalidation flows through the
// `spoiler-bar` tag on the underlying bbjdFetch in getCurrentSeasonPlayers
// — pages no longer carry that tag dependency, so player/season edits
// won't cascade-invalidate post or feed-update pages anymore.
export const dynamic = "force-static";
export const revalidate = false;

export async function GET() {
  const data = await getCurrentSeasonPlayers({ size: "bbj_v2_spoiler_bar" });
  return NextResponse.json(data);
}
