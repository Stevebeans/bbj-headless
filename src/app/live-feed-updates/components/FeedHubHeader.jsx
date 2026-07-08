// Editorial page header: kicker, BBNN title, season/week/day/today meta.
// Server component.
export function FeedHubHeader({ season, counts }) {
  const { abbr, name, day, week } = season;
  return (
    <div className="fuh-page-h">
      <div className="fuh-ttl">
        <span className="fuh-kk">Live thread</span>
        <h1>{abbr} <em>Live Feed Updates</em></h1>
        <div className="fuh-meta">
          <span><b>Season</b>{name || "Big Brother"}</span>
          {week > 0 && (<><span>·</span><span><b>Current week</b>Week {week}</span></>)}
          {day > 0 && (<><span>·</span><span><b>Day</b>{day}</span></>)}
          <span>·</span>
          <span><b>Updates today</b>{counts.today}</span>
        </div>
      </div>
    </div>
  );
}
