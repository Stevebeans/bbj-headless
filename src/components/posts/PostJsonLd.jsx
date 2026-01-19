// JSON-LD structured data for blog posts (SEO)

export function PostJsonLd({ post, siteUrl }) {
  if (!post) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title?.replace(/<[^>]*>/g, "") || "",
    datePublished: post.date,
    dateModified: post.modified || post.date,
    author: {
      "@type": "Person",
      name: post.author?.name || "Big Brother Junkies",
    },
    publisher: {
      "@type": "Organization",
      name: "Big Brother Junkies",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.png`,
      },
    },
    description: post.excerpt?.replace(/<[^>]*>/g, "").slice(0, 160) || "",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/${post.slug}`,
    },
  };

  // Add image if available
  if (post.featuredImage) {
    jsonLd.image = post.featuredImage;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
