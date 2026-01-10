import { getPost, getAllPostSlugs } from "@/lib/api/posts";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const slugs = await getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    return { title: "Post Not Found" };
  }

  return {
    title: post.title,
    description: post.excerpt?.replace(/<[^>]*>/g, "").slice(0, 160),
  };
}

export default async function PostPage({ params }) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <article className="card">
        <h1
          className="font-osw text-3xl font-bold text-gray-900 dark:text-white mb-4"
          dangerouslySetInnerHTML={{ __html: post.title }}
        />

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
          <span>By {post.author?.name || "Unknown"}</span>
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        </div>

        <div
          className="prose dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
}
