import Link from "next/link";
import { SeasonTable, ProgressCell, ResultCell } from "@/components/shared";
import { GameTimeline } from "./GameTimeline";
import { playerPoints, pointsBreakdown } from "@/lib/bbPoints";

// bbPoints expects a stats bag; season rows carry the fields flat.
function seasonStats(s) {
  return { hoh: s.hoh, pov: s.pov, nom: s.nom, misc: s.misc, saved: s.saved, on_block: s.on_block };
}

/**
 * Season breakdown table for player profile
 */
export function PlayerSeasons({ seasons, className = "" }) {
  if (!seasons || seasons.length === 0) {
    return null;
  }

  const rows = seasons.map((s) => ({
    ...s,
    pts: playerPoints(seasonStats(s), s.was_evicted),
  }));

  const columns = [
    {
      key: "season_name",
      header: "Season",
      align: "left",
      render: (value, row) => {
        // Extract slug from permalink as fallback (e.g., /bigbrother-seasons/big-brother-27/)
        const slug = row.season_slug ||
          row.season_permalink?.split('/').filter(Boolean).pop() ||
          row.season_id;
        return (
          <Link
            href={`/bigbrother-seasons/${slug}`}
            className="hover:underline text-accent-red visited:text-accent-red font-medium"
          >
            {value || row.season_abbr || `Season ${row.season_id}`}
          </Link>
        );
      },
    },
    {
      key: "age_during",
      header: "Age",
      align: "center",
      className: "text-gray-600 dark:text-gray-400 tabular-nums",
    },
    {
      key: "pts",
      header: "PTS",
      align: "center",
      tooltip: "Season points: HoH 2.5, Veto 2, other comps 1, surviving a vote 1.5, saved off the block 1, nomination -1",
      className: "tabular-nums font-semibold",
      render: (value, row) => (
        <span title={row.season_id ? pointsBreakdown(seasonStats(row), row.was_evicted) : "Career total"}>
          {value}
        </span>
      ),
    },
    {
      key: "hoh",
      header: "HoH",
      align: "center",
      tooltip: "Head of Household wins",
      className: "tabular-nums",
    },
    {
      key: "pov",
      header: "PoV",
      align: "center",
      tooltip: "Power of Veto wins",
      className: "tabular-nums",
    },
    {
      key: "nom",
      header: "Nom",
      align: "center",
      tooltip: "Times nominated",
      className: "tabular-nums",
    },
    {
      key: "votes_received",
      header: "Votes",
      align: "center",
      tooltip: "Eviction votes received",
      className: "tabular-nums",
    },
    {
      key: "days_in_house",
      header: "Days",
      align: "center",
      tooltip: "Days in house",
      className: "tabular-nums",
    },
    {
      key: "progress_pct",
      header: "Progress",
      align: "center",
      render: (value) => <ProgressCell value={value} />,
    },
    {
      key: "result",
      header: "Result",
      align: "center",
      render: (value) => <ResultCell result={value} />,
    },
  ];

  // Calculate totals for footer
  const totals = rows.reduce(
    (acc, s) => ({
      season_name: `Totals (${rows.length} season${rows.length > 1 ? "s" : ""})`,
      pts: Math.round((acc.pts + (s.pts || 0)) * 10) / 10,
      hoh: acc.hoh + (s.hoh || 0),
      pov: acc.pov + (s.pov || 0),
      nom: acc.nom + (s.nom || 0),
      votes_received: acc.votes_received + (s.votes_received || 0),
      days_in_house: acc.days_in_house + (s.days_in_house || 0),
      age_during: "",
      progress_pct: "",
      result: "",
    }),
    {
      season_name: "",
      pts: 0,
      hoh: 0,
      pov: 0,
      nom: 0,
      votes_received: 0,
      days_in_house: 0,
      age_during: "",
      progress_pct: "",
      result: "",
    }
  );

  return (
    <div className={className}>
      <SeasonTable
        columns={columns}
        data={rows}
        showFooter={rows.length > 1}
        footerData={totals}
        emptyText="No season data available"
      />
      {seasons.map((s) =>
        s.weekly_timeline?.tracked && s.weekly_timeline?.has_activity ? (
          <GameTimeline
            key={`tl-${s.season_id}`}
            timeline={s.weekly_timeline}
            seasonLabel={s.season_name}
          />
        ) : null
      )}
    </div>
  );
}
