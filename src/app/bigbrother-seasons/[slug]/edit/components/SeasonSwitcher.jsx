"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Season dropdown switcher for quick navigation between seasons
 */
export function SeasonSwitcher({ currentSeasonId, currentSlug }) {
  const router = useRouter();
  const [seasons, setSeasons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch seasons on mount
  useEffect(() => {
    async function fetchSeasons() {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";
        const response = await fetch(`${apiUrl}/bbjd/v1/seasons?order_by=season_number&order=DESC`);
        const data = await response.json();

        if (data.success && data.seasons) {
          setSeasons(data.seasons);
        }
      } catch (error) {
        console.error("Failed to fetch seasons:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSeasons();
  }, []);

  const handleSeasonChange = (e) => {
    const selectedSlug = e.target.value;
    if (selectedSlug && selectedSlug !== currentSlug) {
      router.push(`/bigbrother-seasons/${selectedSlug}/edit`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500 dark:text-slate-400">Season:</span>
        <div className="w-48 h-9 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="season-switcher" className="text-sm font-medium text-slate-600 dark:text-slate-400">
        Season:
      </label>
      <select
        id="season-switcher"
        value={currentSlug}
        onChange={handleSeasonChange}
        className="px-3 py-2 text-sm font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 cursor-pointer hover:border-slate-400 dark:hover:border-slate-500 transition-colors"
      >
        {seasons.map((season) => (
          <option key={season.id} value={season.slug}>
            {season.abbreviation || season.full_name || `Season ${season.season_number}`}
          </option>
        ))}
      </select>
    </div>
  );
}
