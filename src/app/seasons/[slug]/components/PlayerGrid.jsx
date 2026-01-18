import { PlayerCard } from "@/components/players";

/**
 * Grid of player cards for season page
 */
export function PlayerGrid({ players, seasonIsActive = false }) {
  if (!players || players.length === 0) {
    return (
      <div className="v2-primary-container-inner p-6 rounded-lg text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No players have been added to this season yet.
        </p>
      </div>
    );
  }

  // Sort players: Active first, then by status priority
  const sortedPlayers = [...players].sort((a, b) => {
    const statusOrder = {
      winner: 0,
      hoh: 1,
      pov: 2,
      active: 3,
      nom: 4,
      safe: 5,
      jury: 6,
      evicted: 7,
    };

    const aOrder = statusOrder[a.status] ?? 99;
    const bOrder = statusOrder[b.status] ?? 99;

    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="v2-primary-container-inner p-4 rounded-lg">
      <h2 className="v2-primary-subheader mb-4">
        {seasonIsActive ? "Current Houseguests" : "Cast"}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedPlayers.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            showStats={true}
            size="default"
          />
        ))}
      </div>
    </div>
  );
}
