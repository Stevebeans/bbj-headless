import Image from "next/image";

/**
 * Season header with banner image, name, and status chips
 */
export function SeasonHeader({ season, playerCount }) {
  // Calculate player counts
  const activeCount = playerCount || 0;

  return (
    <div className="v2-primary-container-inner rounded-lg overflow-hidden">
      {/* Banner Image */}
      {season.banner_image && (
        <div className="relative h-48 md:h-64">
          <Image
            src={season.banner_image}
            alt={season.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-500/80 to-transparent" />
        </div>
      )}

      {/* Header Content */}
      <div className={`bg-primary-500 p-4 ${!season.banner_image ? "rounded-t-lg" : ""}`}>
        <h1 className="text-2xl md:text-4xl font-display text-white">
          {season.name} - Season Hub
        </h1>

        {/* Status Chips */}
        <div className="flex mt-3 flex-wrap gap-2">
          {/* Day Counter */}
          {season.total_days > 0 && (
            <div className="rounded-xl px-3 py-1 text-xs font-medium bg-secondary-500 text-primary-500">
              Day {season.days_elapsed}/{season.total_days}
            </div>
          )}

          {/* Houseguest Count */}
          <div className="rounded-xl px-3 py-1 text-xs font-medium bg-blue-200 text-primary-500">
            Houseguests: {activeCount}
          </div>

          {/* Season Status */}
          <div
            className={`rounded-xl px-3 py-1 text-xs font-medium ${
              season.status === "current"
                ? "bg-green-200 text-green-800"
                : season.status === "completed"
                ? "bg-gray-200 text-gray-700"
                : "bg-yellow-200 text-yellow-800"
            }`}
          >
            {season.status === "current"
              ? "Now Airing"
              : season.status === "completed"
              ? "Completed"
              : "Upcoming"}
          </div>
        </div>
      </div>
    </div>
  );
}
