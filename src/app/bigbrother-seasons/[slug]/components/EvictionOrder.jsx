import Image from "next/image";
import Link from "next/link";

/**
 * Eviction order table — shows houseguests in order of elimination
 */
export function EvictionOrder({ players, season }) {
  const ordered = players
    .filter((p) => p.finish_place !== null && p.finish_place !== undefined)
    .sort((a, b) => a.finish_place - b.finish_place);

  const stillPlaying = players.filter(
    (p) => p.finish_place === null || p.finish_place === undefined
  );

  if (ordered.length === 0 && stillPlaying.length === 0) return null;

  const seasonStart = season.start_date ? new Date(season.start_date) : null;

  return (
    <section id="eviction-order" className="v2-primary-container-inner p-4 rounded-lg">
      <h2 className="text-sm font-bold text-primary-500 uppercase tracking-wide mb-3">
        Eviction Order
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
              <th className="py-2 px-2 font-semibold text-gray-500 dark:text-gray-400 w-8">#</th>
              <th className="py-2 px-2 font-semibold text-gray-500 dark:text-gray-400">Houseguest</th>
              <th className="py-2 px-2 font-semibold text-gray-500 dark:text-gray-400 hidden sm:table-cell">Date</th>
              <th className="py-2 px-2 font-semibold text-gray-500 dark:text-gray-400 hidden sm:table-cell">Day</th>
              <th className="py-2 px-2 font-semibold text-gray-500 dark:text-gray-400">Place</th>
            </tr>
          </thead>
          <tbody>
            {ordered.map((player, idx) => {
              const evictedDate = player.evicted_date ? new Date(player.evicted_date) : null;
              const dayNum = evictedDate && seasonStart
                ? Math.ceil((evictedDate - seasonStart) / (1000 * 60 * 60 * 24)) + 1
                : null;

              return (
                <tr key={player.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition">
                  <td className="py-2 px-2 text-gray-400 tabular-nums">{idx + 1}</td>
                  <td className="py-2 px-2">
                    <Link href={player.permalink || "#"} className="flex items-center gap-2 hover:text-primary-500 transition">
                      {player.photo && (
                        <Image src={player.photo} alt={player.name} width={28} height={28}
                          className={`rounded-full object-cover ${player.game_status?.evicted ? "grayscale opacity-70" : ""}`} />
                      )}
                      <span className="font-medium">{player.name}</span>
                    </Link>
                  </td>
                  <td className="py-2 px-2 text-gray-500 hidden sm:table-cell">
                    {evictedDate ? evictedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                  </td>
                  <td className="py-2 px-2 text-gray-500 hidden sm:table-cell tabular-nums">
                    {dayNum ? `Day ${dayNum}` : "—"}
                  </td>
                  <td className="py-2 px-2">
                    <span className={getPlaceColor(player.finish_place)}>
                      {getPlaceLabel(player.finish_place)}
                    </span>
                  </td>
                </tr>
              );
            })}
            {season.is_active && stillPlaying.map((player) => (
              <tr key={player.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 px-2 text-gray-300">—</td>
                <td className="py-2 px-2">
                  <Link href={player.permalink || "#"} className="flex items-center gap-2 hover:text-primary-500 transition">
                    {player.photo && <Image src={player.photo} alt={player.name} width={28} height={28} className="rounded-full object-cover" />}
                    <span className="font-medium">{player.name}</span>
                  </Link>
                </td>
                <td className="py-2 px-2 text-green-600 hidden sm:table-cell" colSpan={2}>Still in the house</td>
                <td className="py-2 px-2 text-green-600">Active</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getPlaceLabel(place) {
  if (place === 1) return "Winner";
  if (place === 2) return "Runner-Up";
  const suffix = ["th", "st", "nd", "rd"];
  const v = place % 100;
  return `${place}${suffix[(v - 20) % 10] || suffix[v] || suffix[0]} Place`;
}

function getPlaceColor(place) {
  if (place === 1) return "text-emerald-600 font-semibold";
  if (place === 2) return "text-sky-500 font-medium";
  return "text-gray-500";
}
