import Link from "next/link";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com";

export const metadata = {
  title: "About Us",
  description:
    "Big Brother Junkies is an independent fan site covering Big Brother with daily live feed updates, spoilers, player stats, and a community of superfans.",
  openGraph: {
    title: "About Us - Big Brother Junkies",
    description:
      "Big Brother Junkies is an independent fan site covering Big Brother with daily live feed updates, spoilers, player stats, and a community of superfans.",
    url: `${SITE_URL}/about`,
    type: "website",
  },
  alternates: {
    canonical: `${SITE_URL}/about`,
  },
};

export default function AboutPage() {
  return (
    <main className="v2-primary-container">
      <div className="v2-primary-container-inner p-4 md:p-8">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-5xl text-primary-500 dark:text-primary-400 mb-4">
            About Big Brother Junkies
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            An independent fan site for people who can&apos;t look away from the
            Big Brother house.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
          <section>
            <h2 className="v2-primary-subheader mb-2">What we do</h2>
            <p>
              Big Brother Junkies has covered Big Brother for over a decade,
              built around one thing: the live feeds. During the season we post{" "}
              <Link href="/live-feed-updates" className="text-primary-600 dark:text-primary-300 hover:underline">
                live feed updates
              </Link>{" "}
              throughout the day, every day - who won the comps, who&apos;s on
              the block, which alliance just imploded at 3 AM, and everything in
              between.
            </p>
          </section>

          <section>
            <h2 className="v2-primary-subheader mb-2">The stats</h2>
            <p>
              Beyond the daily spoilers, we maintain one of the deepest Big
              Brother databases anywhere:{" "}
              <Link href="/directory" className="text-primary-600 dark:text-primary-300 hover:underline">
                every player
              </Link>{" "}
              and{" "}
              <Link href="/directory?tab=seasons" className="text-primary-600 dark:text-primary-300 hover:underline">
                every season
              </Link>{" "}
              with week-by-week results, competition wins, nominations, votes,
              and career stats. If you&apos;ve ever argued about who the best
              comp beast of all time is, this is where you settle it.
            </p>
          </section>

          <section>
            <h2 className="v2-primary-subheader mb-2">The community</h2>
            <p>
              The comments are the heart of this site. Junkies vote for their{" "}
              <Link href="/fan-favorites" className="text-primary-600 dark:text-primary-300 hover:underline">
                fan favorites
              </Link>
              , debate every eviction, and hang out in the daily threads all
              season long. You can also{" "}
              <Link href="/search" className="text-primary-600 dark:text-primary-300 hover:underline">
                Ask the Bean
              </Link>{" "}
              - our resident know-it-all - anything about Big Brother history.
            </p>
          </section>

          <section>
            <h2 className="v2-primary-subheader mb-2">Who runs this</h2>
            <p>
              The site is run by Steve, a lifelong Big Brother superfan, with
              help from a small crew of fellow junkies who keep the updates
              flowing when the feeds go off the rails. We&apos;re not affiliated
              with CBS or the show - we&apos;re fans, doing this because we love
              it.
            </p>
          </section>

          <section>
            <h2 className="v2-primary-subheader mb-2">Support the site</h2>
            <p>
              Big Brother Junkies is reader-supported. If you want to ditch the
              ads and help keep the feeds watched, check out{" "}
              <Link href="/become-supporter" className="text-primary-600 dark:text-primary-300 hover:underline">
                becoming a supporter
              </Link>
              . Questions or business inquiries?{" "}
              <Link href="/contact" className="text-primary-600 dark:text-primary-300 hover:underline">
                Get in touch
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
