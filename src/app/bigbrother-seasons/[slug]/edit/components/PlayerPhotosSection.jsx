"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { FormSection } from "@/components/forms";
import { useAuth } from "@/context/AuthContext";
import { searchPlayerPhotos, savePlayerPhoto } from "@/lib/api/playerPhotos";

/**
 * Player Photos Section - Automatic image search with 3 options
 * Searches Google Images for player headshots and lets you pick one to save
 */
export function PlayerPhotosSection({ seasonId, players: initialPlayers, seasonName }) {
  const { user } = useAuth();
  const [players, setPlayers] = useState(initialPlayers || []);
  const [expandedPlayerId, setExpandedPlayerId] = useState(null);
  const [photoOptions, setPhotoOptions] = useState({}); // { playerId: [photos] }
  const [searchingPlayerId, setSearchingPlayerId] = useState(null);
  const [savingPhoto, setSavingPhoto] = useState(null); // { playerId, photoIndex }
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Players without photos
  const playersWithoutPhotos = useMemo(
    () => players.filter((p) => !p.photo),
    [players]
  );

  // Search for photos
  const handleSearch = useCallback(async (player) => {
    if (!user?.token) return;

    const playerId = player.player_id || player.id;
    const playerName = `${player.first_name || ""} ${player.last_name || ""}`.trim() || player.name || "Player";

    setSearchingPlayerId(playerId);
    setExpandedPlayerId(playerId);
    setError(null);

    try {
      const result = await searchPlayerPhotos(playerName, seasonName, user.token);

      if (result.success && result.photos?.length > 0) {
        // Debug: Log the photo URLs we received
        console.log("Photo search results for", playerName, ":", result.photos);
        result.photos.forEach((p, i) => {
          console.log(`  Photo ${i + 1}:`, { thumbnail: p.thumbnail, url: p.url, source: p.source });
        });
        setPhotoOptions((prev) => ({ ...prev, [playerId]: result.photos }));
      } else {
        setError("No photos found. Try the manual search option.");
        // Open Google Images as fallback
        const searchQuery = encodeURIComponent(`${playerName} ${seasonName} profile picture headshot`);
        window.open(`https://www.google.com/search?q=${searchQuery}&tbm=isch`, "_blank");
      }
    } catch (err) {
      setError(err.message || "Search failed. Try again or use manual search.");
      console.error("Photo search error:", err);
    } finally {
      setSearchingPlayerId(null);
    }
  }, [user?.token, seasonName]);

  // Save selected photo
  const handleSelectPhoto = useCallback(async (playerId, photo, photoIndex) => {
    if (!user?.token) return;

    setSavingPhoto({ playerId, photoIndex });
    setError(null);

    try {
      const result = await savePlayerPhoto(playerId, photo.url, user.token);

      if (result.success) {
        // Update player in list with new photo
        setPlayers((prev) =>
          prev.map((p) =>
            (p.player_id || p.id) === playerId
              ? { ...p, photo: result.photo?.url || photo.url }
              : p
          )
        );

        // Clear options and collapse
        setPhotoOptions((prev) => {
          const next = { ...prev };
          delete next[playerId];
          return next;
        });
        setExpandedPlayerId(null);

        setSuccessMessage("Photo saved!");
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      setError(err.message || "Failed to save photo. The image might be protected.");
    } finally {
      setSavingPhoto(null);
    }
  }, [user?.token]);

  // Manual search fallback
  const openManualSearch = useCallback((player) => {
    const playerName = `${player.first_name || ""} ${player.last_name || ""}`.trim() || player.name || "Player";
    const searchQuery = encodeURIComponent(`${playerName} ${seasonName} profile picture headshot`);
    window.open(`https://www.google.com/search?q=${searchQuery}&tbm=isch`, "_blank");
  }, [seasonName]);

  return (
    <FormSection
      title="Player Photos"
      description="Search for and add profile photos. Click 'Search' to find photos automatically, then select one to save."
      variant="tabbed"
    >
      {/* Stats Bar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 dark:text-slate-400">Players without photos:</span>
          <span className={`font-medium ${playersWithoutPhotos.length > 0 ? "text-amber-600" : "text-green-600"}`}>
            {playersWithoutPhotos.length}
          </span>
          <span className="text-slate-400">of {players.length}</span>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {successMessage}
        </div>
      )}

      {/* Player List */}
      <div className="space-y-3">
        {players.map((player) => {
          const playerId = player.player_id || player.id;
          const isExpanded = expandedPlayerId === playerId;
          const hasPhoto = !!player.photo;
          const isSearching = searchingPlayerId === playerId;
          const photos = photoOptions[playerId] || [];
          const playerName = `${player.first_name || ""} ${player.last_name || ""}`.trim() || player.name || "Player";

          return (
            <div
              key={playerId}
              className={`
                rounded-lg border transition-colors
                ${isExpanded
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                }
              `}
            >
              {/* Player Row */}
              <div className="flex items-center gap-4 p-4">
                {/* Current Photo */}
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                  {player.photo ? (
                    <Image
                      src={player.photo}
                      alt={playerName}
                      width={56}
                      height={56}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-lg font-bold">
                      {playerName.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Name and Status */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-800 dark:text-white truncate">
                    {playerName}
                  </h4>
                  <p className="text-sm">
                    {hasPhoto ? (
                      <span className="text-green-600 dark:text-green-400">Has photo</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">No photo</span>
                    )}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSearch(player)}
                    disabled={isSearching}
                    className={`
                      px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5
                      ${isSearching
                        ? "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-wait"
                        : "bg-primary-500 text-white hover:bg-primary-600"
                      }
                    `}
                  >
                    {isSearching ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Searching...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Search
                      </>
                    )}
                  </button>

                  {hasPhoto && (
                    <button
                      type="button"
                      onClick={() => setExpandedPlayerId(isExpanded ? null : playerId)}
                      className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      Replace
                    </button>
                  )}
                </div>
              </div>

              {/* Photo Options */}
              {isExpanded && photos.length > 0 && (
                <div className="px-4 pb-4 pt-0">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                    Select a photo to save:
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {photos.map((photo, index) => {
                      const isSaving = savingPhoto?.playerId === playerId && savingPhoto?.photoIndex === index;
                      return (
                        <button
                          key={photo.id || index}
                          type="button"
                          onClick={() => handleSelectPhoto(playerId, photo, index)}
                          disabled={!!savingPhoto}
                          className={`
                            relative aspect-square rounded-lg overflow-hidden border-2 transition-all bg-slate-100 dark:bg-slate-700
                            ${isSaving
                              ? "border-primary-500 ring-2 ring-primary-500/50"
                              : "border-transparent hover:border-primary-400 hover:scale-105"
                            }
                            ${savingPhoto && !isSaving ? "opacity-50" : ""}
                          `}
                        >
                          {/* Use regular img tag for external URLs - more reliable */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={photo.thumbnail || photo.url}
                            alt={`Option ${index + 1}`}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to full URL if thumbnail fails
                              if (e.target.src !== photo.url && photo.url) {
                                e.target.src = photo.url;
                              }
                            }}
                          />
                          {isSaving && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <svg className="w-6 h-6 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                            </div>
                          )}
                          <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                            {index + 1}
                          </div>
                          {/* Source badge */}
                          <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] px-1 py-0.5 rounded">
                            {photo.source || "Web"}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Manual fallback */}
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-xs text-slate-500">Not finding a good photo?</span>
                    <button
                      type="button"
                      onClick={() => openManualSearch(player)}
                      className="text-xs text-primary-500 hover:text-primary-600 font-medium"
                    >
                      Search manually on Google
                    </button>
                  </div>
                </div>
              )}

              {/* Loading state when expanded but no photos yet */}
              {isExpanded && isSearching && (
                <div className="px-4 pb-4 pt-0">
                  <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-lg bg-slate-200 dark:bg-slate-700 animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {players.length === 0 && (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <p>No players in this season yet.</p>
          <p className="text-sm mt-1">Add players in the Season Info tab first.</p>
        </div>
      )}
    </FormSection>
  );
}
