import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { PrimarySidebarWidgets } from "@/components/layout/PrimarySidebarWidgets";
import { TheFixTimeline } from "../components/TheFixTimeline";
import { SITE_URL, breadcrumbJsonLd } from "@/lib/seo";

// Pure static shell — zero server-side data fetching. All Fix data is
// CLIENT-fetched inside <TheFixTimeline /> so this page never couples to the
// site's webhook-ISR cache tags (see CLAUDE.md COST RULES / fan-favorites pattern).
export const revalidate = false;

export const metadata = {
  title: "Survivor 49 Spoilers & Updates",
  description:
    "Survivor 49 spoilers, live updates, and the buzz from the fandom — The Fix, filtered to Survivor.",
  alternates: { canonical: `${SITE_URL}/shows/survivor` },
  openGraph: {
    title: "Survivor 49 Spoilers & Updates",
    description:
      "Survivor 49 spoilers, live updates, and the buzz from the fandom — The Fix, filtered to Survivor.",
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
        <section id="main-left" className="flex-grow space-y-4">
          <article className="v2-primary-container-inner p-5 md:p-[22px]">
            {/* Hero band */}
            <div className="mb-5 pb-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-500 dark:text-primary-400">
                Reality TV, mainlined — every show except the one on the front page
              </p>
              <h1 className="font-display text-3xl md:text-4xl mt-1 text-gray-900 dark:text-gray-100">
                Survivor
              </h1>
            </div>

            {/* Show-filtered timeline */}
            <TheFixTimeline show="survivor" />

            {/* More Survivor articles (category exists on prod; renders a
                graceful empty state when there are no posts yet, so this
                link never 404s — verified against src/app/category/[...slug]/page.jsx) */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                href="/category/survivor"
                className="block rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-primary-500 dark:hover:border-primary-400 transition-colors"
              >
                <h2 className="font-display text-xl text-gray-900 dark:text-gray-100">
                  More Survivor
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Read Survivor 49 articles and recaps
                </p>
              </Link>
            </div>
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
