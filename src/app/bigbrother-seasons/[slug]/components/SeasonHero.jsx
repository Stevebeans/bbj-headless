/**
 * Editorial season hero — gradient banner with giant season number,
 * stat strip, and a poster card. All numeric/winner fields are conditional
 * so it degrades for active/upcoming seasons.
 */
function statusLabel(season) {
  if (season.status === "completed") return "Complete";
  if (season.status === "current" || season.is_active) return "In Progress";
  return "Upcoming";
}

export function SeasonHero({ season }) {
  const num = Number(season.season_number) || null;
  const start = season.start_date ? new Date(season.start_date) : null;
  const monthYear = start
    ? start.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="hero">
      <div className="inner">
        <div>
          <div className="kk">{num ? <b>Season {num}</b> : null}USA · CBS</div>
          <h1>{season.name}</h1>
          {season.description ? (
            <p className="sub">{season.description}</p>
          ) : null}
          <div className="stripstats">
            {season.winner?.name ? (
              <div className="s"><span className="k">Winner</span><span className="v">{season.winner.name}</span></div>
            ) : (
              <div className="s"><span className="k">Status</span><span className="v">{statusLabel(season)}</span></div>
            )}
            {season.total_days > 0 ? (
              <div className="s"><span className="k">Days</span><span className="v">{season.total_days}</span></div>
            ) : null}
            <div className="s"><span className="k">Houseguests</span><span className="v">{season.hg_count || season.player_count || ""}</span></div>
            {season.afp?.name ? (
              <div className="s"><span className="k">AFP</span><span className="v">{season.afp.name}</span></div>
            ) : null}
          </div>
          <div className="actions">
            <a className="b prim" href="/live-feed-updates/">▶ Live Feed Updates</a>
          </div>
        </div>
        <div className="poster">
          <span className="tag">Season</span>
          <div className="num">{num || season.abbreviation}</div>
          <div className="ttl">{season.abbreviation}</div>
          <div className="chip">{season.abbreviation}{monthYear ? ` · ${monthYear}` : ""}</div>
        </div>
      </div>
    </div>
  );
}
