import Image from "next/image";
import Link from "next/link";

function initials(name = "") { return name.trim().slice(0, 2).toUpperCase() || "XX"; }
function ordinal(n) {
  const s = ["th", "st", "nd", "rd"], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
function matches(p, id) { return id && (p.id === id || p.player_id === id); }

export function CastGrid({ players, season }) {
  if (!players?.length) return null;
  const winnerId = season.winner?.id || null;
  const runnerUpId = season.runner_up?.id || null;
  const afpId = season.afp?.id || null;

  function rank(p) {
    if (matches(p, winnerId)) return 1;
    if (matches(p, runnerUpId)) return 2;
    return p.finish_place ?? 999;
  }
  function tagFor(p) {
    if (matches(p, winnerId)) return ["win", "Winner"];
    if (matches(p, runnerUpId)) return ["ru", "2nd"];
    if (matches(p, afpId)) return ["afp", "AFP"];
    if (p.game_status?.jury) return ["jury", "Jury"];
    if (!p.game_status?.evicted) return ["pre", "Active"];
    return ["pre", "Out"];
  }
  function subOf(p) {
    if (matches(p, winnerId)) return "Winner";
    if (matches(p, runnerUpId)) return "Runner-up";
    return p.finish_place ? ordinal(p.finish_place) : "Active";
  }

  const sorted = [...players].sort((a, b) => {
    const ra = rank(a), rb = rank(b);
    if (ra !== rb) return ra - rb;
    return a.name.localeCompare(b.name);
  });

  return (
    <section id="cast">
      <div className="sech"><h2>Cast of {season.abbreviation}</h2><span className="sub">{players.length} houseguests</span></div>
      <div className="castgrid">
        {sorted.map((p) => {
          const [tagCls, tagText] = tagFor(p);
          const display = p.first_name || p.name;
          return (
            <Link key={p.id} className="c" href={p.permalink || `/bigbrother-players/${p.slug || ""}`} title={p.name}>
              <div className="face" {...(!p.photo ? { "data-i": initials(display) } : {})}>
                {p.photo ? <Image src={p.photo} alt={p.name} fill style={{ objectFit: "cover" }} sizes="120px" /> : null}
                <span className={`tag ${tagCls}`}>{tagText}</span>
              </div>
              <div className="n">{display}</div>
              <div className="s">{subOf(p)}</div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
