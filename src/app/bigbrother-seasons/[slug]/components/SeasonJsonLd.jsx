/**
 * JSON-LD structured data for season pages
 * Helps search engines understand the content
 */
export function SeasonJsonLd({ season, siteUrl }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TVSeason",
    name: season.name,
    seasonNumber: season.season_number,
    numberOfEpisodes: season.total_days || undefined,
    startDate: season.start_date || undefined,
    endDate: season.end_date || undefined,
    url: `${siteUrl}/bigbrother-seasons/${season.slug}`,
    partOfSeries: {
      "@type": "TVSeries",
      name: "Big Brother",
      url: siteUrl,
    },
    ...(season.cover_image && {
      image: {
        "@type": "ImageObject",
        url: season.cover_image,
      },
    }),
  };

  // Remove undefined values
  const cleanJsonLd = JSON.parse(
    JSON.stringify(jsonLd, (key, value) =>
      value === undefined ? undefined : value
    )
  );

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(cleanJsonLd) }}
    />
  );
}
