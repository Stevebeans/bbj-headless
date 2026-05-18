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
      {/* Lighthouse warns if >4 preconnects. Keep only the critical origin warm; DNS-prefetch the rest. */}
      <link rel="preconnect" href="https://a.pub.network/" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://b.pub.network/" />
      <link rel="dns-prefetch" href="https://c.pub.network/" />
      <link rel="dns-prefetch" href="https://d.pub.network/" />
      <link rel="dns-prefetch" href="https://c.amazon-adsystem.com" />
      <link rel="dns-prefetch" href="https://s.amazon-adsystem.com" />
      <link rel="dns-prefetch" href="https://btloader.com/" />
      <link rel="dns-prefetch" href="https://api.btloader.com/" />
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
