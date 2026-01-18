import Image from "next/image";

/**
 * Player hero section with photo, name, and nickname
 * Similar layout to PostHero but adapted for player profiles
 */
export function PlayerHero({ player }) {
  const { name, nickname, photo, banner } = player;

  // Use banner if available, otherwise use a gradient background
  const hasBanner = banner?.url;

  return (
    <div className="relative">
      {/* Banner/Background */}
      <div
        className={`relative h-32 md:h-48 ${!hasBanner ? "bg-gradient-to-r from-primary-500 to-primary-600" : ""}`}
      >
        {hasBanner && (
          <Image
            src={banner.url}
            alt=""
            fill
            className="object-cover"
            priority
          />
        )}
        {/* Overlay gradient for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Content overlay */}
      <div className="relative px-4 pb-4 -mt-16 md:-mt-20">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          {/* Profile Photo */}
          <div className="relative flex-shrink-0">
            {photo?.url ? (
              <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-xl overflow-hidden border-4 border-white dark:border-gray-900 shadow-lg">
                <Image
                  src={photo.url}
                  alt={`${name} profile picture`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 112px, 144px"
                  priority
                />
              </div>
            ) : (
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-xl bg-gray-300 dark:bg-gray-600 border-4 border-white dark:border-gray-900 shadow-lg flex items-center justify-center">
                <span className="text-4xl font-bold text-gray-500 dark:text-gray-400">
                  {name?.charAt(0) || "?"}
                </span>
              </div>
            )}
          </div>

          {/* Name and Nickname */}
          <div className="flex-grow pb-2">
            <h1 className="font-display text-2xl md:text-4xl text-primary-500 dark:text-primary-400">
              {name}
            </h1>
            {nickname && (
              <p className="font-hand text-xl md:text-2xl text-gray-600 dark:text-gray-400">
                &ldquo;{nickname}&rdquo;
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
