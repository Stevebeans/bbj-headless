import Link from "next/link";
import { SectionHeader } from "./SectionHeader";
import { StoryCard } from "./StoryCard";
import { FreestarSlot } from "@/components/ads/FreestarSlot";

export function MoreStories({ posts = [], heroId = null }) {
  const filteredPosts = heroId
    ? posts.filter((post) => post.id !== heroId)
    : posts;

  if (filteredPosts.length === 0) return null;

  const before = filteredPosts.slice(0, 5);
  const after = filteredPosts.slice(5);

  return (
    <section
      id="more-stories"
      className="v2-primary-container-inner p-5 md:p-[22px]"
      aria-labelledby="more-stories-heading"
    >
      <SectionHeader id="more-stories-heading">
        More Big Brother Stories &amp; News
      </SectionHeader>

      <div className="space-y-4">
        {before.map((post) => (
          <StoryCard key={post.id} post={post} />
        ))}
      </div>

      {before.length === 5 && after.length > 0 && (
        <FreestarSlot
          placementName="bigbrotherjunkies_middle_feed"
          slotId="more_stories_inline"
          showBranding={false}
          className="my-4"
        />
      )}

      {after.length > 0 && (
        <div className="mt-4 space-y-4">
          {after.map((post) => (
            <StoryCard key={post.id} post={post} />
          ))}
        </div>
      )}

      <p className="mt-4 text-right">
        <Link
          href="/page/2"
          className="font-osw uppercase tracking-wider text-sm text-primary-500 dark:text-secondary-500 hover:underline"
        >
          See more stories &amp; news →
        </Link>
      </p>
    </section>
  );
}
