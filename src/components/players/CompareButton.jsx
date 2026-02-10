"use client";

import { useState } from "react";
import { FaExchangeAlt } from "react-icons/fa";
import { PlayerPicker } from "./PlayerPicker";

/**
 * Button that opens the PlayerPicker modal with current player pre-selected.
 * Used on player profile pages.
 */
export function CompareButton({ player }) {
  const [isOpen, setIsOpen] = useState(false);

  // Normalize player data for the picker
  const preselected = player
    ? {
        id: player.id,
        name: player.name,
        slug: player.slug,
        photo: player.photo?.url || null,
      }
    : null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-lg transition-colors border border-primary-200 dark:border-primary-700"
        title="Compare with another player"
      >
        <FaExchangeAlt className="w-3.5 h-3.5" />
        Compare
      </button>

      <PlayerPicker
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        preselectedPlayer={preselected}
      />
    </>
  );
}
