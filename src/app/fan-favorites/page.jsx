import { Sidebar } from "@/components/layout/Sidebar";
import { PrimarySidebarWidgets } from "@/components/layout/PrimarySidebarWidgets";
import { SectionHeader } from "@/components/home/SectionHeader";
import { TrackerClient } from "./TrackerClient";

// Pure static shell — zero server-side data fetching. All vote data is
// CLIENT-fetched inside <TrackerClient /> so this page never couples to the
// site's webhook-ISR cache tags (see Global Constraints COST RULES).
export const revalidate = false;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com";

export const metadata = {
  title: "BB28 Fan Favorite Tracker (AFP Voting)",
  description: "Live standings, daily history — powered by BBJ reader votes.",
  alternates: { canonical: `${SITE_URL}/fan-favorites` },
  openGraph: {
    title: "BB28 Fan Favorite Tracker (AFP Voting)",
    description: "Live standings, daily history — powered by BBJ reader votes.",
    url: `${SITE_URL}/fan-favorites`,
    type: "website",
  },
};

export default function FanFavoritesPage() {
  return (
    <main className="v2-primary-container">
      <div className="flex w-full flex-col mb-4 lg:flex-row lg:gap-4 dark:text-gray-200">
        {/* Main Content */}
        <section id="main-left" className="flex-grow space-y-4">
          <article className="v2-primary-container-inner p-5 md:p-[22px]">
            <SectionHeader as="h1">BB28 Fan Favorite Tracker</SectionHeader>
            <p className="-mt-2 mb-5 text-gray-600 dark:text-gray-400">
              Live standings, daily history — powered by BBJ reader votes.
            </p>

            <TrackerClient />

            {/* Footer copy block — Steve's exact wording */}
            <p className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
              To vote: visit your favorite player&apos;s page and click the ♥. You can change your
              vote as your opinion on the player changes.
            </p>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              How scoring works: rank the whole cast with the list on this page. Your #1 pick earns
              15 points, #2 earns 10, #3 earns 7, #4 earns 5, #5 earns 3, and everyone else on your
              list earns 1. The ♥ on a player&apos;s page adds a bonus 15-point top vote. Supporter
              votes count 2x and Full Bean votes count 3x.
            </p>
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
