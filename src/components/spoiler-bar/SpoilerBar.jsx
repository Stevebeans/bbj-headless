"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getPrimaryStatus, getStatusLabel, sortPlayersForSpoilerBar } from "@/lib/spoiler-bar-utils";

// Standard BB cast size. Skeleton renders this many slot shapes so the SSR
// HTML already has the bar's silhouette in place; client fetch fills in
// the dynamic bits (colors, photos, names) without the "popped in from
// nothing" flash. If a season has a different count, the real render
// swaps in with player-ID keys and React reconciles.
const SKELETON_COUNT = 17;

const statusClasses = {
  winner: "spoilerbar-winner",
  hoh: "spoilerbar-hoh",
  pov: "spoilerbar-pov",
  nom: "spoilerbar-nom",
  jury: "spoilerbar-jury",
  evicted: "spoilerbar-evicted",
  active: "spoilerbar-active",
  safe: "spoilerbar-safe",
  runner_up: "spoilerbar-second",
  second: "spoilerbar-second",
  afp: "spoilerbar-afp",
  havenot: "spoilerbar-havenot",
  misc: "spoilerbar-havenot"
};

export function SpoilerBar() {
  // null = still loading (skeleton), [] = no current season (hide), [...] = real data
  const [players, setPlayers] = useState(null);
  const [season, setSeason] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/spoiler-bar")
      .then(r => (r.ok ? r.json() : null))
      .then(data => {
        if (cancelled) return;
        if (!data?.players) {
          setPlayers([]);
          return;
        }
        setPlayers(data.players);
        setSeason(data.season || null);
      })
      .catch(() => {
        if (!cancelled) setPlayers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // No current season — hide entirely after fetch confirms empty
  if (players !== null && players.length === 0) {
    return null;
  }

  const isLoading = players === null;
  const afpId = season?.afp_id || null;
  const sortedPlayers = isLoading ? null : sortPlayersForSpoilerBar(players);

  return (
    <div className="bbj-spoiler-bar flex relative">
      <div className="w-full overflow-x-auto py-1 bbj-track scroll-smooth">
        <div className="flex flex-nowrap gap-1 mx-auto w-max">{isLoading ? Array.from({ length: SKELETON_COUNT }).map((_, i) => <PlayerCardSkeleton key={`sk-${i}`} />) : sortedPlayers.map(player => <PlayerCard key={player.player_id || player.id} player={player} afpId={afpId} />)}</div>
      </div>
    </div>
  );
}

function PlayerCardSkeleton() {
  // Same outer dimensions as PlayerCard so swapping doesn't shift anything.
  // Neutral slate fill, subtle pulse for "loading" feel without being noisy.
  return (
    <div className="w-[56x] lg:w-14 " aria-hidden="true">
      <div className="bg-slate-300 dark:bg-slate-600 text-center text-[10px] leading-[18px] w-full border-t-2 border-r-2 border-l-2 border-slate-300 dark:border-slate-600 font-sans font-medium rounded-t-md">&nbsp;</div>
      <div className="relative block w-full h-14 lg:h-[80px] bg-slate-200 dark:bg-slate-700 overflow-hidden border-l-2 border-r-2 border-slate-300 dark:border-slate-600" />
      <div className="bg-slate-300 dark:bg-slate-600 rounded-b-md border-r-2 border-l-2 border-b-2 border-slate-300 dark:border-slate-600 text-[10px] leading-[18px] flex items-center justify-center font-sans font-medium">&nbsp;</div>
    </div>
  );
}

function PlayerCard({ player, afpId }) {
  const status = getPrimaryStatus(player, afpId);
  const statusLabel = getStatusLabel(player, afpId);
  const statusClass = statusClasses[status] || "spoilerbar-active";

  const displayName = player.nickname ? `"${player.nickname}"` : player.display_name || player.first_name || player.name?.split(" ")[0] || "HG";

  const isFinalist = player.finish_place === 1 || player.finish_place === 2;
  const gs = player.game_status || {};
  const isEvicted = (gs.evicted || status === "evicted") && !isFinalist;
  const isJury = (gs.jury || status === "jury") && !isFinalist;

  const cardContent = (
    <div className="w-[56px] lg:w-14">
      <div className={`${statusClass} text-center text-[10px] leading-[18px] w-full border-t-2 border-r-2 border-l-2 font-sans font-medium rounded-t-md`}>{statusLabel}</div>

      <div className={`relative block w-full h-14 lg:h-[80px] font-display overflow-hidden border-l-2 border-r-2 ${statusClass}`}>
        {player.photo ? (
          <>
            <Image src={player.photo} alt={player.name || "Houseguest"} fill className={`object-cover ${isEvicted ? "spoilerbar-evicted-img" : ""} ${isJury ? "spoilerbar-jury-img" : ""}`} sizes="(max-width: 1024px) 56px, 56px" unoptimized />
            {isJury && <div className="spoilerbar-jury-overlay" />}
          </>
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-lg font-bold ${isEvicted ? "bg-slate-400 text-slate-200" : isJury ? "bg-indigo-400 text-indigo-100" : "bg-gray-300 dark:bg-gray-600 text-gray-500"}`}>{displayName.charAt(0).replace(/["']/g, "")}</div>
        )}
      </div>

      <div className={`${statusClass} rounded-b-md border-r-2 border-l-2 border-b-2 text-[10px] leading-[18px] flex items-center justify-center font-sans font-medium`}>{displayName}</div>
    </div>
  );

  if (player.permalink) {
    let href = player.permalink;
    try {
      const url = new URL(player.permalink);
      href = url.pathname;
    } catch {
      // already a path
    }

    return (
      <Link href={href} title={player.name}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
