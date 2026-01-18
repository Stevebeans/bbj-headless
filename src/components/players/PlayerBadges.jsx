import { Badge } from "@/components/shared";

/**
 * Display award badges for players (Winner, Runner Up, AFP)
 */
export function PlayerBadges({ awards, className = "" }) {
  const { winner, runner_up, afp } = awards || {};

  // Don't render if no awards
  if (!winner && !runner_up && !afp) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
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
    </div>
  );
}
