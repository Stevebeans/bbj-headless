import { Sidebar } from "@/components/layout/Sidebar";
import { PrimarySidebarWidgets } from "@/components/layout/PrimarySidebarWidgets";
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
            {/* h1 + subtitle render inside TrackerClient, prefixed with the
                current season from the tracker payload (client-fetched). */}
            <TrackerClient />

            {/* Footer copy block */}
            <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 space-y-3">
              <p>
                <strong className="text-gray-700 dark:text-gray-300">To vote:</strong> visit your
                favorite player&apos;s page and click the ♥. You can change your vote as your
                opinion on the player changes.
              </p>
              <p>
                <strong className="text-gray-700 dark:text-gray-300">How scoring works:</strong>{" "}
                rank the whole cast with the list on this page.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your #1 pick earns 15 points, #2 earns 10, #3 earns 7, #4 earns 5, #5 earns 3.</li>
                <li>Everyone else on your list earns 1 point.</li>
                <li>The ♥ on a player&apos;s page adds a bonus 15-point top vote.</li>
                <li>Supporter votes count 1.5x and Full Bean votes count 2x.</li>
              </ul>
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
