import { SpoilerBar } from "./SpoilerBar";

/**
 * SSR shell that reserves space for the client-fetched spoiler bar.
 *
 * The actual data fetch happens client-side via /api/spoiler-bar so that
 * pages using this wrapper aren't tagged with `spoiler-bar` at the SSR
 * cache layer. Without this, every player/season edit's webhook would
 * cascade-invalidate the page cache for every route that renders the bar
 * (homepage, post pages, feed-update detail, etc.) — the cause of the
 * 7:1 write/read ratio on /live-feed-updates/[slug].
 *
 * Reserved height matches SpoilerBar's banner (18) + image (56/80) + name
 * (18) + py-1 (8) so the bar can't shift <main> when it hydrates.
 */
export function SpoilerBarWrapper() {
  return (
    <div className="min-h-[100px] lg:min-h-[124px]">
      <SpoilerBar />
    </div>
  );
}
