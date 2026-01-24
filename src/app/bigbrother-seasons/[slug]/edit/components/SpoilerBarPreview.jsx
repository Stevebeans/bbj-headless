"use client";

import Image from "next/image";
import { getPrimaryStatus, getStatusLabel, sortPlayersForSpoilerBar } from "@/lib/spoiler-bar-utils";

/**
 * Live preview of the spoiler bar
 * Shows how players will appear based on current status settings
 */

// Status styling for preview cards
const statusStyles = {
  winner: {
    bg: "bg-gradient-to-b from-yellow-400 to-yellow-600",
    text: "text-slate-900",
    border: "border-yellow-500",
  },
  runner_up: {
    bg: "bg-gradient-to-b from-sky-400 to-sky-600",
    text: "text-white",
    border: "border-sky-500",
  },
  afp: {
    bg: "bg-gradient-to-b from-pink-400 to-pink-600",
    text: "text-white",
    border: "border-pink-500",
  },
  hoh: {
    bg: "bg-emerald-600",
    text: "text-white",
    border: "border-emerald-600",
  },
  pov: {
    bg: "bg-yellow-500",
    text: "text-slate-900",
    border: "border-yellow-500",
  },
  nom: {
    bg: "bg-red-500",
    text: "text-white",
    border: "border-red-500",
  },
  safe: {
    bg: "bg-green-400",
    text: "text-slate-900",
    border: "border-green-400",
  },
  jury: {
    bg: "bg-indigo-500",
    text: "text-white",
    border: "border-indigo-500",
  },
  evicted: {
    bg: "bg-slate-400",
    text: "text-white",
    border: "border-slate-400",
  },
  active: {
    bg: "bg-slate-200 dark:bg-slate-600",
    text: "text-slate-700 dark:text-slate-200",
    border: "border-slate-300 dark:border-slate-600",
  },
  havenot: {
    bg: "bg-amber-700",
    text: "text-white",
    border: "border-amber-700",
  },
  misc: {
    bg: "bg-slate-500",
    text: "text-white",
    border: "border-slate-500",
  },
};

function PreviewCard({ player, afpId }) {
  const status = getPrimaryStatus(player, afpId);
  const style = statusStyles[status] || statusStyles.active;
  const label = getStatusLabel(player, afpId);
  const gs = player.game_status || {};

  const displayName = player.nickname
    ? `"${player.nickname}"`
    : player.first_name || player.name?.split(" ")[0] || "HG";

  // Determine elimination status (winner/runner-up are not greyed out)
  const isFinalist = player.finish_place === 1 || player.finish_place === 2;
  const isJury = gs.jury && !isFinalist;
  const isEvicted = (gs.evicted || gs.jury) && !isJury && !isFinalist;

  return (
    <div className="w-[44px] flex-shrink-0">
      {/* Status banner */}
      <div className={`${style.bg} ${style.text} text-center text-[8px] leading-tight py-0.5 rounded-t border-t border-l border-r ${style.border} truncate px-0.5`}>
        {label}
      </div>

      {/* Image */}
      <div className={`relative w-full h-10 border-l border-r ${style.border} overflow-hidden`}>
        {player.photo ? (
          <>
            <Image
              src={player.photo}
              alt={player.name || "Player"}
              fill
              className={`object-cover ${isEvicted ? "grayscale-[80%] opacity-75" : ""} ${isJury ? "grayscale-[40%] opacity-85" : ""}`}
              sizes="44px"
            />
            {/* Blue tint overlay for jury members */}
            {isJury && (
              <div className="absolute inset-0 bg-indigo-500/25 mix-blend-multiply" />
            )}
          </>
        ) : (
          <div className={`w-full h-full flex items-center justify-center text-xs font-bold ${isEvicted ? "bg-slate-400 text-slate-600" : isJury ? "bg-indigo-300 text-indigo-700" : "bg-slate-300 dark:bg-slate-600 text-slate-500"}`}>
            {displayName.charAt(0).replace(/["']/g, "")}
          </div>
        )}
      </div>

      {/* Name */}
      <div className={`${style.bg} ${style.text} text-center text-[8px] leading-tight py-0.5 rounded-b border-b border-l border-r ${style.border} truncate px-0.5`}>
        {displayName}
      </div>
    </div>
  );
}

export function SpoilerBarPreview({ players, afpId = null }) {
  const sortedPlayers = sortPlayersForSpoilerBar(players);

  return (
    <div className="bg-slate-900 rounded-lg p-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        <span className="text-xs font-medium text-white uppercase tracking-wide">Live Preview</span>
      </div>

      {/* Scrollable preview */}
      <div className="overflow-x-auto">
        <div className="flex gap-1 pb-1">
          {sortedPlayers.map((player) => (
            <PreviewCard key={player.player_id || player.id} player={player} afpId={afpId} />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 pt-2 border-t border-slate-700 flex flex-wrap gap-2">
        {[
          { label: "Winner", bg: "bg-yellow-500" },
          { label: "2nd", bg: "bg-sky-500" },
          { label: "AFP", bg: "bg-pink-500" },
          { label: "HoH", bg: "bg-emerald-600" },
          { label: "PoV", bg: "bg-amber-400" },
          { label: "Nom", bg: "bg-red-500" },
          { label: "Jury", bg: "bg-indigo-500" },
          { label: "Out", bg: "bg-slate-400" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${item.bg}`} />
            <span className="text-[10px] text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
