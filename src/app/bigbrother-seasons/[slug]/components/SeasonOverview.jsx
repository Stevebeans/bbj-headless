/**
 * Season overview paragraph — editorial description with auto-generated fallback
 */
export function SeasonOverview({ season, playerCount }) {
  const description = season.description || generateFallback(season, playerCount);

  return (
    <section id="overview" className="v2-primary-container-inner p-4 rounded-lg">
      <h2 className="text-sm font-bold text-primary-500 uppercase tracking-wide mb-2">
        Season Overview
      </h2>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        {description}
      </p>
    </section>
  );
}

function generateFallback(season, playerCount) {
  const start = season.start_date
    ? new Date(season.start_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "TBD";
  const end = season.end_date
    ? new Date(season.end_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "TBD";

  let text = `${season.name} premiered on ${start} with ${playerCount} houseguests.`;

  if (season.total_days > 0) {
    text += ` The season lasted ${season.total_days} days, concluding on ${end}.`;
  }

  if (season.winner) {
    text += ` ${season.winner.name} was crowned the winner`;
    if (season.runner_up) {
      text += `, defeating ${season.runner_up.name} in the final vote`;
    }
    text += ".";
  }

  if (season.afp) {
    text += ` ${season.afp.name} was named America's Favorite Player.`;
  }

  return text;
}
