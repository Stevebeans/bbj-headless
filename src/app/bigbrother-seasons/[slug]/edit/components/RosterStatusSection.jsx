"use client";

import { useState, useCallback, useMemo } from "react";
import { FormSection } from "@/components/forms";
import { useAuth } from "@/context/AuthContext";
import { updateRosterStatus, purgeSeasonCache } from "@/lib/api/seasons";
import { SpoilerBarPreview } from "./SpoilerBarPreview";
import { PlayerStatusCard } from "./PlayerStatusCard";

/**
 * Roster status section for editing player statuses in the spoiler bar
 * Includes live preview and bulk save functionality
 */
export function RosterStatusSection({ seasonId, players: initialPlayers, onPlayersUpdate, season }) {
  const { user } = useAuth();
  const [players, setPlayers] = useState(initialPlayers || []);
  const [originalPlayers, setOriginalPlayers] = useState(initialPlayers || []);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeMessage, setPurgeMessage] = useState(null);

  // Track which players have been modified
  const modifiedPlayerIds = useMemo(() => {
    const modified = new Set();
    players.forEach((player, index) => {
      const original = originalPlayers[index];
      if (!original) return;

      // Check game_status changes
      const gs = player.game_status || {};
      const ogs = original.game_status || {};

      if (
        gs.hoh !== ogs.hoh ||
        gs.pov !== ogs.pov ||
        gs.nom !== ogs.nom ||
        gs.safe !== ogs.safe ||
        gs.havenot !== ogs.havenot ||
        gs.misc !== ogs.misc ||
        gs.jury !== ogs.jury ||
        gs.evicted !== ogs.evicted ||
        gs.misc_notes !== ogs.misc_notes ||
        player.finish_place !== original.finish_place ||
        player.evicted_date !== original.evicted_date
      ) {
        modified.add(player.player_id || player.id);
      }
    });
    return modified;
  }, [players, originalPlayers]);

  const isDirty = modifiedPlayerIds.size > 0;

  // Handle individual player update
  const handlePlayerChange = useCallback((updatedPlayer) => {
    setPlayers((prev) =>
      prev.map((p) =>
        (p.player_id || p.id) === (updatedPlayer.player_id || updatedPlayer.id)
          ? updatedPlayer
          : p
      )
    );
    setSaveSuccess(false);
    setSaveError(null);
  }, []);

  // Save all changes
  const handleSave = useCallback(async () => {
    if (!user?.token || !isDirty) return;

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    // Build update payload for modified players only
    const updates = players
      .filter((p) => modifiedPlayerIds.has(p.player_id || p.id))
      .map((player) => ({
        player_id: player.player_id || player.id,
        current_hoh: player.game_status?.hoh || false,
        current_pov: player.game_status?.pov || false,
        current_nom: player.game_status?.nom || false,
        current_safe: player.game_status?.safe || false,
        current_havenot: player.game_status?.havenot || false,
        current_misc: player.game_status?.misc || false,
        current_jury: player.game_status?.jury || false,
        current_evicted: player.game_status?.evicted || false,
        misc_notes: player.game_status?.misc_notes || "",
        finish_place: player.finish_place,
        evicted_date: player.evicted_date,
      }));

    try {
      const result = await updateRosterStatus(seasonId, updates, user.token);

      if (result.success) {
        setSaveSuccess(true);
        // Update original players to match current state (clears dirty flag)
        setOriginalPlayers(JSON.parse(JSON.stringify(players)));
        // Optionally update parent
        onPlayersUpdate?.(players);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(result.message || "Failed to save changes");
      }
    } catch (error) {
      setSaveError(error.message || "Network error");
    } finally {
      setIsSaving(false);
    }
  }, [user?.token, isDirty, players, modifiedPlayerIds, seasonId, onPlayersUpdate]);

  // Purge cache handler
  const handlePurgeCache = useCallback(async () => {
    if (!user?.token) return;

    setIsPurging(true);
    setPurgeMessage(null);

    try {
      const result = await purgeSeasonCache(seasonId, user.token);
      if (result.success) {
        setPurgeMessage({ type: "success", text: "Cache purged! Refresh the page to see updates." });
      } else {
        setPurgeMessage({ type: "error", text: result.message || "Failed to purge cache" });
      }
    } catch (error) {
      setPurgeMessage({ type: "error", text: error.message || "Network error" });
    } finally {
      setIsPurging(false);
      setTimeout(() => setPurgeMessage(null), 5000);
    }
  }, [user?.token, seasonId]);

  // Separate active and eliminated players
  // A player is eliminated if evicted OR jury (jury members are evicted but marked as jury)
  const activePlayers = useMemo(
    () => players.filter((p) => !p.game_status?.evicted && !p.game_status?.jury),
    [players]
  );

  const eliminatedPlayers = useMemo(
    () =>
      players
        .filter((p) => p.game_status?.evicted || p.game_status?.jury)
        .sort((a, b) => {
          // Sort by finish_place if available, otherwise by evicted_date
          if (a.finish_place && b.finish_place) {
            return a.finish_place - b.finish_place;
          }
          if (a.finish_place) return -1;
          if (b.finish_place) return 1;
          return 0;
        }),
    [players]
  );

  return (
    <FormSection
      title="Spoiler Bar Status"
      description="Update player statuses for the spoiler bar. Changes will be reflected immediately after saving."
      variant="tabbed"
    >
      {/* Live Preview - Sticky on scroll */}
      <div className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-slate-100 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 -mt-4 mb-4">
        <SpoilerBarPreview players={players} afpId={season?.afp_id} />
      </div>

      {/* Save button and status */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          className={`
            px-4 py-2 text-sm font-medium rounded-lg transition-colors
            ${isDirty
              ? "bg-primary-500 text-white hover:bg-primary-600"
              : "bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed"
            }
            ${isSaving ? "opacity-75 cursor-wait" : ""}
          `}
        >
          {isSaving ? "Saving..." : `Save Changes${isDirty ? ` (${modifiedPlayerIds.size})` : ""}`}
        </button>

        {/* Purge Cache button */}
        <button
          type="button"
          onClick={handlePurgeCache}
          disabled={isPurging}
          className="px-4 py-2 text-sm font-medium rounded-lg transition-colors border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-wait"
          title="Clear Redis + Varnish cache if spoiler bar shows stale data"
        >
          {isPurging ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Purging...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Purge Cache
            </span>
          )}
        </button>

        {saveSuccess && (
          <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved!
          </span>
        )}

        {saveError && (
          <span className="text-sm text-red-600 dark:text-red-400">{saveError}</span>
        )}

        {purgeMessage && (
          <span className={`text-sm flex items-center gap-1 ${purgeMessage.type === "success" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {purgeMessage.type === "success" ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {purgeMessage.text}
          </span>
        )}
      </div>

      {/* Active Players */}
      {activePlayers.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Active ({activePlayers.length})
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {activePlayers.map((player) => (
              <PlayerStatusCard
                key={player.player_id || player.id}
                player={player}
                onChange={handlePlayerChange}
                disabled={isSaving}
                season={season}
              />
            ))}
          </div>
        </div>
      )}

      {/* Eliminated Players */}
      {eliminatedPlayers.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Eliminated ({eliminatedPlayers.length})
          </h4>
          <div className="grid gap-3 sm:grid-cols-2">
            {eliminatedPlayers.map((player) => (
              <PlayerStatusCard
                key={player.player_id || player.id}
                player={player}
                onChange={handlePlayerChange}
                disabled={isSaving}
                season={season}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {players.length === 0 && (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <p>No players in this season yet.</p>
          <p className="text-sm mt-1">Add players first using the section above.</p>
        </div>
      )}
    </FormSection>
  );
}
