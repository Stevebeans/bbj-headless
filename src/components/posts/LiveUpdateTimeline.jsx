import { getThreadUpdates } from "@/lib/api/liveThread";
import { LiveUpdateSortToggle } from "./LiveUpdateSortToggle";
import { LiveUpdatePoller } from "./LiveUpdatePoller";
import { JumpToLatestPill } from "./JumpToLatestPill";
import Image from "next/image";

/**
 * Server component: renders the timeline of feed-updates for a live thread.
 *
 * @param {{ postId: number, liveState: 'live'|'closed', closedAt: number, closingSummary: string }} props
 */
export async function LiveUpdateTimeline({ postId, liveState, closedAt, closingSummary }) {
  const { updates, thread_state } = await getThreadUpdates(postId);
  // Trust the server's view of state if it disagrees (avoids stale client state)
  const state = thread_state === "live" || thread_state === "closed" ? thread_state : liveState;

  const updateCount = updates.length;
  const newestTs = updates.length > 0 ? updateTs(updates[updates.length - 1]) : 0;

  return (
    <section
      id="live-updates"
      className="mt-6 pt-4 border-t-2 border-gray-200 dark:border-gray-700"
      data-live-state={state}
    >
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        {state === "live" ? (
          <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE
          </span>
        ) : (
          <ClosedBanner closedAt={closedAt} />
        )}
        <h2 className="font-display text-2xl md:text-3xl text-primary-500 dark:text-primary-300 font-bold">
          Live Updates
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          · {updateCount} update{updateCount === 1 ? "" : "s"}
        </span>
        {state === "live" && (
          <div className="ml-auto flex items-center gap-2">
            <LiveUpdateSortToggle />
            <span className="text-[11px] text-gray-400">Auto-updates: premium ⭐</span>
          </div>
        )}
      </div>

      {/* Optional closing recap (AI roadmap, empty for now) */}
      {state === "closed" && closingSummary && (
        <div className="mb-4 p-3 rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
          <div className="text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-1">Recap</div>
          <div
            className="text-sm text-yellow-900 dark:text-yellow-100 prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: closingSummary }}
          />
        </div>
      )}

      {/* Timeline */}
      {updateCount === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {state === "live" ? "Waiting for the first update…" : "No updates were posted in this thread."}
        </div>
      ) : (
        <ol
          className="relative pl-7 list-none m-0 p-0"
          data-sortable
        >
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-red-500 via-gray-300 to-gray-300 dark:via-gray-600 dark:to-gray-600" />
          {updates.map((u, idx) => {
            const isNewest = idx === updates.length - 1 && state === "live";
            return (
              <li key={u.id} data-ts={updateTs(u)} className="relative pb-5 list-none">
                <span
                  className={
                    "absolute -left-[22px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 " +
                    (u.breaking || isNewest
                      ? "bg-red-500 ring-2 ring-red-500/40 " + (isNewest ? "animate-pulse" : "")
                      : "bg-gray-300 dark:bg-gray-600")
                  }
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
                  {u.breaking && (
                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                      Breaking
                    </span>
                  )}
                  <time dateTime={u.date || undefined}>{formatUpdateTime(updateTs(u))}</time>
                </div>
                {u.title && (
                  <div className="font-bold text-primary-500 dark:text-primary-300 mb-1">{u.title}</div>
                )}
                {u.thumbnail && (
                  <div className="my-2">
                    <Image
                      src={u.thumbnail}
                      alt={u.title || "Feed update image"}
                      width={600}
                      height={400}
                      className="rounded-md"
                      style={{ width: "auto", height: "auto", maxWidth: "100%" }}
                    />
                  </div>
                )}
                {u.content && (
                  <div
                    className={
                      "text-sm prose prose-sm dark:prose-invert max-w-none " +
                      (isNewest ? "bg-red-50 dark:bg-red-950/30 border-l-2 border-red-500 pl-3 py-1 rounded-r" : "")
                    }
                    dangerouslySetInnerHTML={{ __html: u.content }}
                  />
                )}
              </li>
            );
          })}
        </ol>
      )}

      {/* Premium polling — initializes only when state=live AND user is supporter */}
      {state === "live" && (
        <LiveUpdatePoller postId={postId} initialLastSeen={newestTs} />
      )}

      {/* Floating jump-to-latest pill */}
      {state === "live" && updateCount > 0 && <JumpToLatestPill />}
    </section>
  );
}

function ClosedBanner({ closedAt }) {
  const dt = closedAt > 0 ? new Date(closedAt * 1000) : null;
  const label = dt
    ? dt.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : null;
  return (
    <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold px-3 py-1.5 rounded-md border-l-4 border-slate-500">
      <span>● Thread closed</span>
      {label && <span className="font-normal text-slate-500 dark:text-slate-400">{label}</span>}
    </div>
  );
}

// The API's `time` field is a display string ("3:42 pm") — the unix timestamp
// lives in `time_unix` (newer plugin) or is derivable from the ISO `date`.
function updateTs(u) {
  if (u.time_unix) return u.time_unix;
  const parsed = Date.parse(u.date);
  return Number.isNaN(parsed) ? 0 : Math.floor(parsed / 1000);
}

function formatUpdateTime(unixSeconds) {
  if (!unixSeconds) return "";
  const dt = new Date(unixSeconds * 1000);
  return dt.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
    timeZoneName: "short",
  });
}
