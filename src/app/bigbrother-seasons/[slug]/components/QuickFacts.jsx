import { Fragment } from "react";

export function QuickFacts({ season, playerCount }) {
  const fmt = (d) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD";
  const rows = [
    ["Season", season.season_number ? `BB${season.season_number}` : season.abbreviation],
    ["Start", fmt(season.start_date)],
    ["End", fmt(season.end_date)],
    season.total_days > 0 && ["Length", `${season.total_days} days`],
    ["Houseguests", String(playerCount || "")],
    season.winner?.name && ["Winner", season.winner.name],
    season.afp?.name && ["AFP", season.afp.name],
  ].filter(Boolean);
  return (
    <div className="card facts-card">
      <h4>Quick Facts</h4>
      <dl>{rows.map(([k, v]) => (<Fragment key={k}><dt>{k}</dt><dd>{v}</dd></Fragment>))}</dl>
    </div>
  );
}
