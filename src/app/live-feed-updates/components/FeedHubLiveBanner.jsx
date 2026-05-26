// Dark "On the Feeds Now" banner: live HoH/Veto/Block + today/week/season counts.
// Server component. Live status from houseboard; counts from hub.
export function FeedHubLiveBanner({ houseboard, counts }) {
  const hoh = houseboard?.hoh?.[0]?.name || "—";
  const veto = houseboard?.pov?.[0]?.name || "—";
  const block = (houseboard?.nominees || []).map((n) => n.name).slice(0, 3).join(" · ") || "—";
  const hasLive = hoh !== "—" || veto !== "—";

  return (
    <div className="fuh-livebar">
      <span className="fuh-pulse">On the Feeds Now</span>
      <div className="fuh-summary">
        {hasLive ? (
          <>HoH <b>{hoh}</b> · Veto holder <b>{veto}</b>{block !== "—" && <> · On the block <b>{block}</b></>}</>
        ) : (
          <>Feeds rolling — {counts.today} updates posted today.</>
        )}
      </div>
      <div className="fuh-stats">
        <span><b>{counts.today}</b>today</span>
        <span><b>{counts.week}</b>this week</span>
        <span><b>{counts.season}</b>season</span>
      </div>
    </div>
  );
}
