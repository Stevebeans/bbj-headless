import { Sidebar } from "@/components/layout/Sidebar";
import { FreestarSlot } from "@/components/ads/FreestarSlot";
import { SpoilerBarWrapper } from "@/components/spoiler-bar/SpoilerBarWrapper";
import { SubscribeWidget } from "@/components/email/SubscribeWidget";
import { getHomepageData } from "@/lib/api/home";
import {
  Hero,
  LiveFeedUpdates,
  MoreStories,
  SeasonStats,
  RecentComments,
  HouseStrip,
  HousePulse,
} from "@/components/home";
import { LiveThreadBanner } from "@/components/home/LiveThreadBanner";

const isStaging = process.env.VERCEL_ENV === "preview" || process.env.NEXT_PUBLIC_SITE_URL?.includes("stg-");

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com").replace(/\/$/, "");
const ORG_LOGO = "https://bigbrotherjunkies.com/wp-content/themes/BBJ/images/bbjlogo2020.png";

// The /homepage API has no dedicated currentSeason block; the season name lives
// on the seasonStats/houseboard/hero sections. Derive the number from whichever
// is present so the title + H1 always carry the latest season (e.g. 27).
function deriveSeason(data) {
  const name =
    data?.seasonStats?.season?.name ||
    data?.houseboard?.season?.name ||
    data?.hero?.season?.name ||
    "";
  const n = parseInt(String(name).match(/\d+/)?.[0] || "", 10);
  return { number: Number.isFinite(n) && n > 0 ? n : 0, full_name: name || "Big Brother" };
}

function buildHomeSeo(data) {
  const season = deriveSeason(data);
  const bb = season.number > 0 ? `Big Brother ${season.number}` : "Big Brother";
  const titlePrefix = `${bb} Spoilers, News & More`;
  const fullTitle = `${titlePrefix} | Big Brother Junkies`;
  const description = `Get the latest ${bb} spoilers, live feed updates, eviction results, comp winners, and news — updated in real time by the Big Brother Junkies community.`;
  const ogImage =
    data?.hero?.post?.featured_image?.desktop ||
    data?.hero?.post?.featured_image?.mobile ||
    ORG_LOGO;
  return { season, titlePrefix, fullTitle, description, ogImage, url: `${SITE_URL}/` };
}

export async function generateMetadata() {
  const { titlePrefix, fullTitle, description, ogImage, url } = buildHomeSeo(await getHomepageData());
  return {
    title: titlePrefix, // layout template appends " | Big Brother Junkies"
    description,
    alternates: { canonical: url },
    openGraph: { title: fullTitle, description, url, type: "website", images: [{ url: ogImage }] },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [ogImage] },
  };
}

export default async function HomePage() {
  const data = await getHomepageData();
  const seo = buildHomeSeo(data);

  const heroPostId = data.hero.post?.id;
  const posts = data.posts.posts || [];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: `${SITE_URL}/`,
        name: "Big Brother Junkies",
        description: seo.description,
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Big Brother Junkies",
        url: `${SITE_URL}/`,
        logo: { "@type": "ImageObject", url: ORG_LOGO },
        sameAs: [
          "https://www.facebook.com/bigbrotherjunkies",
          "https://www.instagram.com/bigbrotherjunky/",
        ],
      },
      {
        "@type": "CollectionPage",
        "@id": `${SITE_URL}/#webpage`,
        url: `${SITE_URL}/`,
        name: seo.fullTitle,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        description: seo.description,
        breadcrumb: { "@id": `${SITE_URL}/#breadcrumb` },
      },
      {
        "@type": "BreadcrumbList",
        "@id": `${SITE_URL}/#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SpoilerBarWrapper />
      <main className="v2-primary-container">
        {isStaging && (
          <div className="mb-4 rounded-lg border border-secondary-500/30 bg-secondary-500/10 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
            <strong className="text-secondary-600 dark:text-secondary-400">Heads up!</strong>{" "}
            This is the staging server, so things may load slower than the real site. If something seems off, try refreshing a couple times to clear stale data. Performance won't be an issue on the live site.
          </div>
        )}
        <div className="flex w-full flex-col lg:flex-row lg:gap-4 dark:text-gray-200">
          <section id="main-left" className="flex-grow space-y-4">
            <LiveThreadBanner />
            {data.hero.post && (
              <Hero post={data.hero.post} season={seo.season} />
            )}

            <HouseStrip
              houseboard={data.houseboard.houseboard}
              season={data.houseboard.season}
            />

            <HousePulse housePulse={data.housePulse} />

            <FreestarSlot placementName="bigbrotherjunkies_incontent_reusable" />

            <LiveFeedUpdates updates={data.feedUpdates.updates} />

            <FreestarSlot placementName="bigbrotherjunkies_incontent_reusable_Homepage2" />

            <MoreStories posts={posts} heroId={heroPostId} />
          </section>

          <Sidebar sticky={false}>
            <SeasonStats
              season={data.seasonStats.season}
              players={data.seasonStats.players}
            />
            <SubscribeWidget />
            <RecentComments comments={data.recentComments.comments} />
          </Sidebar>
        </div>
      </main>
    </>
  );
}
