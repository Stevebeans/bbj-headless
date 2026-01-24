"use client";

import Link from "next/link";
import { FormSection } from "@/components/forms";
import { PlayerSeasons } from "@/components/players";

/**
 * Seasons section - read-only display of player's seasons
 * Seasons are managed from the season edit page, not the player edit page
 */
export function SeasonsSection({ seasons }) {
  if (!seasons || seasons.length === 0) {
    return (
      <FormSection
        title="Seasons"
        description="Seasons this player has appeared in. Manage rosters from the season edit page."
      >
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p>This player hasn&apos;t appeared in any seasons yet.</p>
          <p className="text-sm mt-1">Add them to a season from the season edit page.</p>
        </div>
      </FormSection>
    );
  }

  return (
    <FormSection
      title="Seasons"
      description="Seasons this player has appeared in. Manage rosters from the season edit page."
    >
      <PlayerSeasons seasons={seasons} />

      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p>
          To add or remove this player from a season, go to the{" "}
          <Link href="/directory?tab=seasons" className="text-primary-500 hover:underline">
            season directory
          </Link>{" "}
          and edit the season.
        </p>
      </div>
    </FormSection>
  );
}
