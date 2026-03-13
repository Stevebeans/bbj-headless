"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useAds } from "@/context/AdContext";
import { getSlotConfig, DEFAULT_PWA_SUPPRESSED } from "@/config/ads";

export function FreestarSlot({ placementName, slotId: customSlotId, className = "", showBranding = true }) {
  const { shouldShowAds, isPWA, isAdBlocked, sdkReady } = useAds();
  const slotRef = useRef(null);
  const registeredRef = useRef(false);
  const instanceId = useRef(customSlotId || `${placementName}_${Math.random().toString(36).slice(2, 8)}`);
  const slotId = instanceId.current;

  const config = getSlotConfig(placementName);
  const desktopHeight = config.desktop?.height || 250;
  const mobileHeight = config.mobile?.height ?? desktopHeight;
  const hiddenOnMobile = mobileHeight === 0;

  useEffect(() => {
    if (!shouldShowAds || isAdBlocked || !sdkReady) return;
    if (registeredRef.current) return;

    const slot = { placementName, slotId };

    if (window.freestar && window.freestar.config) {
      window.freestar.config.enabled_slots.push(slot);
      window.freestar.newAdSlots([slot]);
      registeredRef.current = true;
    }

    return () => {
      if (registeredRef.current && window.freestar) {
        try {
          window.freestar.deleteAdSlots([slot]);
        } catch (e) {
          // Non-critical — slot will be overwritten on next page
        }
        registeredRef.current = false;
      }
    };
  }, [placementName, slotId, shouldShowAds, isAdBlocked, sdkReady]);

  if (!shouldShowAds) return null;
  if (isPWA && DEFAULT_PWA_SUPPRESSED.includes(placementName)) return null;

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
      ref={slotRef}
      id={slotId}
      data-freestar-ad
      className={`freestar-slot flex items-center justify-center bg-slate-50 dark:bg-slate-800/50 ${
        hiddenOnMobile ? "hidden md:block" : ""
      } ${!showBranding ? className : ""}`}
      style={{
        "--ad-h": `${mobileHeight}px`,
        "--ad-h-desktop": `${desktopHeight}px`,
      }}
    />
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="font-medium">Go Ad-Free</span>
        </Link>
      </div>
    </div>
  );
}

export default FreestarSlot;
