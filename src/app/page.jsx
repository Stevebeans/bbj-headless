import { SpoilerBar } from "@/components/spoiler-bar/SpoilerBar";
import { PostCard } from "@/components/posts/PostCard";
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
      {spoilerData.length > 0 && <SpoilerBar players={spoilerData} />}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content */}
          <div className="flex-1">
            <h1 className="section-header mb-6">Big Brother 26 Spoilers</h1>

            {posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <div className="card">
                <p className="text-gray-500">No posts available.</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80">
            <div className="card sticky top-4">
              <h2 className="font-osw text-lg font-semibold text-primary-500 mb-4">
                About BBJ
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Big Brother Junkies has been your source for live feed updates
                and spoilers since 2010.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
