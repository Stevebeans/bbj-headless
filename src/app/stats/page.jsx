import Link from "next/link";
import { getCareerStats } from "@/lib/api/players";
import { getAllSeasonSlugs } from "@/lib/api/seasons";
import { CareerTable, Crown } from "@/components/stats/CareerTable";
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
  { key: "points", title: "Career Points", unit: "pts", tip: "HoH 2.5, Veto 2, other comps 1, surviving the block 1, veto save 0.5, nomination -1" },
  { key: "hoh", title: "Most HoH Wins", unit: "wins" },
  { key: "pov", title: "Most Veto Wins", unit: "wins" },
  { key: "nom", title: "Most Nominations", unit: "noms" },
  { key: "survived", title: "Most Evictions Survived", unit: "survived" },
  { key: "votes_received", title: "Most Votes Received", unit: "votes" },
  { key: "days", title: "Most Days in the House", unit: "days" },
  { key: "seasons", title: "Most Seasons Played", unit: "seasons" },
];

// Top-3 row tints from the design: gold-tinted #1, neutral wash #2-3.
const RANK_BAR = {
  0: "bg-[#FDF1DE] dark:bg-amber-500/15",
  1: "bg-[#F5F7F9] dark:bg-white/10",
  2: "bg-[#F5F7F9] dark:bg-white/10",
};

function TopList({ players, statKey, title, unit, tip }) {
  const top = [...players]
    .filter((p) => (p[statKey] || 0) > 0)
    .sort((a, b) => (b[statKey] || 0) - (a[statKey] || 0))
    .slice(0, 10);
  if (top.length === 0) return null;
  const max = top[0][statKey] || 1;

  return (
    <section className="flex flex-col rounded-[10px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-gray-200 dark:border-gray-700 px-4 pb-3 pt-3.5">
        <h2
          className="font-osw text-[14.5px] font-semibold uppercase tracking-[.05em] text-gray-900 dark:text-gray-100"
          title={tip}
        >
          {title}
        </h2>
        <span className="whitespace-nowrap font-plexMono text-[9px] uppercase tracking-[.09em] text-gray-500 dark:text-gray-400">
          {unit}
        </span>
      </div>
      <ol className="py-1.5">
        {top.map((p, i) => (
          <li key={p.id} className="relative grid grid-cols-[20px_1fr_auto] items-center gap-2 px-4 py-1.5">
            <span
              className={`absolute bottom-0.5 left-0 top-0.5 rounded-r-[3px] ${
                RANK_BAR[i] || "bg-[#F3F1EA] dark:bg-white/5"
              }`}
              style={{ width: `${Math.max(6, ((p[statKey] || 0) / max) * 100)}%` }}
              aria-hidden="true"
            />
            <span
              className={`relative text-right font-plexMono text-[11px] font-semibold ${
                i === 0 ? "text-secondary-600" : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {i + 1}
            </span>
            <Link
              href={`/bigbrother-players/${p.slug}`}
              className={`relative flex min-w-0 items-center truncate text-[13.5px] hover:text-primary-500 dark:hover:text-secondary-400 hover:underline ${
                i === 0
                  ? "font-semibold text-gray-900 dark:text-gray-100"
                  : "text-gray-700 dark:text-gray-300"
              }`}
            >
              <span className="truncate">{p.name}</span>
              {p.is_winner && <Crown />}
            </Link>
            <span className="relative font-plexMono text-[12.5px] font-semibold text-gray-900 dark:text-gray-100">
              {p[statKey]}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default async function StatsPage() {
  const [players, seasonSlugs] = await Promise.all([
    getCareerStats(),
    getAllSeasonSlugs().catch(() => []),
  ]);

  const compsLogged = players.reduce(
    (n, p) => n + (p.hoh || 0) + (p.pov || 0) + (p.misc || 0),
    0
  );
  const topPoints = players.reduce((m, p) => Math.max(m, p.points || 0), 0);
  const seasonCount = seasonSlugs.length || null;

  const heroFacts = [
    seasonCount && { n: seasonCount, l: "Seasons" },
    { n: players.length, l: "Houseguests" },
    { n: compsLogged.toLocaleString(), l: "Comps logged" },
    { n: topPoints, l: "Top career pts" },
  ].filter(Boolean);

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
      <div className="mb-4">
        {/* Hero band */}
        <section className="relative mb-5 overflow-hidden rounded-xl bg-primary-500 px-5 py-6 md:px-8 md:py-8">
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(115deg, rgba(255,255,255,.07) 0%, transparent 55%)" }}
            aria-hidden="true"
          />
          <span className="font-plexMono text-[10.5px] font-semibold uppercase tracking-[.14em] text-secondary-500">
            All-time records{seasonCount ? ` · seasons 1-${seasonCount}` : ""}
          </span>
          <h1 className="mb-2.5 mt-2 font-osw text-3xl font-semibold uppercase leading-none tracking-tight text-white md:text-[42px]">
            Big Brother Stats Hub
          </h1>
          <p className="max-w-[600px] font-serifBody text-[16px] leading-normal text-white/80">
            Who really ran the house. Every record across every season - click
            any player for their full profile, or dig through the{" "}
            <Link
              href="/directory"
              className="border-b border-secondary-500/40 font-semibold text-secondary-500 hover:border-white hover:text-white"
            >
              player directory
            </Link>{" "}
            and{" "}
            <Link
              href="/fan-favorites"
              className="border-b border-secondary-500/40 font-semibold text-secondary-500 hover:border-white hover:text-white"
            >
              fan favorites tracker
            </Link>
            .
          </p>
          <div className="mt-5 flex flex-wrap gap-6 border-t border-white/15 pt-5 md:gap-8">
            {heroFacts.map((f) => (
              <div key={f.l} className="flex flex-col gap-1">
                <span className="font-osw text-[26px] font-semibold leading-none text-white">{f.n}</span>
                <span className="font-plexMono text-[9.5px] uppercase tracking-[.11em] text-white/55">{f.l}</span>
              </div>
            ))}
          </div>
        </section>

        {players.length > 0 ? (
          <>
            {/* Leaderboard cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {BOARDS.map((b) => (
                <TopList
                  key={b.key}
                  players={players}
                  statKey={b.key}
                  title={b.title}
                  unit={b.unit}
                  tip={b.tip}
                />
              ))}
            </div>

            {/* Full table */}
            <CareerTable players={players} />

            <p className="mb-2 mt-6 text-center font-plexMono text-[10px] uppercase tracking-[.05em] text-gray-500 dark:text-gray-400">
              Records compiled by BBJ · not affiliated with CBS
            </p>
          </>
        ) : (
          <div className="rounded-[10px] border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center font-serifBody italic text-gray-500">
            Stats are loading - check back in a moment.
          </div>
        )}
      </div>
    </main>
  );
}
