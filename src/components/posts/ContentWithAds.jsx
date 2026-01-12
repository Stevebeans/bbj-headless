import { AdPlaceholder } from "@/components/ads/AdPlaceholder";
import { getInContentPlacements } from "@/config/ads";

/**
 * Renders post content with ads inserted at configured positions
 */
export function ContentWithAds({ content, className = "" }) {
  if (!content) return null;

  // Split content into paragraphs
  const paragraphs = splitIntoParagraphs(content);
  const paragraphCount = paragraphs.length;

  // Get ad placements for this content length
  const placements = getInContentPlacements(paragraphCount);

  // If no placements or not enough content, just render as-is
  if (placements.length === 0) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // Create a map of positions to ad slots
  const adMap = new Map();
  placements.forEach((p) => {
    adMap.set(p.position, p);
  });

  // Build the content with ads inserted
  const elements = [];

  paragraphs.forEach((paragraph, index) => {
    const position = index + 1; // 1-indexed

    // Add the paragraph
    elements.push(
      <div
        key={`p-${index}`}
        dangerouslySetInnerHTML={{ __html: paragraph }}
      />
    );

    // Check if there's an ad after this paragraph
    if (adMap.has(position)) {
      const placement = adMap.get(position);
      elements.push(
        <div key={`ad-${position}`} className="my-4">
          <AdPlaceholder
            slot={placement.slot}
            minHeight="100px"
            className="bbjd-in-content-ad"
          />
        </div>
      );
    }
  });

  return <div className={className}>{elements}</div>;
}

/**
 * Split HTML content into paragraphs
 * Keeps special blocks (feed-updates, etc.) intact
 */
function splitIntoParagraphs(content) {
  // First, protect special blocks that shouldn't be split
  const protectedBlocks = [];
  let protectedContent = content;

  // Find and protect .feed-updates blocks (handles nested divs properly)
  protectedContent = extractAndProtectBlocks(
    protectedContent,
    'feed-updates',
    protectedBlocks
  );

  // Now split the remaining content by </p> tags
  const parts = protectedContent.split(/(<\/p>)/i);

  const blocks = [];
  let current = "";

  for (const part of parts) {
    current += part;
    if (/<\/p>/i.test(part)) {
      if (current.trim()) {
        blocks.push(current);
      }
      current = "";
    }
  }

  // Add any remaining content (including protected block placeholders)
  if (current.trim()) {
    blocks.push(current);
  }

  // Restore protected blocks
  const restoredBlocks = blocks.map((block) => {
    let restored = block;
    protectedBlocks.forEach((protectedBlock, index) => {
      restored = restored.replace(
        `<!--PROTECTED_BLOCK_${index}-->`,
        protectedBlock
      );
    });
    return restored;
  });

  // Filter out empty blocks (but keep blocks with protected content)
  return restoredBlocks.filter((block) => {
    const text = block.replace(/<[^>]*>/g, "").trim();
    return text.length > 0 || block.includes("feed-updates");
  });
}

/**
 * Extract blocks with a specific class and replace with placeholders
 * Handles nested divs properly by counting open/close tags
 */
function extractAndProtectBlocks(content, className, protectedBlocks) {
  const openTagPattern = new RegExp(
    `<div[^>]*class="[^"]*${className}[^"]*"[^>]*>`,
    'gi'
  );

  let result = content;
  let match;

  // Find all opening tags for this class
  while ((match = openTagPattern.exec(content)) !== null) {
    const startIndex = match.index;
    let depth = 1;
    let endIndex = match.index + match[0].length;

    // Count nested divs to find the matching closing tag
    while (depth > 0 && endIndex < content.length) {
      const nextOpen = content.indexOf('<div', endIndex);
      const nextClose = content.indexOf('</div>', endIndex);

      if (nextClose === -1) break;

      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        endIndex = nextOpen + 4;
      } else {
        depth--;
        endIndex = nextClose + 6;
      }
    }

    // Extract the full block
    const fullBlock = content.slice(startIndex, endIndex);
    const placeholder = `<!--PROTECTED_BLOCK_${protectedBlocks.length}-->`;
    protectedBlocks.push(fullBlock);

    // Replace in result (only first occurrence to handle multiple blocks)
    result = result.replace(fullBlock, placeholder);
  }

  return result;
}
