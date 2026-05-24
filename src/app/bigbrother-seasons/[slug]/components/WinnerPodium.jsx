import Image from "next/image";
import Link from "next/link";

function initials(name = "") { return name.trim().slice(0, 2).toUpperCase() || "XX"; }

function PodiumCard({ player, cls, label, role, prize }) {
  if (!player) return null;
  const s = player.stats || {};
  return (
    <div className={`p ${cls}`}>
      <Link href={player.permalink || `/bigbrother-players/${player.slug || ""}`}>
        <div className="pc" {...(!player.photo ? { "data-i": initials(player.name) } : {})}>
          {player.photo ? (
            <Image src={player.photo} alt={player.name} fill style={{ objectFit: "cover" }} sizes="240px" />
          ) : null}
          <span className="lbl">{label}</span>
        </div>
        <div className="body">
          <div className="name">{player.name}</div>
          <div className="role">{role}</div>
          <div className="nums">
            <span><b>{s.hoh || 0}</b>HoH</span>
            <span><b>{s.pov || 0}</b>PoV</span>
            <span><b>{s.nom || 0}</b>Nom</span>
          </div>
          {prize ? <div className="prize">{prize}</div> : null}
        </div>
      </Link>
    </div>
  );
}

export function WinnerPodium({ season, players }) {
  if (season.status !== "completed") return null;
  const winner = players.find((p) => p.finish_place === 1);
  if (!winner) return null;
  const runnerUp = players.find((p) => p.finish_place === 2);
  const afp = season.afp ? players.find((p) => p.player_id === season.afp.id || p.id === season.afp.id) : null;

  return (
    <section id="winners">
      <div className="sech"><h2>Top 3 &amp; AFP</h2><span className="sub">How the season ended</span></div>
      <div className="podium">
        <PodiumCard player={runnerUp} cls="r" label="2nd · Runner-up" role="Final 2" />
        <PodiumCard player={winner} cls="w" label="★ Winner" role={`${season.abbreviation} Winner`} prize={season.prize} />
        <PodiumCard player={afp} cls="a" label="AFP" role="America's Favorite" />
      </div>
    </section>
  );
}
