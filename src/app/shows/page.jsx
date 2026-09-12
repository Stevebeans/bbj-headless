import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { PrimarySidebarWidgets } from "@/components/layout/PrimarySidebarWidgets";
import { TheFixTimeline } from "./components/TheFixTimeline";
import { SITE_URL, breadcrumbJsonLd } from "@/lib/seo";

// Pure static shell — zero server-side data fetching. All Fix data is
// CLIENT-fetched inside <TheFixTimeline /> so this page never couples to the
// site's webhook-ISR cache tags (see CLAUDE.md COST RULES / fan-favorites pattern).
export const revalidate = false;

export const metadata = {
  title: "Shows — The Fix",
  description:
    "Every reality show we cover, one timeline. Survivor spoilers and updates now, The Traitors in January.",
  alternates: { canonical: `${SITE_URL}/shows` },
  openGraph: {
    title: "Shows — The Fix",
    description:
      "Every reality show we cover, one timeline. Survivor spoilers and updates now, The Traitors in January.",
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
        <section id="main-left" className="flex-grow space-y-4">
          <article className="v2-primary-container-inner p-5 md:p-[22px]">
            {/* Hero band */}
            <div className="mb-5 pb-4 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary-500 dark:text-primary-400">
                Reality TV, mainlined — every show except the one on the front page
              </p>
              <h1 className="font-display text-3xl md:text-4xl mt-1 text-gray-900 dark:text-gray-100">
                The Fix
              </h1>
            </div>

            {/* Show-card row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <Link
                href="/shows/survivor"
                className="block rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-primary-500 dark:hover:border-primary-400 transition-colors"
              >
                <h2 className="font-display text-xl text-gray-900 dark:text-gray-100">Survivor</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Survivor 49 spoilers and updates
                </p>
              </Link>
              <div
                className="block rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4 opacity-50 cursor-default"
                aria-disabled="true"
              >
                <h2 className="font-display text-xl text-gray-900 dark:text-gray-100">The Traitors</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Coming January</p>
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
