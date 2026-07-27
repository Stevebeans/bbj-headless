import Link from "next/link";
import { getCareerStats } from "@/lib/api/players";
import { CareerTable } from "@/components/stats/CareerTable";
import { SITE_URL, breadcrumbJsonLd } from "@/lib/seo";

export const revalidate = 3600;

export const metadata = {
  title: "Big Brother Stats Hub - All-Time Records",
  description:
    "All-time Big Brother stats: career points, most HoH and veto wins, most nominations survived, most days in the house, and full sortable career stats for every houseguest.",
  openGraph: {
    title: "Big Brother Stats Hub | Big Brother Junkies",
    description:
      "All-time Big Brother records and sortable career stats for every houseguest.",
    url: `${SITE_URL}/stats`,
    type: "website",
  },
  alternates: {
    canonical: `${SITE_URL}/stats`,
  },
};

const BOARDS = [
  { key: "points", title: "Career Points", tip: "HoH 2.5, Veto 2, other comps 1, surviving the block 1, veto save 0.5, nomination -1" },
  { key: "hoh", title: "Most HoH Wins" },
  { key: "pov", title: "Most Veto Wins" },
  { key: "nom", title: "Most Nominations" },
  { key: "survived", title: "Most Evictions Survived" },
  { key: "votes_received", title: "Most Votes Received" },
  { key: "days", title: "Most Days in the House" },
  { key: "seasons", title: "Most Seasons Played" },
];

function TopList({ players, statKey, title, tip }) {
  const top = [...players]
    .filter((p) => (p[statKey] || 0) > 0)
    .sort((a, b) => (b[statKey] || 0) - (a[statKey] || 0))
    .slice(0, 10);
  if (top.length === 0) return null;

  return (
    <div className="v2-primary-container-inner p-4">
      <h2 className="v2-primary-subheader mb-2" title={tip}>{title}</h2>
      <ol className="space-y-1">
        {top.map((p, i) => (
          <li key={p.id} className="flex items-baseline gap-2 text-sm">
            <span className="w-5 shrink-0 text-right font-bold text-gray-400 tabular-nums">
              {i + 1}
            </span>
            <Link
              href={`/bigbrother-players/${p.slug}`}
              className="truncate hover:underline text-primary-600 dark:text-primary-300"
            >
              {p.name}
            </Link>
            {p.is_winner && <span title="Season winner" aria-label="Season winner">👑</span>}
            <span className="ml-auto font-semibold tabular-nums">{p[statKey]}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default async function StatsPage() {
  const players = await getCareerStats();

  const breadcrumb = {
    "@context": "https://schema.org",
    ...breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Stats", path: "/stats" },
    ]),
  };

  return (
    <main className="v2-primary-container">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <div className="space-y-4">
        <div className="v2-primary-container-inner p-4 md:p-8 text-center">
          <h1 className="font-display text-4xl md:text-5xl text-primary-500 dark:text-primary-400 mb-3">
            Big Brother Stats Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            All-time records across every season - who really ran the house.
            Click any player for their full profile, or dig through the{" "}
            <Link href="/directory" className="text-primary-600 dark:text-primary-300 hover:underline">
              player directory
            </Link>{" "}
            and{" "}
            <Link href="/fan-favorites" className="text-primary-600 dark:text-primary-300 hover:underline">
              fan favorites tracker
            </Link>
            .
          </p>
        </div>

        {players.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {BOARDS.map((b) => (
                <TopList
                  key={b.key}
                  players={players}
                  statKey={b.key}
                  title={b.title}
                  tip={b.tip}
                />
              ))}
            </div>

            <div className="v2-primary-container-inner p-4">
              <h2 className="v2-primary-subheader mb-3">Every Houseguest</h2>
              <CareerTable players={players} />
              <p className="mt-3 text-xs text-gray-500 italic">
                Points: HoH 2.5, Veto 2, other comps 1, surviving the block 1,
                veto save 0.5, nomination -1. Stats aggregate each player&apos;s
                season-by-season records.
              </p>
            </div>
          </>
        ) : (
          <div className="v2-primary-container-inner p-8 text-center text-gray-500">
            Stats are loading - check back in a moment.
          </div>
        )}
      </div>
    </main>
  );
}
