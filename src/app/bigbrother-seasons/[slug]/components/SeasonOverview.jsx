import { Fragment } from "react";

/** Season overview — editorial copy + a "Season Facts" card. */
export function SeasonOverview({ season, playerCount }) {
  const description = season.description || generateFallback(season, playerCount);
  const fmt = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : null;

  const facts = [
    ["Season", season.season_number ? `BB${season.season_number}` : season.abbreviation],
    ["Premiere", fmt(season.start_date)],
    ["Finale", fmt(season.end_date)],
    season.total_days > 0 && ["Length", `${season.total_days} days`],
    ["Houseguests", String(playerCount || "")],
    season.winner?.name && ["Winner", season.winner.name],
  ].filter(Boolean);

  return (
    <section id="overview">
      <div className="sech"><h2>Season Overview</h2><span className="sub">At a glance</span></div>
      <div className="overview">
        <div className="copy"><p className="lead">{description}</p></div>
        <div className="facts">
          <h4>Season Facts</h4>
          <dl>
            {facts.map(([k, v]) => (
              <Fragment key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </Fragment>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

function generateFallback(season, playerCount) {
  const fmt = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "TBD";
  let text = `${season.name} premiered on ${fmt(season.start_date)} with ${playerCount} houseguests.`;
  if (season.total_days > 0)
    text += ` The season lasted ${season.total_days} days, concluding on ${fmt(season.end_date)}.`;
  if (season.winner) {
    text += ` ${season.winner.name} was crowned the winner`;
    if (season.runner_up) text += `, defeating ${season.runner_up.name} in the final vote`;
    text += ".";
  }
  if (season.afp) text += ` ${season.afp.name} was named America's Favorite Player.`;
  return text;
}
