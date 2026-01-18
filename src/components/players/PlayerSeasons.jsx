import Link from "next/link";
import { SeasonTable, ProgressCell, ResultCell } from "@/components/shared";

/**
 * Season breakdown table for player profile
 */
export function PlayerSeasons({ seasons, className = "" }) {
  if (!seasons || seasons.length === 0) {
    return null;
  }

  const columns = [
    {
      key: "season_name",
      header: "Season",
      align: "left",
      render: (value, row) => (
        <Link
          href={row.season_permalink || `/seasons/${row.season_id}`}
          className="hover:underline text-accent-red visited:text-accent-red font-medium"
        >
          {value || row.season_abbr || `Season ${row.season_id}`}
        </Link>
      ),
    },
    {
      key: "age_during",
      header: "Age",
      align: "center",
      className: "text-gray-600 dark:text-gray-400 tabular-nums",
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
  const totals = seasons.reduce(
    (acc, s) => ({
      season_name: `Totals (${seasons.length} season${seasons.length > 1 ? "s" : ""})`,
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
        data={seasons}
        showFooter={seasons.length > 1}
        footerData={totals}
        emptyText="No season data available"
      />
    </div>
  );
}
