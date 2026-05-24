import Image from "next/image";
import Link from "next/link";

function initials(name = "") { return name.trim().slice(0, 2).toUpperCase() || "—"; }

/** A faces cell — small avatar(s) + name, or an em-dash when empty. */
function CompCell({ people }) {
  if (!people?.length) return <span className="cell empty">—</span>;
  return (
    <>
      {people.map((p) => (
        <Link key={p.id} className="cell" href={p.slug ? `/bigbrother-players/${p.slug}` : "#"} title={p.name}>
          {p.photo
            ? <Image className="a" src={p.photo} alt="" width={24} height={24} style={{ objectFit: "cover", borderRadius: "50%" }} />
            : <span className="a">{initials(p.name)}</span>}
          {p.name}
        </Link>
      ))}
    </>
  );
}

export function CompWinnersTable({ weeks }) {
  if (!weeks?.length) return null;
  const sorted = [...weeks].sort((a, b) => (Number(a.week_num) || 0) - (Number(b.week_num) || 0));
  const hasFaces = sorted.some((w) => {
    const f = w.faces || {};
    return f.hoh?.length || f.pov?.length || f.noms?.length || f.evicted?.length;
  });
  if (!hasFaces) return null;

  return (
    <section id="comps">
      <div className="sech"><h2>Competition Winners</h2><span className="sub">HoH, Veto &amp; noms each week</span></div>
      <div className="comptable">
        <table>
          <thead><tr><th>Week</th><th>Head of Household</th><th>Power of Veto</th><th>Nominees</th><th>Evicted</th></tr></thead>
          <tbody>
            {sorted.map((w) => {
              const f = w.faces || {};
              return (
                <tr key={w.week_num}>
                  <td className="wkhead">W{w.week_num}</td>
                  <td><CompCell people={f.hoh} /></td>
                  <td><CompCell people={f.pov} /></td>
                  <td><CompCell people={f.noms} /></td>
                  <td><CompCell people={f.evicted} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
