import Link from "next/link";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com";

export const metadata = {
  title: "Advertise With Us",
  description:
    "Reach a dedicated audience of Big Brother superfans. Advertising and sponsorship opportunities on Big Brother Junkies.",
  openGraph: {
    title: "Advertise With Us - Big Brother Junkies",
    description:
      "Reach a dedicated audience of Big Brother superfans. Advertising and sponsorship opportunities on Big Brother Junkies.",
    url: `${SITE_URL}/advertise`,
    type: "website",
  },
  alternates: {
    canonical: `${SITE_URL}/advertise`,
  },
};

export default function AdvertisePage() {
  return (
    <main className="v2-primary-container">
      <div className="v2-primary-container-inner p-4 md:p-8">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl md:text-5xl text-primary-500 dark:text-primary-400 mb-4">
            Advertise With Us
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Put your brand in front of one of the most dedicated reality TV
            audiences on the internet.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
          <section>
            <h2 className="v2-primary-subheader mb-2">The audience</h2>
            <p>
              Big Brother Junkies readers aren&apos;t casual viewers - they
              follow the live feeds around the clock, visit multiple times a
              day during the season, and come back year after year. Our
              coverage runs all summer during Big Brother, with an engaged
              community that reads, comments, and votes daily.
            </p>
          </section>

          <section>
            <h2 className="v2-primary-subheader mb-2">Opportunities</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Display advertising</strong> - standard placements
                across the site, served programmatically.
              </li>
              <li>
                <strong>Direct sponsorships</strong> - sponsor the live feed
                updates, the fan favorites tracker, or a season of coverage.
              </li>
              <li>
                <strong>Newsletter placement</strong> - reach subscribers who
                get our updates straight to their inbox.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="v2-primary-subheader mb-2">Get in touch</h2>
            <p>
              Tell us what you have in mind and we&apos;ll send over current
              traffic numbers and options.{" "}
              <Link href="/contact" className="text-accent-red hover:underline">
                Contact us here
              </Link>{" "}
              and choose business inquiry - we typically respond within a
              business day.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
