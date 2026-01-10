"use client";

import { useState } from "react";
import Image from "next/image";

const statusColors = {
  winner: "bg-yellow-400 text-yellow-900",
  runner_up: "bg-gray-300 text-gray-800",
  afp: "bg-pink-400 text-white",
  jury: "bg-purple-500 text-white",
  evicted: "bg-red-500 text-white",
  active: "bg-green-500 text-white",
};

const statusLabels = {
  winner: "Winner",
  runner_up: "2nd",
  afp: "AFP",
  jury: "Jury",
  evicted: "Evicted",
  active: "Active",
};

export function SpoilerBar({ players }) {
  const [isVisible, setIsVisible] = useState(true);

  if (!players || players.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Toggle Bar */}
      <div className="bg-primary-500 text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 py-1 flex justify-end items-center gap-2">
          <span>Show Spoiler Bar:</span>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="text-secondary-500 font-bold"
          >
            {isVisible ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Spoiler Cards */}
      {isVisible && (
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-wrap justify-center gap-2 md:gap-3">
            {players.map((player) => (
              <SpoilerCard key={player.player_id} player={player} />
            ))}
          </div>
          {/* Yellow gradient bar */}
          <div className="h-1.5 bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-500 mt-3 rounded-full max-w-4xl mx-auto" />
        </div>
      )}
    </div>
  );
}

function SpoilerCard({ player }) {
  const playerName = player.nickname || player.name?.split(" ")[0] || "Unknown";

  return (
    <div className="flex flex-col items-center w-16 md:w-20">
      {/* Player Photo */}
      <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-600">
        {player.photo ? (
          <Image
            src={player.photo}
            alt={player.name || "Player"}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 text-xs">
            ?
          </div>
        )}
      </div>

      {/* Player Name */}
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mt-1 text-center truncate w-full">
        {playerName}
      </span>

      {/* Status Badge */}
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
          statusColors[player.status] || "bg-gray-400 text-white"
        }`}
      >
        {statusLabels[player.status] || player.status || "Unknown"}
      </span>
    </div>
  );
}
