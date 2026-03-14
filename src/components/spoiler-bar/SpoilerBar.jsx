"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { getPrimaryStatus, getStatusLabel, sortPlayersForSpoilerBar } from "@/lib/spoiler-bar-utils";

// CSS class mapping for status colors
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
  misc: "spoilerbar-havenot",
};

export function SpoilerBar({ players, season }) {
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const scrollRef = useRef(null);

  // Get AFP ID from season
  const afpId = season?.afp_id || null;

  // Sort players using shared utility
  const sortedPlayers = useMemo(() => sortPlayersForSpoilerBar(players), [players]);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("showbar");
    if (stored !== null) {
      setIsVisible(stored === "true");
    }

    // Hide swipe hint after 4 seconds or on first scroll
    const timer = setTimeout(() => setShowSwipeHint(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  // Hide hint when user starts scrolling
  const handleScroll = () => {
    if (showSwipeHint) {
      setShowSwipeHint(false);
    }
  };

  const toggleVisibility = () => {
    const newValue = !isVisible;
    setIsVisible(newValue);
    localStorage.setItem("showbar", String(newValue));
  };

  if (!players || players.length === 0) {
    return null;
  }

  return (
    <div className="bbj-spoiler-bar flex relative">
      {(mounted ? isVisible : true) && (
        <>
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="w-full overflow-x-auto py-1 bbj-track scroll-smooth"
          >
            <div className="flex flex-nowrap gap-1 mx-auto w-max">
              {sortedPlayers.map((player) => (
                <PlayerCard key={player.player_id || player.id} player={player} afpId={afpId} />
              ))}
            </div>
          </div>

          {/* Mobile swipe hint */}
          {mounted && showSwipeHint && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 lg:hidden pointer-events-none animate-pulse">
              <div className="flex items-center gap-1 bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-sm">
                <span>Swipe</span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PlayerCard({ player, afpId }) {
  // Compute status at render time using shared utility
  const status = getPrimaryStatus(player, afpId);
  const statusLabel = getStatusLabel(player, afpId);
  const statusClass = statusClasses[status] || "spoilerbar-active";

  // Use display_name from API, fallback to first_name or computed name
  const displayName = player.nickname
    ? `"${player.nickname}"`
    : player.display_name || player.first_name || player.name?.split(" ")[0] || "HG";

  // Check if player is a finalist (winner/runner-up don't get greyed out)
  const isFinalist = player.finish_place === 1 || player.finish_place === 2;

  // Check if player is evicted or jury for image styling (but not finalists)
  const gs = player.game_status || {};
  const isEvicted = (gs.evicted || status === "evicted") && !isFinalist;
  const isJury = (gs.jury || status === "jury") && !isFinalist;

  const cardContent = (
    <div className="w-[56px] lg:w-14">
      {/* Status Banner */}
      <div className={`${statusClass} text-center text-[10px] leading-[18px] w-full border-t-2 border-r-2 border-l-2 font-sans font-medium rounded-t-md`}>
        {statusLabel}
      </div>

      {/* Profile Image */}
      <div className={`relative block w-full h-14 lg:h-[80px] font-display overflow-hidden border-l-2 border-r-2 ${statusClass}`}>
        {player.photo ? (
          <>
            <Image
              src={player.photo}
              alt={player.name || "Houseguest"}
              fill
              className={`object-cover ${isEvicted ? "spoilerbar-evicted-img" : ""} ${isJury ? "spoilerbar-jury-img" : ""}`}
              sizes="(max-width: 1024px) 56px, 56px"
              unoptimized
            />
            {/* Blue tint overlay for jury members */}
            {isJury && <div className="spoilerbar-jury-overlay" />}
          </>
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-lg font-bold ${isEvicted ? "bg-slate-400 text-slate-200" : isJury ? "bg-indigo-400 text-indigo-100" : "bg-gray-300 dark:bg-gray-600 text-gray-500"}`}>
            {displayName.charAt(0).replace(/["']/g, "")}
          </div>
        )}
      </div>

      {/* Name Bar */}
      <div className={`${statusClass} rounded-b-md border-r-2 border-l-2 border-b-2 text-[10px] leading-[18px] flex items-center justify-center font-sans font-medium`}>
        {displayName}
      </div>
    </div>
  );

  // Wrap in link if permalink exists
  // Convert full URL to local path (e.g., https://bigbrotherjunkies.com/bigbrother-players/name/ -> /bigbrother-players/name/)
  if (player.permalink) {
    let href = player.permalink;
    try {
      const url = new URL(player.permalink);
      href = url.pathname;
    } catch {
      // If it's already a path, use as-is
    }

    return (
      <Link href={href} title={player.name}>
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}
