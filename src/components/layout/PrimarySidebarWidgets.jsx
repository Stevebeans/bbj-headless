"use client";

import { useEffect, useState } from "react";
import { SeasonStats, RecentComments } from "@/components/home/HomeWidgets";
import { SubscribeWidget } from "@/components/email/SubscribeWidget";

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

/**
 * The site's primary sidebar widget stack (same content as the homepage
 * sidebar), fetched CLIENT-SIDE on purpose: post/content pages are pure
 * webhook-ISR, and server-fetching this data would couple all ~17.5K cached
 * pages to fast-moving cache tags (see the June 2026 cost incident).
 *
 * `show` lets individual pages opt blocks out (future per-page exceptions),
 * e.g. <PrimarySidebarWidgets show={{ recentComments: false }} />.
 */
export function PrimarySidebarWidgets({ show = {} }) {
  const { seasonStats = true, subscribe = true, recentComments = true } = show;
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/bbjd/v1/homepage?v=2`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <>
      {seasonStats && data?.seasonStats?.season && (
        <SeasonStats season={data.seasonStats.season} players={data.seasonStats.players || []} />
      )}
      {subscribe && <SubscribeWidget />}
      {recentComments && (data?.recentComments?.comments || []).length > 0 && (
        <RecentComments comments={data.recentComments.comments} />
      )}
    </>
  );
}
