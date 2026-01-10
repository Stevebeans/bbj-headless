"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

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
};

const statusImageClasses = {
  winner: "border-2 border-green-500",
  hoh: "border-2 border-green-500",
  pov: "border-2 border-amber-400",
  nom: "border-2 border-rose-400",
  jury: "spoilerbar-jury-img",
  evicted: "spoilerbar-evicted-img",
  active: "border-2 border-slate-300 dark:border-slate-600",
  safe: "border-2 border-green-400",
  runner_up: "border-2 border-sky-400",
  second: "border-2 border-sky-400",
  afp: "border-2 border-rose-400",
};

const statusLabels = {
  winner: "Winner",
  hoh: "HoH",
  pov: "PoV",
  nom: "Nom",
  jury: "Jury",
  evicted: "Evicted",
  active: "Active",
  safe: "Safe",
  runner_up: "2nd",
  second: "2nd",
  afp: "AFP",
  havenot: "Have-Not",
};

export function SpoilerBar({ players }) {
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("showbar");
    if (stored !== null) {
      setIsVisible(stored === "true");
    }
  }, []);

  const toggleVisibility = () => {
    const newValue = !isVisible;
    setIsVisible(newValue);
    localStorage.setItem("showbar", String(newValue));
  };

  if (!players || players.length === 0) {
    return null;
  }

  return (
    <div className="bbj-spoiler-bar">
      <div className="bg-primary-500 text-white">
        <div className="max-w-screen-xl mx-auto px-2 py-1 flex justify-between items-center">
          <h2 className="text-xs font-semibold uppercase tracking-wide">Spoiler Bar</h2>
          <button
            onClick={toggleVisibility}
            className="flex items-center gap-2 text-xs font-semibold text-secondary-500 hover:text-secondary-400 transition-colors"
            aria-label={isVisible ? "Hide spoiler bar" : "Show spoiler bar"}
          >
            <span>{isVisible ? "ON" : "OFF"}</span>
            <ToggleIcon isOn={isVisible} />
          </button>
        </div>
      </div>

      {(mounted ? isVisible : true) && (
        <>
          <div className="playerDiv">
            {players.map((player) => (
              <PlayerCard key={player.player_id} player={player} />
            ))}
          </div>
          <div className="closing-bar" />
        </>
      )}
    </div>
  );
}

function ToggleIcon({ isOn }) {
  return (
    <svg className={`w-6 h-6 transition-opacity ${isOn ? "" : "opacity-50"}`} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      {isOn ? (
        <path d="M17 7H7a5 5 0 000 10h10a5 5 0 000-10zm0 8a3 3 0 110-6 3 3 0 010 6z" />
      ) : (
        <path d="M7 7h10a5 5 0 010 10H7A5 5 0 017 7zm0 8a3 3 0 100-6 3 3 0 000 6z" />
      )}
    </svg>
  );
}

function PlayerCard({ player }) {
  const status = String(player.status || "active").toLowerCase();
  const playerName = player.nickname || player.name?.split(" ")[0] || "HG";
  const statusClass = statusClasses[status] || "spoilerbar-active";
  const imageClass = statusImageClasses[status] || "border-2 border-slate-300";
  const label = statusLabels[status] || status;

  return (
    <div className="profile-contain flex flex-col items-center mx-1 md:mx-2">
      <div className={`relative w-10 h-10 md:w-14 md:h-14 rounded-full overflow-hidden ${imageClass}`}>
        {player.photo ? (
          <Image
            src={player.photo}
            alt={player.name || "Houseguest"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 40px, 56px"
          />
        ) : (
          <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 text-xs font-bold">
            {playerName.charAt(0)}
          </div>
        )}
      </div>
      <span className="text-[10px] md:text-xs font-medium text-gray-700 dark:text-gray-300 mt-1 text-center truncate max-w-[50px] md:max-w-[70px]">
        {playerName}
      </span>
      <span className={`text-[8px] md:text-[10px] px-1.5 py-0.5 rounded-sm font-semibold uppercase tracking-wide ${statusClass}`}>
        {label}
      </span>
    </div>
  );
}
