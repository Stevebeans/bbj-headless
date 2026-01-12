import Image from "next/image";

export function PostHero({ title, featuredImage, commentCount = 0 }) {
  const commentText =
    commentCount === 0
      ? "No comments"
      : commentCount === 1
      ? "1 comment"
      : `${commentCount} comments`;

  return (
    <div className="relative h-[250px] md:h-[333px] bg-gray-100 dark:bg-gray-800 overflow-hidden">
      <div className="absolute inset-0">
        {featuredImage ? (
          <Image
            src={featuredImage}
            alt={title?.replace(/<[^>]*>/g, "") || "Featured image"}
            fill
            className="object-cover"
            priority
            sizes="(min-width: 1024px) 900px, 100vw"
          />
        ) : (
          <div className="absolute inset-0 bg-primary-500" />
        )}
      </div>

      {/* Comment Count Badge */}
      <div className="absolute w-full z-10 bottom-0 left-0">
        <div className="bg-white dark:bg-gray-800 px-3 py-1 w-fit flex items-center rounded-tr-md font-sans text-xs text-slate-700 dark:text-slate-300">
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          {commentText}
        </div>
      </div>
    </div>
  );
}
