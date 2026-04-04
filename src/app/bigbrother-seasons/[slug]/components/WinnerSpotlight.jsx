import Image from "next/image";
import Link from "next/link";

/**
 * Winner, Runner-Up, and AFP spotlight cards
 * Only shown for completed seasons
 */
export function WinnerSpotlight({ season, players }) {
  if (season.status !== "completed") return null;

  const winner = players.find((p) => p.finish_place === 1);
  const runnerUp = players.find((p) => p.finish_place === 2);
  const afp = season.afp
    ? players.find((p) => p.player_id === season.afp.id || p.id === season.afp.id)
    : null;

  if (!winner) return null;

  const cards = [
    { player: winner, label: "Winner", gradient: "from-emerald-600 to-emerald-700", icon: "👑" },
    runnerUp && { player: runnerUp, label: "Runner-Up", gradient: "from-sky-500 to-sky-600", icon: null },
    afp && { player: afp, label: "America's Favorite", gradient: "from-pink-500 to-pink-600", icon: "⭐" },
  ].filter(Boolean);

  return (
    <section id="winners" className={`grid gap-3 ${cards.length === 3 ? "grid-cols-3" : cards.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}>
      {cards.map(({ player, label, gradient, icon }) => (
        <Link
          key={player.id}
          href={player.permalink || `/bigbrother-players/${player.slug || ""}`}
          className={`bg-gradient-to-br ${gradient} rounded-lg p-4 text-center text-white hover:opacity-90 transition`}
        >
          <div className="text-[10px] uppercase tracking-wide opacity-80">{label}</div>
          {player.photo ? (
            <Image
              src={player.photo}
              alt={player.name}
              width={56}
              height={56}
              className="rounded-full mx-auto mt-2 object-cover border-2 border-white/30 w-14 h-14"
            />
          ) : (
            <div className="w-14 h-14 rounded-full mx-auto mt-2 bg-white/20 flex items-center justify-center text-xl">
              {icon || "?"}
            </div>
          )}
          <div className="font-bold text-sm mt-2">{player.name}</div>
        </Link>
      ))}
    </section>
  );
}
