import { Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import { getFeedHub } from "@/lib/api/feedUpdates";
import { getHouseboard } from "@/lib/api/home";
import { FeedHubHeader } from "./components/FeedHubHeader";
import { FeedHubLiveBanner } from "./components/FeedHubLiveBanner";
import { FeedHubFeatured } from "./components/FeedHubFeatured";
import { FeedHubThread } from "./components/FeedHubThread";
import { FeedHubHotPosts } from "./components/FeedHubHotPosts";
import { Sidebar } from "@/components/layout/Sidebar";
import { SubscribeWidget } from "@/components/email/SubscribeWidget";
import { seasonNumber } from "./components/feedHubName";
import "./feed-hub.css";

const sourceSerif = Source_Serif_4({ subsets: ["latin"], display: "swap", variable: "--font-source-serif-4" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap", variable: "--font-ibm-plex-mono" });

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com").replace(/\/$/, "");
const ORG_LOGO = "https://bigbrotherjunkies.com/wp-content/themes/BBJ/images/bbjlogo2020.png";

export const revalidate = false; // Webhook-driven via feed-updates tag
export const dynamicParams = true;

function buildSeo(hub) {
  const n = seasonNumber(hub?.season?.name);
  const bb = n > 0 ? `Big Brother ${n}` : "Big Brother";
  const titlePrefix = `${bb} Live Feed Updates & Spoilers`;
  const fullTitle = `${titlePrefix} | Big Brother Junkies`;
  const description = `Live, real-time ${bb} feed updates and spoilers — eviction news, comp results, alliances and house drama, updated by the Big Brother Junkies community.`;
  const ogImage = hub?.featured?.thumbnail || ORG_LOGO;
  return { titlePrefix, fullTitle, description, ogImage, url: `${SITE_URL}/live-feed-updates` };
}

export async function generateMetadata() {
  const hub = await getFeedHub();
  const { titlePrefix, fullTitle, description, ogImage, url } = buildSeo(hub);
  return {
    title: titlePrefix, // layout template appends " | Big Brother Junkies"
    description,
    alternates: { canonical: url },
    openGraph: { title: fullTitle, description, url, type: "website", images: [{ url: ogImage }] },
    twitter: { card: "summary_large_image", title: fullTitle, description, images: [ogImage] },
  };
}

export default async function FeedUpdatesPage() {
  const [hub, houseboardData] = await Promise.all([getFeedHub(), getHouseboard()]);
  const seo = buildSeo(hub);
  const houseboard = houseboardData?.houseboard;
  const recent = (hub?.thread?.updates || []).slice(0, 20);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "LiveBlogPosting",
        "@id": `${seo.url}#liveblog`,
        headline: seo.titlePrefix,
        url: seo.url,
        description: seo.description,
        ...(hub?.season?.start_date ? { datePublished: new Date(hub.season.start_date).toISOString() } : {}),
        ...(recent[0]?.modified || recent[0]?.date ? { dateModified: recent[0].modified || recent[0].date } : {}),
        ...(hub?.season?.start_date ? { coverageStartTime: new Date(hub.season.start_date).toISOString() } : {}),
        ...(!hub?.season?.is_active && hub?.season?.end_date ? { coverageEndTime: new Date(hub.season.end_date).toISOString() } : {}),
        publisher: { "@type": "Organization", name: "Big Brother Junkies", logo: { "@type": "ImageObject", url: ORG_LOGO } },
        liveBlogUpdate: recent.map((u) => ({
          "@type": "BlogPosting",
          headline: u.title,
          url: `${seo.url}/${u.slug}`,
          datePublished: u.date,
          dateModified: u.modified || u.date,
          articleBody: u.excerpt || undefined,
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Live Feed Updates", item: seo.url },
        ],
      },
    ],
  };

  return (
    <main className={`fuh-page ${sourceSerif.variable} ${plexMono.variable}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="fuh-wrap">
        <FeedHubHeader season={hub.season} counts={hub.counts} />
        <FeedHubLiveBanner houseboard={houseboard} counts={hub.counts} />
        <div className="fuh-grid">
          <div className="fuh-main">
            <FeedHubFeatured featured={hub.featured} />
            <FeedHubThread initial={hub.thread} />
          </div>
          {/* Shared site sidebar (same as homepage + feed detail pages) with hub extras injected */}
          <Sidebar sticky={false}>
            <FeedHubHotPosts hotPosts={hub.hot_posts} />
            <SubscribeWidget />
          </Sidebar>
        </div>
      </div>
    </main>
  );
}
