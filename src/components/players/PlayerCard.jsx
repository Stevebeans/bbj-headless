import Image from "next/image";
import Link from "next/link";

// Status color classes for card borders and backgrounds
const statusBorderClasses = {
  winner: "border-emerald-500",
  hoh: "border-emerald-500",
  pov: "border-yellow-500",
  nom: "border-red-500",
  jury: "border-indigo-500",
  evicted: "border-slate-400",
  active: "border-slate-200 dark:border-slate-700",
  safe: "border-green-400",
  runner_up: "border-sky-500",
  afp: "border-pink-500",
};

const statusBgClasses = {
  winner: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  hoh: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  pov: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  nom: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  jury: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400",
  evicted: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  active: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  safe: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  runner_up: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  afp: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
};

/**
 * Reusable player card component for season pages, player grids, etc.
 */
export function PlayerCard({ player, showStats = true, size = "default" }) {
  const status = player.status || "active";
  const borderClass = statusBorderClasses[status] || statusBorderClasses.active;
  const badgeClass = statusBgClasses[status] || statusBgClasses.active;

  const isEvicted = status === "evicted";
  const isJury = status === "jury";

  const cardContent = (
    <article
      className={`
        rounded-xl border-2 bg-white dark:bg-slate-800 shadow-sm
        hover:shadow-md transition-shadow
        ${borderClass}
        ${size === "compact" ? "p-2" : "p-3"}
      `}
    >
      <div className={`grid gap-2 ${size === "compact" ? "grid-cols-[50px_1fr]" : "grid-cols-[75px_1fr]"}`}>
        {/* Player Photo */}
        <div className="relative flex-shrink-0">
          {player.photo ? (
            <Image
              src={player.photo}
              alt={player.name}
              width={size === "compact" ? 50 : 75}
              height={size === "compact" ? 50 : 75}
              className={`
                rounded-lg object-cover
                ${size === "compact" ? "h-[50px] w-[50px]" : "h-[75px] w-[75px]"}
                ${isEvicted ? "grayscale opacity-70" : ""}
                ${isJury ? "grayscale-[50%] opacity-80" : ""}
              `}
            />
          ) : (
            <div
              className={`
                rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center
                text-slate-500 font-bold
                ${size === "compact" ? "h-[50px] w-[50px] text-lg" : "h-[75px] w-[75px] text-xl"}
              `}
            >
              {player.first_name?.charAt(0) || "?"}
            </div>
          )}

          {/* Status Badge on Image */}
          <div className="absolute bottom-0.5 right-0.5 flex flex-wrap gap-0.5">
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${badgeClass}`}>
              {player.status_label || status}
            </span>
          </div>
        </div>

        {/* Player Info */}
        <div className="flex-grow min-w-0">
          <h3 className={`font-semibold truncate ${size === "compact" ? "text-xs" : "text-sm"}`}>
            {player.name}
            {player.nickname && (
              <span className="text-gray-500 font-normal font-hand ml-1">
                &quot;{player.nickname}&quot;
              </span>
            )}
          </h3>

          {size !== "compact" && (
            <div className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-400">
              {player.age > 0 && <span>Age: {player.age}</span>}
              {player.age > 0 && player.hometown && <span> • </span>}
              {player.hometown && <span>{player.hometown}</span>}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        {showStats && player.stats && size !== "compact" && (
          <div className="col-span-2">
            <div className="mt-1 grid grid-cols-4 gap-1 text-center">
              <StatBox label="HOH" value={player.stats.hoh} />
              <StatBox label="POV" value={player.stats.pov} />
              <StatBox label="NOM" value={player.stats.nom} />
              <StatBox label="Votes" value={player.stats.votes_received} />
            </div>
          </div>
        )}
      </div>
    </article>
  );

  // Wrap in Link if permalink exists
  if (player.permalink) {
    // Convert full URL to local path
    let href = player.permalink;
    try {
      const url = new URL(player.permalink);
      href = url.pathname;
    } catch {
      // Already a path, use as-is
    }

    return (
      <Link href={href} className="block">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

function StatBox({ label, value }) {
  return (
    <div className="rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 py-0.5">
      <div className="text-xs font-semibold tabular-nums">{value || 0}</div>
      <div className="text-[9px] text-slate-500">{label}</div>
    </div>
  );
}
