"use client";

import Image from "next/image";
import { StatusToggleGroup } from "./StatusToggleGroup";
import { EliminationFields } from "./EliminationFields";

/**
 * Individual player card for roster status editing
 * Mobile-first design with photo, status toggles, and elimination fields
 */
export function PlayerStatusCard({ player, onChange, disabled = false, season }) {
  // Extract current status values
  const statuses = {
    hoh: player.game_status?.hoh || false,
    pov: player.game_status?.pov || false,
    nom: player.game_status?.nom || false,
    safe: player.game_status?.safe || false,
    havenot: player.game_status?.havenot || false,
    misc: player.game_status?.misc || false,
  };

  // A player is eliminated if evicted OR jury (jury members are evicted but marked differently)
  const isJury = player.game_status?.jury || false;
  const isEvicted = player.game_status?.evicted || false;
  const isEliminated = isEvicted || isJury;
  const finishPlace = player.finish_place || null;
  const evictedDate = player.evicted_date || null;
  const miscNotes = player.game_status?.misc_notes || "";

  // Check for special end-game statuses
  const playerId = player.player_id || player.id;
  const isWinner = finishPlace === 1;
  const isRunnerUp = finishPlace === 2;
  const isAFP = season?.afp_id && playerId === season.afp_id;

  // Get primary status color for card border
  const getBorderColor = () => {
    if (isWinner) return "border-l-yellow-500";
    if (isRunnerUp) return "border-l-sky-500";
    if (isAFP && isEliminated) return "border-l-pink-500";
    if (statuses.hoh) return "border-l-emerald-600";
    if (statuses.pov) return "border-l-yellow-500";
    if (statuses.safe) return "border-l-green-400";
    if (statuses.nom) return "border-l-red-500";
    if (statuses.havenot) return "border-l-amber-700";
    if (isJury) return "border-l-indigo-500";
    if (isEliminated) return "border-l-slate-400";
    return "border-l-slate-300 dark:border-l-slate-600";
  };

  // Handle status toggle changes
  const handleStatusChange = (newStatuses) => {
    onChange({
      ...player,
      game_status: {
        ...player.game_status,
        ...newStatuses,
      },
    });
  };

  // Handle misc notes change
  const handleMiscNotesChange = (notes) => {
    onChange({
      ...player,
      game_status: {
        ...player.game_status,
        misc_notes: notes,
      },
    });
  };

  // Handle eliminated toggle
  const handleEliminatedChange = (eliminated) => {
    onChange({
      ...player,
      game_status: {
        ...player.game_status,
        evicted: eliminated,
        // Clear active game statuses when eliminated
        hoh: eliminated ? false : player.game_status?.hoh,
        pov: eliminated ? false : player.game_status?.pov,
        nom: eliminated ? false : player.game_status?.nom,
        safe: eliminated ? false : player.game_status?.safe,
      },
      // Clear finish_place when switching back to active
      finish_place: eliminated ? player.finish_place : null,
    });
  };

  // Handle jury change
  const handleJuryChange = (jury) => {
    onChange({
      ...player,
      game_status: {
        ...player.game_status,
        jury,
      },
    });
  };

  // Handle finish place change
  const handleFinishPlaceChange = (place) => {
    onChange({
      ...player,
      finish_place: place,
    });
  };

  // Handle eviction date change
  const handleEvictedDateChange = (date) => {
    onChange({
      ...player,
      evicted_date: date,
    });
  };

  // Player name display
  const displayName = player.nickname ? `"${player.nickname}"` : player.first_name || player.name?.split(" ")[0] || "Player";
  const fullName = player.name || `${player.first_name || ""} ${player.last_name || ""}`.trim();

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 border-l-4 ${getBorderColor()} overflow-hidden`}>
      <div className="p-4 space-y-4">
        {/* Player header with photo and name */}
        <div className="flex items-center gap-3">
          {/* Photo */}
          <div className="relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
            {player.photo ? (
              <Image
                src={player.photo}
                alt={fullName}
                fill
                className={`object-cover ${isEliminated && !isJury ? "grayscale opacity-70" : ""} ${isJury ? "grayscale-[50%] opacity-80" : ""}`}
                sizes="48px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-lg font-bold">
                {displayName.charAt(0).replace(/["']/g, "")}
              </div>
            )}
          </div>

          {/* Name */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-slate-900 dark:text-white truncate">
              {fullName}
            </h4>
            {player.nickname && (
              <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                {displayName}
              </p>
            )}
          </div>

          {/* Special status badges */}
          <div className="flex-shrink-0 flex gap-1">
            {isWinner && (
              <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded text-xs font-bold text-slate-900">
                Winner
              </span>
            )}
            {isRunnerUp && (
              <span className="px-2 py-0.5 bg-gradient-to-r from-sky-400 to-sky-600 rounded text-xs font-bold text-white">
                2nd
              </span>
            )}
            {isAFP && (
              <span className="px-2 py-0.5 bg-gradient-to-r from-pink-400 to-pink-600 rounded text-xs font-bold text-white">
                AFP
              </span>
            )}
            {finishPlace && !isWinner && !isRunnerUp && (
              <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-medium text-slate-600 dark:text-slate-300">
                #{finishPlace}
              </span>
            )}
          </div>
        </div>

        {/* Status toggles - only show if not eliminated */}
        {!isEliminated && (
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
              Game Status
            </label>
            <StatusToggleGroup
              statuses={statuses}
              onChange={handleStatusChange}
              miscNotes={miscNotes}
              onMiscNotesChange={handleMiscNotesChange}
              disabled={disabled}
            />
          </div>
        )}

        {/* Elimination fields */}
        <EliminationFields
          playerId={playerId}
          isEliminated={isEliminated}
          onEliminatedChange={handleEliminatedChange}
          finishPlace={finishPlace}
          onFinishPlaceChange={handleFinishPlaceChange}
          isJury={isJury}
          onJuryChange={handleJuryChange}
          evictedDate={evictedDate}
          onEvictedDateChange={handleEvictedDateChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
