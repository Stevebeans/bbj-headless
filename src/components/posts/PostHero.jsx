import Image from "next/image";

export function PostHero({ title, featuredImage }) {
  if (!featuredImage) {
    return null;
  }

  return (
    <figure className="mt-6">
      <Image
        src={featuredImage}
        alt={title?.replace(/<[^>]*>/g, "") || "Featured image"}
        width={1200}
        height={675}
        sizes="(min-width: 1024px) 900px, 100vw"
        className="w-full h-auto rounded-lg"
        priority
        fetchPriority="high"
      />
    </figure>
  );
}
