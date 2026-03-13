import { FreestarSlot } from "@/components/ads/FreestarSlot";

/**
 * Renders post content with optional mid-article ad
 * In-content ads are handled by Freestar's articles_dynamic_incontent (auto-inserted by SDK)
 * We place one manual mid-article slot as a guaranteed placement
 */
export function ContentWithAds({ content, className = "", showAds = true }) {
  if (!content) return null;

  if (!showAds) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  const midpoint = findMidpoint(content);

  if (midpoint === -1) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  const firstHalf = content.slice(0, midpoint);
  const secondHalf = content.slice(midpoint);

  return (
    <div className={className}>
      <div dangerouslySetInnerHTML={{ __html: firstHalf }} />
      <div className="my-4">
        <FreestarSlot placementName="bigbrotherjunkies_middle_post" />
      </div>
      <div dangerouslySetInnerHTML={{ __html: secondHalf }} />
    </div>
  );
}

/**
 * Find a midpoint in the HTML content to split at a paragraph boundary
 * Returns the index after a closing </p> tag near the middle, or -1 if too short
 */
function findMidpoint(content) {
  const minLength = 1500;
  if (content.length < minLength) return -1;

  const mid = Math.floor(content.length / 2);
  const afterMid = content.indexOf("</p>", mid);
  if (afterMid === -1) return -1;

  return afterMid + 4;
}
