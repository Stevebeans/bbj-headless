"use client";

import { useEffect, useRef, useState } from "react";
import { FeedUpdatesSection } from "./FeedUpdatesSection";
import { LiveIndicatorToggle } from "@/components/feed-updates/LiveIndicatorToggle";
import { useLiveFeedUpdates } from "@/hooks/useLiveFeedUpdates";
import { mergeUpdates } from "@/lib/feedUpdatesLive";

/**
 * Client shell around the homepage feed section. Initial paint is the SSR
 * `updates` array (unchanged HTML — SEO/free experience identical); live
 * polls and optimistic composer inserts prepend into state. The list is
 * capped so FeedUpdatesSection's ad-slot batching never drifts.
 */
export function LiveFeedUpdates({ updates: initialUpdates = [] }) {
  const capRef = useRef(Math.max(initialUpdates.length, 20));
  const [updates, setUpdates] = useState(initialUpdates);
  const [pulse, setPulse] = useState(false);

  const { isPremium, live, setLive } = useLiveFeedUpdates({
    onNewUpdates: (incoming) =>
      setUpdates((current) => mergeUpdates(current, incoming, capRef.current)),
  });

  // Pulse "• live" briefly whenever the list actually changed.
  // mergeUpdates returns the same reference when nothing is new, so this
  // effect only fires on real insertions (and the initial mount, skipped).
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return undefined;
    }
    setPulse(true);
    const timeout = setTimeout(() => setPulse(false), 4000);
    return () => clearTimeout(timeout);
  }, [updates]);

  return (
    <div>
      <LiveIndicatorToggle isPremium={isPremium} live={live} onToggle={setLive} pulse={pulse} />
      <FeedUpdatesSection updates={updates} />
    </div>
  );
}
