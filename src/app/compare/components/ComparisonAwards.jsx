import { Badge } from "@/components/shared";

/**
 * Side-by-side award badges comparison
 */
export function ComparisonAwards({ player1, player2 }) {
  const a1 = player1.awards || {};
  const a2 = player2.awards || {};

  const hasAnyAwards =
    a1.winner || a1.runner_up || a1.afp || a2.winner || a2.runner_up || a2.afp;

  if (!hasAnyAwards) return null;

  return (
    <section>
      <h2 className="v2-primary-subheader mb-4">Awards</h2>
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-4">
        {/* Player 1 awards */}
        <div className="flex flex-wrap justify-end gap-2">
          <AwardBadges awards={a1} />
        </div>

        {/* Divider */}
        <div className="w-px h-full bg-gray-200 dark:bg-gray-600 self-stretch" />

        {/* Player 2 awards */}
        <div className="flex flex-wrap gap-2">
          <AwardBadges awards={a2} />
        </div>
      </div>
    </section>
  );
}

function AwardBadges({ awards }) {
  const { winner, runner_up, afp } = awards || {};

  if (!winner && !runner_up && !afp) {
    return <span className="text-sm text-gray-400 dark:text-gray-500 italic">No awards</span>;
  }

  return (
    <>
      {winner && (
        <Badge variant="winner" size="md">
          Winner
        </Badge>
      )}
      {runner_up && (
        <Badge variant="runner-up" size="md">
          Runner Up
        </Badge>
      )}
      {afp && (
        <Badge variant="afp" size="md">
          America&apos;s Favorite
        </Badge>
      )}
    </>
  );
}
