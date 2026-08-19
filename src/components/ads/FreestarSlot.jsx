"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useAds } from "@/context/AdContext";
import { useAuth } from "@/context/AuthContext";
import { getSlotConfig } from "@/config/ads";
import { AdPlaceholder } from "./AdPlaceholder";

const FreestarAdSlot = dynamic(
  () => import("@freestar/pubfig-adslot-react-component"),
  { ssr: false }
);

export function FreestarSlot({
  placementName,
  slotId,
  className = "",
  showBranding = true,
  targeting,
}) {
  const { shouldShowAds, isPWA, isAdBlocked, disabledPlacements, pwaSuppressed, previewMode } = useAds();
  const { loading: authLoading } = useAuth();

  // Hold the SDK until auth resolves. The Freestar React component self-injects
  // pubfig (createElement("script") → a.pub.network/…/pubfig.min.js) the moment
  // it mounts, which bypasses FreestarSDKLoader's auth gate. Before hydration
  // `user` is null, so shouldShowAds is true for everyone — a supporter whose
  // hydration loses that race boots the SDK, and pubfig's auto units (sticky
  // footer, pushdown, interstitial) attach outside our markup where the
  // .bbj-adfree CSS can't reach them (tomtomtom, 2026-08-18). The wrapper still
  // renders so the CLS height reservation stays in the SSR HTML.
  const holdSdk =
    authLoading || (typeof window !== "undefined" && window.__bbjAdFree === true);

  const config = getSlotConfig(placementName);
  const desktopHeight = config.desktop?.height || 250;
  const mobileHeight = config.mobile?.height ?? desktopHeight;
  const hiddenOnMobile = mobileHeight === 0;

  if (previewMode) {
    return (
      <AdPlaceholder
        placementName={placementName}
        config={config}
        hiddenOnMobile={hiddenOnMobile}
        className={className}
      />
    );
  }

  if (!shouldShowAds) return null;
  if (disabledPlacements.includes(placementName)) return null;
  if (isPWA && pwaSuppressed.includes(placementName)) return null;

  if (isAdBlocked) {
    return (
      <div
        className={`${hiddenOnMobile ? "hidden md:block" : ""} ${className}`}
        aria-label="Promotion"
      >
        <div className="flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg">
          <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">
            <span className="text-base mr-1.5">👋</span>
            Hey, we see you&apos;re using an ad blocker.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Totally get it! But those ads help keep BBJ running and the feed updates flowing.
            If you want an ad-free experience plus some cool extras, check out Premium.
          </p>
          <Link
            href="/premium"
            prefetch={false}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Explore Premium
          </Link>
        </div>
      </div>
    );
  }

  const slotDiv = (
    <div
      className={`freestar-slot flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 ${
        hiddenOnMobile ? "hidden md:block" : ""
      } ${!showBranding ? className : ""}`}
      style={{
        "--ad-h": `${mobileHeight}px`,
        "--ad-h-desktop": `${desktopHeight}px`,
      }}
    >
      {!holdSdk && (
        <FreestarAdSlot
          publisher="bigbrotherjunkies-com"
          placementName={placementName}
          slotId={slotId}
          targeting={targeting}
        />
      )}
    </div>
  );

  if (!showBranding) return slotDiv;

  return (
    <div className={`ad-branded-container ${className}`} aria-label="Advertisement">
      <div className="flex items-center justify-center py-1.5 border-b border-slate-200 dark:border-slate-700">
        <span className="text-[10px] uppercase tracking-widest text-slate-400 dark:text-slate-500 font-medium">
          Advertisement
        </span>
      </div>
      {slotDiv}
      <div className="flex items-center justify-center py-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
        {/* prefetch={false}: this link renders under every ad slot on every page,
            and viewport prefetch of /premium (an uncacheable 308) + its
            /become-supporter follow-up was ~25% of ALL edge requests
            (47K/12h, 2026-08-16). A conversion page can afford a full click. */}
        <Link
          href="/premium"
          prefetch={false}
          className="group flex items-center gap-1.5 text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
        >
          <svg
            className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100 transition-opacity"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="font-medium">Go Ad-Free</span>
        </Link>
      </div>
    </div>
  );
}

export default FreestarSlot;
