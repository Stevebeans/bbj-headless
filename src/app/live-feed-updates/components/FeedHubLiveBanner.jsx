// Dark "On the Feeds Now" banner: live HoH/Veto/Block + today/week/season counts.
// Server component. Live status from houseboard; counts from hub.
export function FeedHubLiveBanner({ houseboard, counts }) {
  const hohName = houseboard?.hoh?.[0]?.name;
  const vetoName = houseboard?.pov?.[0]?.name;
  const blockNames = (houseboard?.nominees || []).map((n) => n.name).slice(0, 3).join(" · ");
  const hoh = hohName || "—";
  const veto = vetoName || "—";
  const block = blockNames || "—";
  const hasLive = Boolean(hohName || vetoName);

  return (
    <div className="fuh-livebar">
      <span className="fuh-pulse">On the Feeds Now</span>
      <div className="fuh-summary">
        {hasLive ? (
          <>HoH <b>{hoh}</b> · Veto holder <b>{veto}</b>{blockNames && <> · On the block <b>{block}</b></>}</>
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
