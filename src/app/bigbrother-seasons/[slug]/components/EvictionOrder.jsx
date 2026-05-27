import Image from "next/image";
import { formalName } from "./playerName";
import { toRelativeHref } from "@/lib/utils/url";

/**
 * Eviction order table — shows houseguests in order of elimination
 */

/** Round 28px avatar — player photo, falling back to initials (styled by .evtable .hg .a). */
function HgAvatar({ player }) {
  if (player.photo) {
    return (
      <Image className="a" src={player.photo} alt="" width={28} height={28} style={{ objectFit: "cover" }} />
    );
  }
  return <span className="a">{(player.name || "XX").slice(0, 2).toUpperCase()}</span>;
}

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
    <section id="evictions">
      <div className="sech"><h2>Eviction Order</h2><span className="sub">Week by week</span></div>
      <div className="evtable">
        <table>
          <thead><tr><th>#</th><th>Houseguest</th><th>Date</th><th>Day</th><th>Place</th></tr></thead>
          <tbody>
            {ordered.map((player, idx) => {
              const evictedDate = player.evicted_date ? new Date(player.evicted_date) : null;
              const dayNum = evictedDate && seasonStart
                ? Math.ceil((evictedDate - seasonStart) / 86400000) + 1 : null;
              return (
                <tr key={player.id}>
                  <td className="wk">{idx + 1}</td>
                  <td>
                    <a className="hg" href={player.permalink ? toRelativeHref(player.permalink) : "#"}>
                      <HgAvatar player={player} />{formalName(player)}
                    </a>
                  </td>
                  <td className="day">{evictedDate ? evictedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</td>
                  <td className="day">{dayNum ? `Day ${dayNum}` : "—"}</td>
                  <td><span className={getPlaceColor(player.finish_place)}>{getPlaceLabel(player.finish_place)}</span></td>
                </tr>
              );
            })}
            {season.is_active && stillPlaying.map((player) => (
              <tr key={player.id}>
                <td className="wk">—</td>
                <td>
                  <a className="hg" href={player.permalink ? toRelativeHref(player.permalink) : "#"}>
                    <HgAvatar player={player} />{formalName(player)}
                  </a>
                </td>
                <td className="day" colSpan={2}>Still in the house</td>
                <td><span className="typ fin">Active</span></td>
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
