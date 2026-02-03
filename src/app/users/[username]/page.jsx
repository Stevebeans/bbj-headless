import { notFound } from "next/navigation";
import { getUserProfileByUsername } from "@/lib/api/users";
import { bbjdFetch } from "@/lib/api/wordpress";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  UserProfileHero,
  FavoritePlayerCard,
  CommentHistoryList,
} from "@/components/users";
import { FaHeart, FaComments } from "react-icons/fa";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com";

// Render on-demand (layout reads cookies for auth)
export const dynamic = "force-dynamic";

/**
 * Generate SEO metadata for user profile page
 */
export async function generateMetadata({ params }) {
  const { username } = await params;
  const data = await getUserProfileByUsername(username);

  if (!data?.success || !data?.profile) {
    return { title: "User Not Found" };
  }

  const { profile } = data;
  const title = `${profile.name} (@${profile.username}) - Big Brother Junkies`;
  const description = profile.bio
    ? `${profile.bio.substring(0, 150)}${profile.bio.length > 150 ? "..." : ""}`
    : `${profile.name} is a Big Brother Junkies community member with ${profile.stats.comments} comments and ${profile.stats.karma} karma.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/users/${profile.username}`,
      type: "profile",
      images: profile.avatar
        ? [
            {
              url: profile.avatar,
              width: 128,
              height: 128,
              alt: `${profile.name}'s avatar`,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    alternates: {
      canonical: `${SITE_URL}/users/${profile.username}`,
    },
  };
}

/**
 * Fetch initial comments for server-side rendering
 */
async function getInitialComments(userId) {
  try {
    const response = await bbjdFetch(`/users/${userId}/comments?page=1&per_page=10`, {
      tags: ["user-comments", `user-${userId}-comments`],
      revalidate: 60,
    });
    return response;
  } catch {
    return { success: false, comments: [], pagination: { has_more: false } };
  }
}

/**
 * User Profile Page
 */
export default async function UserProfilePage({ params }) {
  const { username } = await params;
  const data = await getUserProfileByUsername(username);

  if (!data?.success || !data?.profile) {
    notFound();
  }

  const { profile } = data;

  // Fetch initial comments server-side
  const commentsData = await getInitialComments(profile.id);
  const initialComments = commentsData.success ? commentsData.comments : [];
  const hasMoreComments = commentsData.success ? commentsData.pagination.has_more : false;

  return (
    <main className="v2-primary-container">
      <div className="flex w-full flex-col mb-4 lg:flex-row lg:gap-4 dark:text-gray-200">
        {/* Main Content */}
        <section id="main-left" className="flex-grow space-y-4">
          {/* Hero section */}
          <UserProfileHero profile={profile} />

          {/* Bio section */}
          {profile.bio && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">
                About
              </h2>
              <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Favorite player section */}
          {profile.favorite_player && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                <FaHeart className="w-4 h-4 text-red-500" />
                Favorite Player
              </h2>
              <FavoritePlayerCard player={profile.favorite_player} />
            </div>
          )}

          {/* Comment history section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <FaComments className="w-4 h-4 text-primary-500" />
              Comment History
            </h2>
            <CommentHistoryList
              userId={profile.id}
              initialComments={initialComments}
              initialHasMore={hasMoreComments}
            />
          </div>
        </section>

        {/* Sidebar */}
        <Sidebar />
      </div>
    </main>
  );
}
