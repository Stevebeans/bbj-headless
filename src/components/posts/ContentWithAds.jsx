import { FreestarSlot } from "@/components/ads/FreestarSlot";
import { splitContentBlocks } from "./splitContentBlocks";

const MIN_LENGTH = 1500;
const MIN_PARAGRAPH = 3;
const MAX_ADS = 5;
const DEFAULT_INTERVAL = 5;

/**
 * Renders post content with in-content ads inserted every N paragraphs.
 * This is a Server Component — no hooks or context.
 */
export function ContentWithAds({ content, className = "", showAds = true, adInterval = DEFAULT_INTERVAL }) {
  if (!content) return null;

  if (!showAds || content.length < MIN_LENGTH) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  const paragraphs = splitContentBlocks(content);

  if (paragraphs.length < MIN_PARAGRAPH + 1) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  const interval = Math.max(2, Math.min(10, adInterval));
  const chunks = [];
  let adCount = 0;
  let paragraphsSinceAd = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    chunks.push(
      <div key={`p-${i}`} dangerouslySetInnerHTML={{ __html: paragraphs[i] }} />
    );
    paragraphsSinceAd++;

    const canInsertAd =
      adCount < MAX_ADS &&
      i + 1 >= MIN_PARAGRAPH &&
      paragraphsSinceAd >= interval &&
      i < paragraphs.length - 1;

    if (canInsertAd) {
      adCount++;
      paragraphsSinceAd = 0;
      chunks.push(
        <div key={`ad-${adCount}`} className="my-4">
          <FreestarSlot
            placementName="bigbrotherjunkies_incontent_reusable"
            slotId={`incontent-${adCount}`}
          />
        </div>
      );
    }
  }

  return <div className={className}>{chunks}</div>;
}
