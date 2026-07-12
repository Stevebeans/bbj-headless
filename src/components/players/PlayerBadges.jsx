import { Badge } from "@/components/shared";

/**
 * Display award badges (Winner, Runner Up, AFP) plus career comp-count
 * badges (Nx HoH / Nx PoV / Nx Nominated) when `totals` is provided.
 */
export function PlayerBadges({ awards, totals, className = "" }) {
  const { winner, runner_up, afp } = awards || {};
  const counts = [
    { n: totals?.hoh, label: "HoH" },
    { n: totals?.pov, label: "PoV" },
    { n: totals?.nom, label: "Nominated" },
  ].filter((c) => c.n > 0);

  if (!winner && !runner_up && !afp && counts.length === 0) {
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
      {counts.map((c) => (
        <Badge key={c.label} variant="default" size="md">
          {c.n}&times; {c.label}
        </Badge>
      ))}
    </div>
  );
}
