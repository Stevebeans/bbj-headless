import { redirect, notFound } from "next/navigation";
import { getPaginatedPosts } from "@/lib/api/posts";
import { getHouseboard } from "@/lib/api/home";
import { Sidebar } from "@/components/layout/Sidebar";
import { SubscribeWidget } from "@/components/email/SubscribeWidget";
import { SpoilerBarWrapper } from "@/components/spoiler-bar/SpoilerBarWrapper";
import { Pagination } from "@/components/ui/Pagination";
import { FreestarSlot } from "@/components/ads/FreestarSlot";
import {
  SectionHeader,
  StoryCard,
  Houseboard,
  SocialFollow,
  WatchLiveFeeds,
} from "@/components/home";

const PER_PAGE = 20;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "";

export const revalidate = false; // Webhook-driven via posts tag
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }) {
  const { page } = await params;
  const n = Number.parseInt(page, 10);
  return {
    title: `Big Brother Stories & News — Page ${n}`,
    description:
      "Browse all Big Brother news, recaps, and analysis posts from Big Brother Junkies.",
    alternates: {
      canonical: `${SITE_URL}/page/${n}`,
    },
  };
}

export default async function ArchivePage({ params }) {
  const { page: pageParam } = await params;
  const pageNum = Number.parseInt(pageParam, 10);

  if (!Number.isFinite(pageNum) || pageNum < 1) notFound();
  if (pageNum === 1) redirect("/");

  const [data, houseboardData] = await Promise.all([
    getPaginatedPosts({ page: pageNum, perPage: PER_PAGE }),
    getHouseboard(),
  ]);

  if (!data.posts.length) notFound();
  if (data.totalPages > 0 && pageNum > data.totalPages) notFound();

  const batch1 = data.posts.slice(0, 4);    // cards 1–4
  const batch2 = data.posts.slice(4, 12);   // cards 5–12
  const batch3 = data.posts.slice(12);      // cards 13–20

  return (
    <>
      <SpoilerBarWrapper />
      <main className="v2-primary-container">
        <div className="flex w-full flex-col lg:flex-row lg:gap-4 dark:text-gray-200">
          <section id="main-left" className="flex-grow space-y-4">
            <article className="v2-primary-container-inner p-5 md:p-[22px]">
              <SectionHeader as="h1">
                Big Brother Stories &amp; News — Page {pageNum}
              </SectionHeader>

              <div className="space-y-4">
                {batch1.map((post) => (
                  <StoryCard key={post.id} post={post} />
                ))}
              </div>

              {batch1.length === 4 && batch2.length > 0 && (
                <FreestarSlot
                  placementName="bigbrotherjunkies_middle_feed"
                  slotId="archive_inline_1"
                  showBranding={false}
                  className="my-4"
                />
              )}

              {batch2.length > 0 && (
                <div className="mt-4 space-y-4">
                  {batch2.map((post) => (
                    <StoryCard key={post.id} post={post} />
                  ))}
                </div>
              )}

              {batch1.length + batch2.length >= 12 && batch3.length > 0 && (
                <FreestarSlot
                  placementName="bigbrotherjunkies_middle_feed"
                  slotId="archive_inline_2"
                  showBranding={false}
                  className="my-4"
                />
              )}

              {batch3.length > 0 && (
                <div className="mt-4 space-y-4">
                  {batch3.map((post) => (
                    <StoryCard key={post.id} post={post} />
                  ))}
                </div>
              )}

              <Pagination
                currentPage={pageNum}
                totalPages={data.totalPages}
                basePath="/page"
              />
            </article>
          </section>

          <Sidebar sticky={true}>
            <Houseboard
              houseboard={houseboardData.houseboard}
              seasonName={houseboardData.season?.name}
            />
            <SocialFollow />
            <WatchLiveFeeds />
            <SubscribeWidget />
          </Sidebar>
        </div>
      </main>
    </>
  );
}
