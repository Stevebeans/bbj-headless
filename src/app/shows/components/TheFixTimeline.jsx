"use client";

import { Fragment, useState, useCallback, useRef, useEffect } from "react";
import { getFeedUpdates } from "@/lib/api/feedUpdates";
import { FeedHubUpdateCard } from "@/app/live-feed-updates/components/FeedHubUpdateCard";
import { FreestarSlot } from "@/components/ads/FreestarSlot";
import { dateKey, dayLabel, shortDate } from "@/app/live-feed-updates/components/feedHubName";
import { Torch } from "./ShowArt";
import "../../live-feed-updates/feed-hub.css";

const PER_PAGE = 20;
// Same ad-weave cadence as the BB Feed Hub thread (FeedHubThread.jsx):
// one slot every AD_EVERY cards, capped at AD_MAX per page load.
const AD_EVERY = 8;
const AD_MAX = 4;

/**
 * The Fix — cross-show timeline. A trimmed-down FeedHubThread: no mode tabs,
 * no search/sort (newest only), no live polling (Survivor cadence doesn't
 * need 60s polling; "Load newer" is just a page refresh — YAGNI for Phase 1).
 *
 * `show` is forwarded verbatim to the API: "any" on the /shows hub,
 * "survivor" (or another show slug) on a single-show page.
 */
export function TheFixTimeline({ show }) {
  const [rows, setRows] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const reqId = useRef(0);

  const fetchPage = useCallback(async (offset) => {
    const id = ++reqId.current;
    setLoading(true);
    try {
      const data = await getFeedUpdates({ perPage: PER_PAGE, offset, sort: "newest", show });
      if (id !== reqId.current) return; // stale response guard
      setError(false);
      setRows((prev) => (offset === 0 ? data.updates || [] : [...prev, ...(data.updates || [])]));
      setHasMore(!!data.has_more);
    } catch {
      if (id === reqId.current) setError(true);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [show]);

  // Initial fetch + re-fetch from the top whenever `show` changes.
  useEffect(() => {
    setRows([]);
    setError(false);
    fetchPage(0);
  }, [fetchPage]);

  // The poster's own new update shows up instantly (FloatingUpdater fires this).
  // "any" = the cross-show hub: any show-tagged update; else an exact show match.
  useEffect(() => {
    const onCreated = (e) => {
      const u = e.detail;
      if (!u?.id || !u.show || (show !== "any" && u.show !== show)) return;
      setRows((prev) => (prev.some((r) => r.id === u.id) ? prev : [u, ...prev]));
    };
    window.addEventListener("bbjd:feed-update-created", onCreated);
    return () => window.removeEventListener("bbjd:feed-update-created", onCreated);
  }, [show]);

  const loadMore = () => {
    if (loading) return;
    fetchPage(rows.length);
  };

  // Group rows by date key, preserving order.
  const groups = [];
  const groupByKey = new Map();
  for (const row of rows) {
    const key = dateKey(row.date);
    let group = groupByKey.get(key);
    if (!group) {
      group = { key, iso: row.date, rows: [] };
      groupByKey.set(key, group);
      groups.push(group);
    }
    group.rows.push(row);
  }

  // Number the woven ad slots in render order, ignoring group boundaries.
  const adNumberByRowId = new Map();
  let cardCount = 0;
  let adCount = 0;
  for (const group of groups) {
    for (const row of group.rows) {
      cardCount += 1;
      if (cardCount % AD_EVERY === 0 && adCount < AD_MAX) {
        adCount += 1;
        adNumberByRowId.set(row.id, adCount);
      }
    }
  }

  if (!loading && error && groups.length === 0) {
    return (
      <p className="fuh-empty">
        Couldn&apos;t load The Fix. Refresh to try again.
      </p>
    );
  }

  if (!loading && groups.length === 0) {
    return (
      <div className="shw-empty">
        <Torch lit={false} />
        <h3>The tribe hasn&apos;t spoken yet</h3>
        <p>No updates yet. Check back soon, and bookmark this page.</p>
      </div>
    );
  }

  return (
    <div className="shw-rail">
      {groups.map((g) => (
        <div key={g.key}>
          <div className="fuh-daybar">
            <span className="fuh-tag">{dayLabel(g.iso)}</span>
            <span className="fuh-date">{shortDate(g.iso)}</span>
            <span className="fuh-line" />
            <span className="fuh-count"><b>{g.rows.length}</b> updates</span>
          </div>
          <div className="fuh-thread">
            {g.rows.map((row) => {
              const adNumber = adNumberByRowId.get(row.id);
              return (
                <Fragment key={row.id}>
                  <FeedHubUpdateCard update={row} showPill={show === "any"} />
                  {adNumber !== undefined && (
                    <FreestarSlot
                      placementName="bigbrotherjunkies_incontent_reusable"
                      slotId={`fix_incontent_${adNumber}`}
                      className="my-3"
                    />
                  )}
                </Fragment>
              );
            })}
          </div>
        </div>
      ))}

      {hasMore && (
        <div className="fuh-loadmore">
          <a href="#" onClick={(e) => { e.preventDefault(); loadMore(); }}>
            {loading ? "Loading…" : "Load older updates ↓"}
          </a>
        </div>
      )}
    </div>
  );
}
