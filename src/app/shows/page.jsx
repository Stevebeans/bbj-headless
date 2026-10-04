import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { PrimarySidebarWidgets } from "@/components/layout/PrimarySidebarWidgets";
import { TheFixTimeline } from "./components/TheFixTimeline";
import { ShowHero } from "./components/ShowHero";
import { Torch, Candle } from "./components/ShowArt";
import "./shows.css";
import { SURVIVOR_SEASON } from "@/lib/shows";
import { SITE_URL, breadcrumbJsonLd } from "@/lib/seo";

// Pure static shell — zero server-side data fetching. All Fix data is
// CLIENT-fetched inside <TheFixTimeline /> so this page never couples to the
// site's webhook-ISR cache tags (see CLAUDE.md COST RULES / fan-favorites pattern).
export const revalidate = false;

const TITLE = "Shows — The Fix";
const DESCRIPTION =
  "Every reality show we cover, one timeline. Survivor spoilers and updates now, The Traitors in January.";

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/shows` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/shows`,
    type: "website",
  },
};

export default function ShowsHubPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    ...breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Shows", path: "/shows" },
    ]),
  };

  return (
    <main className="v2-primary-container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="flex w-full flex-col mb-4 lg:flex-row lg:gap-4 dark:text-gray-200">
        {/* Main Content */}
        <section id="main-left" className="flex-grow min-w-0 space-y-4">
          <ShowHero
            show="hub"
            kicker="Reality TV, mainlined"
            title={<em>The Fix</em>}
            tagline="Every reality show we're watching, in one feed. Spoilers, blindsides and the buzz, all season long."
          >
            <div className="shw-ticker" aria-label="Now airing">
              <span><b className="shw-live">● On air</b> Survivor {SURVIVOR_SEASON} · Wednesdays on CBS</span>
              <span><b>Next up</b> The Traitors · January</span>
            </div>
          </ShowHero>

          <article className="v2-primary-container-inner p-5 md:p-[22px]">
            {/* Season-card tiles */}
            <div className="shw-tiles mb-7">
              <Link href="/shows/survivor" className="shw-tile" data-show="survivor">
                <span className="shw-badge">On air</span>
                <span className="shw-tile-art"><Torch /></span>
                <h2>Survivor</h2>
                <p>Season {SURVIVOR_SEASON} spoilers, boots and blindsides.</p>
                <span className="shw-go">Enter the island →</span>
              </Link>
              <div className="shw-tile is-locked" data-show="traitors" aria-disabled="true">
                <span className="shw-badge is-soon">Coming January</span>
                <Candle className="shw-tile-art" />
                <h2>The Traitors</h2>
                <p>The round table opens in the new year.</p>
                <span className="shw-go">Sharpen your suspicions</span>
              </div>
              <Link href="/contact" className="shw-tile is-ask">
                <h2>Pick our next show</h2>
                <p>Which reality show should we cover next? Tell us.</p>
                <span className="shw-go">Make your pitch →</span>
              </Link>
            </div>

            <div className="shw-sec-h">
              <div>
                <h2>The <em>latest</em></h2>
                <p className="shw-sub">Every show, newest first</p>
              </div>
            </div>

            {/* Cross-show timeline */}
            <TheFixTimeline show="any" />
          </article>
        </section>

        {/* Sidebar — client-fetched primary widget stack (non-sticky) */}
        <Sidebar sticky={false}>
          <PrimarySidebarWidgets />
        </Sidebar>
      </div>
    </main>
  );
}
