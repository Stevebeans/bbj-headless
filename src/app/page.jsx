import { SpoilerBar } from "@/components/spoiler-bar/SpoilerBar";
import { PostCard } from "@/components/posts/PostCard";
import { Sidebar } from "@/components/layout/Sidebar";
import { AdPlaceholder } from "@/components/ads/AdPlaceholder";
import { getPosts } from "@/lib/api/posts";
import { getSpoilerBar } from "@/lib/api/spoiler-bar";

export default async function HomePage() {
  let posts = [];
  let spoilerData = [];

  try {
    const results = await Promise.all([
      getPosts({ limit: 10 }),
      getSpoilerBar(),
    ]);
    posts = results[0];
    spoilerData = results[1];
  } catch (error) {
    console.error("Failed to fetch data:", error);
  }

  return (
    <>
      {/* Spoiler Bar */}
      {spoilerData.length > 0 && <SpoilerBar players={spoilerData} />}

      {/* Below Header Ad */}
      <div className="max-w-screen-xl mx-auto mt-4">
        <AdPlaceholder slot="header-below" minHeight="100px" className="mb-4" />
      </div>

      {/* Main Content Area */}
      <div className="v2-primary-container">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Main Content */}
          <section className="flex-1 min-w-0">
            <div className="v2-primary-container-inner p-4">
              <h1 className="v2-primary-subheader mb-6">Big Brother 27 Spoilers</h1>

              {posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 dark:text-gray-400">No posts available.</p>
                </div>
              )}
            </div>
          </section>

          {/* Sidebar */}
          <Sidebar />
        </div>
      </div>
    </>
  );
}
