import Image from "next/image";

/**
 * Get badge color based on status/result
 */
function getStatusStyle(status) {
  switch (status) {
    case "Winner":
      return "bg-yellow-500 text-white";
    case "Runner Up":
      return "bg-slate-400 text-white";
    case "AFP":
      return "bg-pink-500 text-white";
    case "Jury":
      return "bg-indigo-500 text-white";
    case "Evicted":
      return "bg-red-500/80 text-white";
    case "Active":
      return "bg-emerald-500 text-white";
    default:
      return "bg-white/20 text-white border border-white/30";
  }
}

/**
 * Extract season number from abbreviation (e.g., "BB27" → "27", "CBB3" → "3")
 */
function extractSeasonNumber(abbr) {
  if (!abbr) return null;
  const match = abbr.match(/\d+/);
  return match ? match[0] : null;
}

/**
 * Get display status from result
 */
function getDisplayStatus(result) {
  // Keep special results as-is
  if (result === "Winner" || result === "Runner Up" || result === "AFP") {
    return result === "AFP" ? "America's Favorite" : result;
  }
  // Map other results to simpler status
  if (result === "Jury") return "Jury";
  if (result === "Evicted") return "Evicted";
  // No result means still active
  return "Active";
}

/**
 * Player hero section with photo, name, and nickname
 * Uses banner (blurred) or photo as background for visual interest
 */
export function PlayerHero({ player }) {
  const { name, nickname, photo, banner, seasons, awards } = player;

  // Use banner if available (blurred), otherwise use player photo as blurred background
  const hasBanner = banner?.url;
  const hasPhoto = photo?.url;
  const backgroundImage = hasBanner ? banner.url : hasPhoto ? photo.url : null;

  // Check for special status (for photo badge)
  const isWinner = awards?.winner;

  return (
    <div className="relative">
      {/* Banner/Background */}
      <div className="relative h-44 md:h-60 overflow-hidden">
        {/* Background layer - always blurred */}
        {backgroundImage ? (
          <>
            <Image
              src={backgroundImage}
              alt=""
              fill
              className="object-cover scale-110 blur-xl"
              priority
            />
            {/* Color overlay to tint the blur */}
            <div className="absolute inset-0 bg-primary-700/60 mix-blend-multiply" />
          </>
        ) : (
          /* Fallback gradient */
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700" />
        )}

        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />

        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Season badges - top right */}
        {seasons?.length > 0 && (
          <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
            {seasons.map((season, index) => {
              const seasonNumber = extractSeasonNumber(season.season_abbr);
              const displayStatus = getDisplayStatus(season.result);
              // TODO: Add finish_position when available in database
              const place = season.finish_position ? ` - ${season.finish_position}` : "";

              return (
                <span
                  key={season.season_id || index}
                  className={`px-3 py-1.5 backdrop-blur-sm rounded text-xs font-bold ${getStatusStyle(displayStatus === "America's Favorite" ? "AFP" : displayStatus)}`}
                >
                  Season {seasonNumber || season.season_abbr} ({displayStatus}{place})
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Content section with blue background - sits below banner */}
      <div className="relative px-4 pb-4 pt-2 bg-gradient-to-b from-primary-600 to-primary-600/70">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Profile Photo - pulls up into banner */}
          <div className="relative flex-shrink-0 -mt-24 md:-mt-28">
            {hasPhoto ? (
              <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl ring-4 ring-primary-500/20">
                <Image
                  src={photo.url}
                  alt={`${name} profile picture`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 128px, 160px"
                  priority
                />
              </div>
            ) : (
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 border-4 border-white dark:border-gray-800 shadow-xl flex items-center justify-center">
                <span className="text-5xl font-bold text-gray-400 dark:text-gray-500">
                  {name?.charAt(0) || "?"}
                </span>
              </div>
            )}
            {/* Status ring for winners */}
            {isWinner && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            )}
          </div>

          {/* Name and Nickname */}
          <div className="flex-grow pb-2">
            <h1 className="font-display text-3xl md:text-5xl text-white drop-shadow-lg">
              {name}
            </h1>
            {nickname && (
              <p className="font-hand text-xl md:text-2xl text-secondary-400 drop-shadow">
                &ldquo;{nickname}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
