import Image from "next/image";
import Link from "next/link";
import { FaHeart } from "react-icons/fa";
import { toRelativeHref } from "@/lib/utils/url";

/**
 * FavoritePlayerCard - Displays user's favorite Big Brother player
 *
 * @param {Object} player - Player data from API
 */
export default function FavoritePlayerCard({ player }) {
  if (!player) return null;

  const { name, nickname, display_name, seasons, photo_url, permalink } = player;

  const content = (
    <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
      {/* Player photo */}
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 flex-shrink-0">
        {photo_url ? (
          <Image
            src={photo_url}
            alt={name}
            width={80}
            height={80}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <FaHeart className="w-6 h-6" />
          </div>
        )}
      </div>

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 dark:text-white text-base sm:text-lg">
          {nickname && (
            <span className="text-primary-500 dark:text-primary-400">
              &quot;{nickname}&quot;{" "}
            </span>
          )}
          {name}
        </p>
        {seasons && (
          <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
            {seasons}
          </p>
        )}
      </div>
    </div>
  );

  // Wrap in link if permalink exists
  if (permalink) {
    return <Link href={toRelativeHref(permalink)}>{content}</Link>;
  }

  return content;
}
