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

function resolvePerson(players, ref) {
  if (!ref) return null;
  const full = players.find((p) => p.id === ref.id || p.player_id === ref.id) || {};
  return {
    name: full.name || ref.name,
    slug: full.slug || ref.slug,
    permalink: full.permalink || ref.permalink,
    photo: full.photo || ref.photo,
    stats: full.stats || {},
  };
}

export function WinnerPodium({ season, players }) {
  if (season.status !== "completed") return null;
  const winner = resolvePerson(players, season.winner);
  if (!winner) return null;
  const runnerUp = resolvePerson(players, season.runner_up);
  const afp = resolvePerson(players, season.afp);

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
