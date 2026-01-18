"use client";

import { useState, useCallback, useEffect } from "react";
import { FormSection, SearchSelect } from "@/components/forms";
import { PlayerBadge } from "@/components/players";
import { searchPlayers } from "@/lib/api/seasons";
import { useDebounce } from "@/hooks";

/**
 * Players section with search and add/remove functionality
 */
export function PlayersSection({ seasonId, players, onAddPlayer, onRemovePlayer }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(null);
  const [addError, setAddError] = useState(null);

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Search for players when debounced query changes
  useEffect(() => {
    const doSearch = async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        // Get IDs of players already in the season to exclude
        const excludeIds = players.map((p) => p.id);
        const { players: results } = await searchPlayers(debouncedQuery, excludeIds);
        setSearchResults(results || []);
      } catch (error) {
        console.error("Search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    doSearch();
  }, [debouncedQuery, players]);

  // Handle player selection
  const handleSelectPlayer = async (player) => {
    setAddError(null);
    try {
      const result = await onAddPlayer(player);
      if (result.success) {
        setSearchQuery("");
        setSearchResults([]);
      } else {
        setAddError(result.error || "Failed to add player");
      }
    } catch (error) {
      setAddError(error.message || "Failed to add player");
    }
  };

  // Handle player removal
  const handleRemovePlayer = async (playerId) => {
    setRemoveLoading(playerId);
    try {
      await onRemovePlayer(playerId);
    } catch (error) {
      console.error("Remove failed:", error);
    } finally {
      setRemoveLoading(null);
    }
  };

  return (
    <FormSection
      title="Season Players"
      description="Manage houseguests for this season. Search and add players, or remove existing ones."
    >
      {/* Search and add */}
      <div className="mb-4">
        <SearchSelect
          label="Add Player"
          placeholder="Search players by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          options={searchResults.map((p) => ({
            value: p.id,
            label: p.name,
            player: p,
          }))}
          onSelect={(option) => handleSelectPlayer(option.player)}
          isLoading={isSearching}
          emptyText={
            debouncedQuery.length >= 2
              ? "No players found"
              : "Type at least 2 characters to search"
          }
        />
        {addError && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{addError}</p>
        )}
      </div>

      {/* Current players list */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Current Players
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {players.length} player{players.length !== 1 ? "s" : ""}
          </span>
        </div>

        {players.length > 0 ? (
          <div className="p-4 flex flex-wrap gap-2">
            {players.map((player) => (
              <PlayerBadge
                key={player.id}
                player={player}
                onRemove={() => handleRemovePlayer(player.id)}
                isRemoving={removeLoading === player.id}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <p>No players added to this season yet</p>
            <p className="text-sm mt-1">Use the search above to add houseguests</p>
          </div>
        )}
      </div>
    </FormSection>
  );
}
