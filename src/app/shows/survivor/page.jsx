import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { PrimarySidebarWidgets } from "@/components/layout/PrimarySidebarWidgets";
import { TheFixTimeline } from "../components/TheFixTimeline";
import { ShowHero } from "../components/ShowHero";
import { PostShowUpdateButton } from "../components/PostShowUpdateButton";
import { Torch } from "../components/ShowArt";
import "../shows.css";
import { SURVIVOR_SEASON } from "@/lib/shows";
import { SITE_URL, breadcrumbJsonLd } from "@/lib/seo";

// Pure static shell — zero server-side data fetching. All Fix data is
// CLIENT-fetched inside <TheFixTimeline /> so this page never couples to the
// site's webhook-ISR cache tags (see CLAUDE.md COST RULES / fan-favorites pattern).
export const revalidate = false;

const TITLE = `Survivor ${SURVIVOR_SEASON} Spoilers & Updates`;
const DESCRIPTION =
  `Survivor ${SURVIVOR_SEASON} spoilers, live updates, and the buzz from the fandom — The Fix, filtered to Survivor.`;

export const metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/shows/survivor` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/shows/survivor`,
    type: "website",
  },
};

export default function SurvivorShowPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    ...breadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Shows", path: "/shows" },
      { name: "Survivor", path: "/shows/survivor" },
    ]),
  };

  return (
    <main className="v2-primary-container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="flex w-full flex-col mb-4 lg:flex-row lg:gap-4 dark:text-gray-200">
        {/* Main Content */}
        <section id="main-left" className="flex-grow min-w-0 space-y-4">
          <ShowHero
            show="survivor"
            live
            kicker="On air · The Fix"
            title={<>Survivor <span className="shw-num">{SURVIVOR_SEASON}</span></>}
            tagline="Spoilers, boots and blindsides. Updated all season."
            chips={[
              { strong: "Wed", label: "8/7c on CBS" },
              { label: `Season ${SURVIVOR_SEASON}` },
              { label: "Spoilers inside" },
            ]}
            torches={3}
          >
            <nav className="shw-subnav" aria-label="Survivor sections">
              <a href="#updates" className="on">Updates</a>
              <Link href="/category/survivor">Recaps &amp; Articles</Link>
              <span title="Coming soon">Cast · Soon</span>
              <Link href="/shows">All shows</Link>
            </nav>
          </ShowHero>

          <article id="updates" className="v2-primary-container-inner p-5 md:p-[22px] scroll-mt-24">
            <div className="shw-sec-h">
              <div>
                <h2>Island <em>updates</em></h2>
                <p className="shw-sub">Newest first · Survivor only</p>
              </div>
              <PostShowUpdateButton show="survivor" label="Post a Survivor update" />
            </div>

            {/* Show-filtered timeline */}
            <TheFixTimeline show="survivor" />

            {/* More Survivor articles (category exists on prod; renders a
                graceful empty state when there are no posts yet, so this
                link never 404s — verified against src/app/category/[...slug]/page.jsx) */}
            <Link href="/category/survivor" className="shw-more">
              <span className="shw-more-ic" aria-hidden="true"><Torch /></span>
              <div>
                <h3>Read the recaps</h3>
                <p>Survivor {SURVIVOR_SEASON} episode recaps, articles and analysis</p>
              </div>
              <span className="shw-arrow" aria-hidden="true">→</span>
            </Link>
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
