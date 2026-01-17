// Ad placeholder component - fetches ad data from WordPress API
// Server Component - async fetch supported

import Link from "next/link";
import { getSlotAd } from "@/lib/api/ads";
import { getSlotConfig } from "@/config/ads";
import { AdBlockerWrapper } from "./AdBlockerMessage";

/**
 * AdPlaceholder - Renders ad slots with branded wrapper based on WordPress settings
 * Automatically reserves correct height for CLS prevention based on config
 *
 * @param {string} slot - The ad slot identifier
 * @param {string} className - Additional CSS classes
 * @param {boolean} [showBranding] - Override: force branding on/off (omit to use API setting)
 */
export async function AdPlaceholder({
  slot,
  className = "",
  showBranding,
}) {
  // Fetch slot data from API
  const slotData = await getSlotAd(slot);

  // Get size config for CLS prevention
  const sizeConfig = getSlotConfig(slot);
  const desktopHeight = sizeConfig.desktop?.height || 250;
  const mobileHeight = sizeConfig.mobile?.height ?? desktopHeight;

  // Use prop override if provided, otherwise use API value
  const shouldShowBranding = showBranding ?? slotData.show_branding ?? false;
  const hasAdContent = slotData.show && slotData.content;

  // Hide completely on mobile if mobile height is 0
  if (mobileHeight === 0) {
    className += " hidden md:block";
  }

  const adContent = (
    <div
      className={`v2-ad-container bg-slate-50 dark:bg-slate-800/50 ${!shouldShowBranding ? className : ""}`}
      style={{
        "--ad-height-mobile": `${mobileHeight}px`,
        "--ad-height-desktop": `${desktopHeight}px`,
      }}
      data-ad-slot={slot}
    >
      <AdBlockerWrapper hasRealAd={hasAdContent} slot={slot}>
        {/* Only rendered if ad blocker not detected */}
        <div dangerouslySetInnerHTML={{ __html: slotData.content }} />
      </AdBlockerWrapper>
    </div>
  );

  // Without branding, just return the ad content
  if (!shouldShowBranding) {
    return adContent;
  }

  // With branding, wrap in container with header/footer
  return (
    <div
      className={`ad-branded-container ${className}`}
      aria-label="Advertisement"
    >
      {/* Header */}
      <div className="flex items-center justify-center py-1.5 border-b border-slate-200 dark:border-slate-700">
        <span className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-medium">
          Advertisement
        </span>
      </div>

      {/* Ad Content */}
      {adContent}

      {/* Footer with Go Ad-Free CTA */}
      <div className="flex items-center justify-center py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
        <Link
          href="/premium"
          className="group flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          <span className="font-medium">Go Ad-Free</span>
        </Link>
      </div>
    </div>
  );
}
