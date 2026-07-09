import { getThreadUpdates } from "@/lib/api/liveThread";
import { LiveUpdateSortToggle } from "./LiveUpdateSortToggle";
import { LiveUpdatePoller } from "./LiveUpdatePoller";
import { JumpToLatestPill } from "./JumpToLatestPill";
import { isFreshUpdate } from "@/lib/feedUpdatesLive";
import Image from "next/image";
import Link from "next/link";

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
        <ol className="list-none m-0 p-0" data-sortable>
          {updates.map((u, idx) => {
            const isNewest = idx === updates.length - 1 && state === "live";
            const fresh = isFreshUpdate(u.modified || u.date);
            const body = u.content || u.raw_content;
            return (
              <li key={u.id} data-ts={updateTs(u)} className="list-none">
                {/* Mirrors the homepage FeedUpdateCard layout: time rail + dot + card */}
                <article id={u.slug} className="group flex gap-4 py-4">
                  <div className="hidden sm:block w-20 shrink-0 text-right">
                    <time
                      dateTime={u.modified || u.date}
                      className={`block font-osw text-sm ${fresh ? "text-red-500" : "text-gray-900 dark:text-gray-200"}`}
                    >
                      {formatUpdateTime(updateTs(u))}
                    </time>
                    <div
                      className={`text-[11px] ${fresh ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}
                      data-nosnippet
                    >
                      {u.time_ago}
                    </div>
                  </div>

                  <div className="relative flex-shrink-0">
                    <span
                      className={
                        "block w-3 h-3 rounded-full mt-1.5 " +
                        (u.breaking || isNewest
                          ? "bg-red-500 ring-2 ring-red-500/40 " + (isNewest ? "animate-pulse" : "")
                          : "bg-gray-400 dark:bg-gray-500")
                      }
                      aria-hidden="true"
                    />
                  </div>

                  <div className="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
                    <div className="sm:hidden text-xs mb-1 flex items-center gap-2">
                      <time
                        dateTime={u.modified || u.date}
                        className={fresh ? "text-red-500" : "text-gray-500 dark:text-gray-400"}
                      >
                        {formatUpdateTime(updateTs(u))}
                      </time>
                    </div>
                    {u.breaking && (
                      <span className="inline-block bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide mb-2">
                        Breaking
                      </span>
                    )}
                    {u.title && (
                      <h3 className="font-display text-lg md:text-xl leading-snug mb-2 text-primary-500 dark:text-secondary-500">
                        <Link
                          href={`/live-feed-updates/${u.slug}`}
                          className="hover:text-primary-600 dark:hover:text-secondary-400"
                        >
                          {u.title}
                        </Link>
                      </h3>
                    )}
                    {body && (
                      <div
                        className="text-sm text-gray-700 dark:text-gray-300 mb-3 feed-content"
                        dangerouslySetInnerHTML={{ __html: body }}
                      />
                    )}
                    {u.thumbnail && (
                      <div className="mb-3 w-[90%] md:max-w-[75%] mx-auto">
                        <Image
                          src={u.thumbnail}
                          alt={u.title || "Big Brother feed update"}
                          width={800}
                          height={533}
                          sizes="(min-width: 768px) 45vw, 90vw"
                          className="rounded-lg w-full h-auto"
                        />
                      </div>
                    )}
                  </div>
                </article>
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

// BB time (PT), same format as the homepage feed cards
function formatUpdateTime(unixSeconds) {
  if (!unixSeconds) return "";
  const dt = new Date(unixSeconds * 1000);
  return dt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Los_Angeles",
  });
}
