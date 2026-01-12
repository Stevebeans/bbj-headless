import Image from "next/image";
import Link from "next/link";

export function RelatedPosts({ posts = [] }) {
  if (!posts.length) return null;

  return (
    <div className="border border-slate-400 dark:border-slate-600 rounded p-2 mt-4">
      <h2 className="text-lg font-bold text-primary-500 dark:text-primary-400 mb-2">
        Related Articles
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {posts.map((post) => (
          <div key={post.id} className="w-full">
            {post.featuredImage ? (
              <Link href={`/posts/${post.slug}`} className="block">
                <div className="relative h-28 w-full">
                  <Image
                    src={post.featuredImage}
                    alt={post.title?.replace(/<[^>]*>/g, "") || "Related post"}
                    fill
                    className="rounded object-cover"
                    sizes="(min-width: 768px) 200px, 150px"
                  />
                </div>
              </Link>
            ) : (
              <div className="h-28 w-full rounded bg-gray-200 dark:bg-gray-700" />
            )}
            <Link
              href={`/posts/${post.slug}`}
              className="text-sm pb-2 font-bold hover:text-primary-500 dark:hover:text-primary-400 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: post.title }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
