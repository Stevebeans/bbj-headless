"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/shared";

/**
 * Related players grid (castmates from same seasons)
 * Now organized by season with dropdown for multi-season players
 */
export function RelatedPlayers({ seasons, className = "" }) {
  // Default to first season (most recent)
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState(0);

  if (!seasons || seasons.length === 0) {
    return null;
  }

  const hasMultipleSeasons = seasons.length > 1;
  const currentSeason = seasons[selectedSeasonIndex];
  const players = currentSeason?.players || [];

  if (players.length === 0) {
    return null;
  }

  return (
    <div className={className}>
      {/* Season selector dropdown for multi-season players */}
      {hasMultipleSeasons && (
        <div className="mb-4 flex items-center gap-3">
          <label htmlFor="season-select" className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Season:
          </label>
          <select
            id="season-select"
            value={selectedSeasonIndex}
            onChange={(e) => setSelectedSeasonIndex(Number(e.target.value))}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {seasons.map((season, index) => (
              <option key={season.season_id} value={index}>
                {season.season_abbr || season.season_name} ({season.players?.length || 0} castmates)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Players grid */}
      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>

      {/* Show season name when single season */}
      {!hasMultipleSeasons && (
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
          Castmates from {currentSeason.season_name}
        </p>
      )}
    </div>
  );
}

function PlayerCard({ player }) {
  const { id, name, nickname, photo, permalink, status } = player;

  // Determine display name (nickname or first name)
  const displayName = nickname ? `"${nickname}"` : name?.split(" ")[0] || "HG";

  // Image styling based on status
  const isEvicted = status === "evicted";
  const isJury = status === "jury";
  const imageClass = `${isEvicted ? "grayscale opacity-70" : ""} ${isJury ? "grayscale-[50%] opacity-80" : ""}`;

  // Status badge styling
  const statusLabel = getStatusLabel(status);

  // Convert WordPress URL to local path
  let href = permalink || `/bigbrother-players/${id}`;
  try {
    const url = new URL(href);
    href = url.pathname;
  } catch {
    // Already a path, use as-is
  }

  return (
    <Link
      href={href}
      className="block group"
      title={name}
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
        {/* Photo */}
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
          {photo ? (
            <Image
              src={photo}
              alt={name || "Player"}
              fill
              className={`object-cover group-hover:scale-105 transition-transform duration-200 ${imageClass}`}
              sizes="(max-width: 640px) 80px, 100px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-400">
              {name?.charAt(0) || "?"}
            </div>
          )}
          {/* Status badge overlay */}
          {statusLabel && status !== "active" && (
            <div className="absolute bottom-0.5 right-0.5">
              <Badge variant={status} size="sm">
                {statusLabel}
              </Badge>
            </div>
          )}
        </div>
        {/* Name */}
        <div className="px-1 py-1.5 text-center">
          <div className="font-display text-[10px] sm:text-xs text-gray-800 dark:text-gray-200 truncate">
            {displayName}
          </div>
        </div>
      </div>
    </Link>
  );
}

function getStatusLabel(status) {
  const labels = {
    hoh: "HoH",
    pov: "PoV",
    nom: "Nom",
    jury: "Jury",
    evicted: "Out",
    havenot: "HN",
    safe: "Safe",
    active: null,
  };
  return labels[status] || null;
}
