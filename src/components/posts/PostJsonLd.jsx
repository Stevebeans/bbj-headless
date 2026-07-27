// JSON-LD structured data for blog posts (SEO)
import { ORG_LOGO, toIsoTz } from "@/lib/seo";

export function PostJsonLd({ post, siteUrl }) {
  if (!post) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    // NewsArticle (not BlogPosting) is what Top Stories draws from; identical
    // treatment in regular results. Headline capped at Google's 110-char limit.
    "@type": "NewsArticle",
    headline: (post.title?.replace(/<[^>]*>/g, "") || "").slice(0, 110),
    // ISO 8601 with timezone — WP `date` has no offset, so prefer `date_gmt`.
    datePublished: toIsoTz(post.date, post.dateGmt),
    dateModified: toIsoTz(post.modified || post.date, post.modifiedGmt || post.dateGmt),
    author: {
      "@type": "Person",
      name: post.author?.name || "Big Brother Junkies",
    },
    publisher: {
      "@type": "Organization",
      name: "Big Brother Junkies",
      logo: {
        "@type": "ImageObject",
        url: ORG_LOGO,
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
