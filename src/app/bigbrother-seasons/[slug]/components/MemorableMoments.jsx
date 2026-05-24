import Link from "next/link";

/** Quote precedence mirrors the PHP: excerpt → title. */
function quoteOf(u) {
  return (u.excerpt && u.excerpt.trim()) || (u.title && u.title.trim()) || "";
}

export function MemorableMoments({ updates }) {
  if (!updates?.length) return null;
  return (
    <section id="memories">
      <div className="sech"><h2>Memorable Moments</h2><span className="sub">From the live feeds</span></div>
      <div className="memories">
        {updates.map((u) => {
          const q = quoteOf(u);
          if (!q) return null;
          const date = u.date ? new Date(u.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
          return (
            <Link key={u.id} className="mem" href={`/live-feed-updates/${u.slug}`}>
              <div className="qt">{q}</div>
              <div className="att"><span>{date}</span><b>{u.time || ""}</b></div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
