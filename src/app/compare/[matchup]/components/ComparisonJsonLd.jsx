/**
 * Schema.org structured data for player comparison page
 */
export function ComparisonJsonLd({ player1, player2, siteUrl }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `${player1.name} vs ${player2.name} - Big Brother Player Comparison`,
    description: `Head-to-head comparison of ${player1.name} and ${player2.name} across their Big Brother careers.`,
    url: `${siteUrl}/compare/${player1.slug}-vs-${player2.slug}`,
    about: [
      {
        "@type": "Person",
        name: player1.name,
        ...(player1.photo?.url && { image: player1.photo.url }),
        url: `${siteUrl}/bigbrother-players/${player1.slug}`,
      },
      {
        "@type": "Person",
        name: player2.name,
        ...(player2.photo?.url && { image: player2.photo.url }),
        url: `${siteUrl}/bigbrother-players/${player2.slug}`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
