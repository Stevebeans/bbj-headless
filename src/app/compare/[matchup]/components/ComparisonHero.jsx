import Image from "next/image";
import Link from "next/link";

/**
 * Side-by-side hero section with both player photos and names
 * Always visible (not behind premium gate)
 */
export function ComparisonHero({ player1, player2 }) {
  return (
    <div className="relative overflow-hidden rounded-t-lg">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800" />

      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative px-4 py-8 md:py-12">
        <div className="flex items-center justify-center gap-4 md:gap-8">
          {/* Player 1 */}
          <PlayerSide player={player1} align="right" />

          {/* VS Badge */}
          <div className="flex-shrink-0">
            <div className="w-14 h-14 md:w-18 md:h-18 rounded-full bg-secondary-500 flex items-center justify-center shadow-lg border-4 border-white/20">
              <span className="font-display text-xl md:text-2xl font-bold text-white">VS</span>
            </div>
          </div>

          {/* Player 2 */}
          <PlayerSide player={player2} align="left" />
        </div>
      </div>
    </div>
  );
}

function PlayerSide({ player, align }) {
  const { name, nickname, photo, slug, awards } = player;
  const isWinner = awards?.winner;
  const textAlign = align === "right" ? "text-right" : "text-left";
  const flexDir = align === "right" ? "flex-row-reverse" : "flex-row";

  return (
    <div className={`flex-1 flex ${flexDir} items-center gap-3 md:gap-5 min-w-0`}>
      {/* Photo */}
      <Link href={`/bigbrother-players/${slug}`} className="flex-shrink-0 group">
        <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-xl overflow-hidden border-3 border-white/30 shadow-xl group-hover:border-secondary-400 transition-colors">
          {photo?.url ? (
            <Image
              src={photo.url}
              alt={`${name} profile`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 80px, 112px"
              priority
            />
          ) : (
            <div className="w-full h-full bg-primary-400 flex items-center justify-center">
              <span className="text-2xl md:text-4xl font-bold text-white/60">
                {name?.charAt(0) || "?"}
              </span>
            </div>
          )}
          {isWinner && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
              <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </div>
          )}
        </div>
      </Link>

      {/* Name */}
      <div className={`min-w-0 ${textAlign}`}>
        <Link
          href={`/bigbrother-players/${slug}`}
          className="hover:text-secondary-400 transition-colors"
        >
          <h2 className="font-display text-lg md:text-2xl lg:text-3xl text-white truncate drop-shadow-lg">
            {name}
          </h2>
        </Link>
        {nickname && (
          <p className="font-hand text-sm md:text-lg text-secondary-400 truncate drop-shadow">
            &ldquo;{nickname}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}
