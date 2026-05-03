"use client";

import Script from "next/script";
import { useAds } from "@/context/AdContext";
import { useAuth } from "@/context/AuthContext";

export function FreestarSDKLoader() {
  const { shouldShowAds } = useAds();
  const { loading } = useAuth();

  if (loading) return null;
  if (!shouldShowAds) return null;

  return (
    <>
      <link rel="preconnect" href="https://a.pub.network/" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://b.pub.network/" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://c.pub.network/" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://d.pub.network/" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://c.amazon-adsystem.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://s.amazon-adsystem.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://btloader.com/" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://api.btloader.com/" crossOrigin="anonymous" />
      <link rel="stylesheet" href="https://a.pub.network/bigbrotherjunkies-com/cls.css" />

      <Script
        id="freestar-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            var freestar = freestar || {};
            freestar.queue = freestar.queue || [];
            freestar.config = freestar.config || {};
            freestar.config.enabled_slots = [];
            freestar.initCallback = function () {
              (freestar.config.enabled_slots.length === 0)
                ? freestar.initCallbackCalled = false
                : freestar.newAdSlots(freestar.config.enabled_slots)
            }
          `,
        }}
      />

      <Script
        id="freestar-sdk"
        src="https://a.pub.network/bigbrotherjunkies-com/pubfig.min.js"
        strategy="lazyOnload"
        data-cfasync="false"
      />
    </>
  );
}

export default FreestarSDKLoader;
