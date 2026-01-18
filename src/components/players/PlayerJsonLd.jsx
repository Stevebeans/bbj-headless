/**
 * JSON-LD structured data for player profile (Schema.org Person)
 */
export function PlayerJsonLd({ player, siteUrl }) {
  const { name, first_name, last_name, nickname, photo, occupation, social, permalink } = player;

  // Build sameAs array from social links
  const sameAs = [];
  if (social?.twitter) sameAs.push(social.twitter);
  if (social?.instagram) sameAs.push(social.instagram);
  if (social?.facebook) sameAs.push(social.facebook);
  if (social?.tiktok) sameAs.push(social.tiktok);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: name,
    givenName: first_name,
    familyName: last_name,
    ...(nickname && { alternateName: nickname }),
    ...(photo?.url && { image: photo.url }),
    ...(occupation && { jobTitle: occupation }),
    url: permalink || `${siteUrl}/players/${player.slug}`,
    ...(sameAs.length > 0 && { sameAs }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
