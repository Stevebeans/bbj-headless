# Freestar Ad Integration — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the WordPress-API-driven ad system with Freestar's native SDK, keeping house ads for ad-blocker users and an admin settings page.

**Architecture:** Freestar's pubfig.js SDK loads in the `<head>` for non-supporters. A single `<FreestarSlot>` client component replaces both `AdPlaceholder` and `ClientAdPlaceholder`. An `AdContext` provider exposes ad visibility, PWA mode, and ad-blocker state to all client components. House ads are hardcoded React components shown to ad-blocker users. Admin settings stored in WordPress via a new API endpoint.

**Tech Stack:** Next.js 15 (App Router, JavaScript), Freestar pubfig.js SDK, Tailwind CSS, WordPress REST API

**Spec:** `docs/superpowers/specs/2026-03-13-freestar-ad-integration-design.md`

---

## Chunk 1: Foundation (AdContext + Config + FreestarSlot)

### Task 1: Update ad config with Freestar placement names

**Files:**
- Modify: `src/config/ads.js`

- [ ] **Step 1: Rewrite ads.js with Freestar placement names and CLS heights**

Replace the entire file. Remove `inContent` array and `getInContentPlacements()`. Update slot keys to Freestar placement names with proper CLS heights.

```javascript
/**
 * Freestar Ad Configuration
 *
 * Placement names match Freestar dashboard (pubos.freestar.io)
 * Heights are reserved for CLS (Cumulative Layout Shift) prevention
 */

// Placements that Freestar auto-manages (SDK injects these — no divs from us)
export const AUTO_MANAGED_PLACEMENTS = [
  "bigbrotherjunkies_articles_dynamic_incontent",
  "bigbrotherjunkies_comments_dynamic_incontent",
  "bigbrotherjunkies_sticky_footer",
  "bigbrotherjunkies_sticky_pushdown",
  "bigbrotherjunkies_google_interstitial",
  "FreeStarVideoAdContainer_Slider",
];

// Placements to suppress in PWA standalone mode (configurable via admin)
export const DEFAULT_PWA_SUPPRESSED = [
  "bigbrotherjunkies_sticky_footer",
  "bigbrotherjunkies_google_interstitial",
];

// Manual placement slot definitions with CLS prevention heights
export const adSlots = {
  bigbrotherjunkies_leaderboard_atf: {
    desktop: { height: 90 },    // 728x90 leaderboard
    mobile: { height: 100 },    // 320x100 mobile banner
  },
  bigbrotherjunkies_incontent_reusable: {
    desktop: { height: 280 },   // 336x280 large rectangle
    mobile: { height: 250 },    // 300x250 medium rectangle
  },
  bigbrotherjunkies_incontent_reusable_Homepage2: {
    desktop: { height: 280 },
    mobile: { height: 250 },
  },
  bigbrotherjunkies_middle_feed: {
    desktop: { height: 280 },
    mobile: { height: 250 },
  },
  bigbrotherjunkies_middle_post: {
    desktop: { height: 280 },
    mobile: { height: 250 },
  },
  bigbrotherjunkies_siderail_right_1: {
    desktop: { height: 250 },   // 300x250 medium rectangle
    mobile: { height: 0 },      // Hidden on mobile
  },
  bigbrotherjunkies_siderail_right_2: {
    desktop: { height: 250 },
    mobile: { height: 0 },
  },
};

/**
 * Get slot configuration with size info
 * @param {string} placementName - The Freestar placement identifier
 * @returns {object} Slot config with desktop/mobile heights
 */
export function getSlotConfig(placementName) {
  return adSlots[placementName] || { desktop: { height: 250 }, mobile: { height: 250 } };
}
```

- [ ] **Step 2: Verify no import errors**

Run: `npx next lint --file src/config/ads.js`
Expected: No errors (some files that imported `getInContentPlacements` will break — that's expected, we'll fix those later)

- [ ] **Step 3: Commit**

```bash
git add src/config/ads.js
git commit -m "refactor: update ad config with Freestar placement names and CLS heights"
```

---

### Task 2: Create AdContext provider

**Files:**
- Create: `src/context/AdContext.jsx`
- Modify: `src/components/Providers.jsx`

- [ ] **Step 1: Create AdContext**

```jsx
"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AdContext = createContext({
  shouldShowAds: true,
  isPWA: false,
  isAdBlocked: false,
  sdkReady: false,
});

const SDK_TIMEOUT_MS = 5000;

/**
 * Detects if running as installed PWA (standalone mode)
 * Covers: Chrome/Edge standalone, iOS Safari, window-controls-overlay
 */
function detectPWA() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    window.navigator.standalone === true
  );
}

export function AdProvider({ children, initialShouldShowAds = true }) {
  const [isPWA, setIsPWA] = useState(false);
  const [isAdBlocked, setIsAdBlocked] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    // Detect PWA mode
    setIsPWA(detectPWA());

    // Skip SDK check if ads shouldn't show
    if (!initialShouldShowAds) return;

    // Check if Freestar SDK loaded (or if it's blocked)
    const checkSDK = () => {
      if (window.freestar && window.freestar.config) {
        setSdkReady(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkSDK()) return;

    // Poll briefly then timeout
    const interval = setInterval(() => {
      if (checkSDK()) clearInterval(interval);
    }, 500);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!window.freestar || !window.freestar.config) {
        setIsAdBlocked(true);
      }
    }, SDK_TIMEOUT_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [initialShouldShowAds]);

  return (
    <AdContext.Provider
      value={{
        shouldShowAds: initialShouldShowAds,
        isPWA,
        isAdBlocked,
        sdkReady,
      }}
    >
      {children}
    </AdContext.Provider>
  );
}

export function useAds() {
  return useContext(AdContext);
}
```

- [ ] **Step 2: Add AdProvider to Providers.jsx**

In `src/components/Providers.jsx`, import and wrap:

```jsx
"use client";

import { AuthProvider } from "@/context/AuthContext";
import { AuthModalProvider } from "@/context/AuthModalContext";
import { AdProvider } from "@/context/AdContext";
import { AuthModal } from "@/components/auth";
import { useSessionHeartbeat } from "@/hooks/useSessionHeartbeat";

function SessionHeartbeat({ children }) {
  useSessionHeartbeat();
  return children;
}

export function Providers({ children, initialUser, shouldShowAds }) {
  return (
    <AuthProvider initialUser={initialUser}>
      <SessionHeartbeat>
        <AuthModalProvider>
          <AdProvider initialShouldShowAds={shouldShowAds}>
            {children}
            <AuthModal />
          </AdProvider>
        </AuthModalProvider>
      </SessionHeartbeat>
    </AuthProvider>
  );
}
```

- [ ] **Step 3: Pass shouldShowAds from layout.jsx**

In `src/app/layout.jsx`, update the `<Providers>` call to pass the supporter check:

Change:
```jsx
<Providers initialUser={initialUser}>
```
To:
```jsx
<Providers initialUser={initialUser} shouldShowAds={!isSupporter}>
```

- [ ] **Step 4: Verify the app still loads**

Run: `npm run dev`
Visit `http://localhost:3000` — page should load without errors. Check browser console for no context errors.

- [ ] **Step 5: Commit**

```bash
git add src/context/AdContext.jsx src/components/Providers.jsx src/app/layout.jsx
git commit -m "feat: add AdContext provider with PWA and ad-blocker detection"
```

---

### Task 3: Create FreestarSlot component

**Files:**
- Create: `src/components/ads/FreestarSlot.jsx`

- [ ] **Step 1: Create the FreestarSlot component**

```jsx
"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useAds } from "@/context/AdContext";
import { getSlotConfig, DEFAULT_PWA_SUPPRESSED } from "@/config/ads";

/**
 * FreestarSlot — renders a Freestar ad placement
 *
 * Replaces AdPlaceholder (server) and ClientAdPlaceholder (client).
 * Handles: Freestar SDK registration, SPA cleanup, CLS prevention,
 * PWA suppression, supporter hiding, ad-blocker fallback.
 *
 * @param {string} placementName - Freestar placement name (required)
 * @param {string} className - Additional CSS classes
 * @param {boolean} showBranding - Show "Advertisement" / "Go Ad-Free" wrapper (default: true)
 */
export function FreestarSlot({ placementName, slotId: customSlotId, className = "", showBranding = true }) {
  const { shouldShowAds, isPWA, isAdBlocked, sdkReady } = useAds();
  const slotRef = useRef(null);
  const registeredRef = useRef(false);
  // Unique slot ID — use customSlotId if provided (for multiple instances of same placement)
  const instanceId = useRef(customSlotId || `${placementName}_${Math.random().toString(36).slice(2, 8)}`);
  const slotId = instanceId.current;

  // Get CLS heights
  const config = getSlotConfig(placementName);
  const desktopHeight = config.desktop?.height || 250;
  const mobileHeight = config.mobile?.height ?? desktopHeight;
  const hiddenOnMobile = mobileHeight === 0;

  // Register/destroy Freestar slot
  useEffect(() => {
    if (!shouldShowAds || isAdBlocked || !sdkReady) return;
    if (registeredRef.current) return;

    const slot = { placementName, slotId };

    // Register the slot
    if (window.freestar && window.freestar.config) {
      window.freestar.config.enabled_slots.push(slot);
      window.freestar.newAdSlots([slot]);
      registeredRef.current = true;
    }

    // Cleanup on unmount (SPA navigation)
    return () => {
      if (registeredRef.current && window.freestar) {
        try {
          window.freestar.deleteAdSlots([slot]);
        } catch (e) {
          // Freestar may not support deleteAdSlots in all versions
          // This is non-critical — slot will be overwritten on next page
        }
        registeredRef.current = false;
      }
    };
  }, [placementName, slotId, shouldShowAds, isAdBlocked, sdkReady]);

  // Don't render for supporters or when ads are disabled
  if (!shouldShowAds) return null;

  // Suppress certain placements in PWA mode
  if (isPWA && DEFAULT_PWA_SUPPRESSED.includes(placementName)) return null;

  // Ad blocker detected — show house ad
  if (isAdBlocked) {
    return (
      <HouseAd
        className={className}
        hiddenOnMobile={hiddenOnMobile}
        showBranding={showBranding}
      />
    );
  }

  // Render the Freestar slot div
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

      {slotDiv}

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

/**
 * House ad shown to ad-blocker users
 * Simple "Go Premium" CTA — can be expanded with more creatives later
 */
function HouseAd({ className, hiddenOnMobile, showBranding }) {
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
          <svg
            className="w-4 h-4"
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
          Explore Premium
        </Link>
      </div>
    </div>
  );
}

export default FreestarSlot;
```

- [ ] **Step 2: Add responsive CLS CSS**

In `src/styles/globals.css`, add after the existing `.v2-ad-container` rule:

```css
/* Freestar slot responsive heights */
.freestar-slot {
  min-height: var(--ad-h);
}
@media (min-width: 768px) {
  .freestar-slot {
    min-height: var(--ad-h-desktop);
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ads/FreestarSlot.jsx src/styles/globals.css
git commit -m "feat: add FreestarSlot component with SDK lifecycle and ad-blocker fallback"
```

---

### Task 4: Load Freestar SDK in layout.jsx

**Files:**
- Modify: `src/app/layout.jsx`

- [ ] **Step 1: Add Freestar preconnect links and SDK script**

In layout.jsx `<head>`, add preconnect links. After `</Providers>`, replace the `ad_header`/`ad_footer` script injection with Freestar SDK:

Changes to make:
1. In `<head>` after `<ThemeScript />`, add preconnect links (always — they're harmless for supporters)
2. Replace the `{!isSupporter && adScripts.ad_header ...}` block and `{!isSupporter && adScripts.ad_footer ...}` block with a single Freestar SDK Script tag
3. Keep the `global_header` and `global_footer` script blocks (analytics) unchanged

Also fetch ad settings (kill switch) server-side. Add to the `Promise.all` in `RootLayout`:
```jsx
const [initialUser, adScripts, adSettings] = await Promise.all([
  getInitialAuthState(),
  getAdScripts(),
  fetch(`${process.env.WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json"}/bbjd/v1/ad-settings`, { next: { revalidate: 60 } })
    .then(r => r.ok ? r.json() : { ads_enabled: true })
    .catch(() => ({ ads_enabled: true })),
]);
```

Update the shouldShowAds logic:
```jsx
const shouldShowAds = !isSupporter && adSettings.ads_enabled !== false;
```

Pass to Providers:
```jsx
<Providers initialUser={initialUser} shouldShowAds={shouldShowAds}>
```

Add to `<head>`:
```jsx
{/* Freestar preconnect for faster ad loading */}
<link rel="preconnect" href="https://a.pub.network/" crossOrigin="anonymous" />
<link rel="preconnect" href="https://b.pub.network/" crossOrigin="anonymous" />
<link rel="preconnect" href="https://c.pub.network/" crossOrigin="anonymous" />
<link rel="preconnect" href="https://d.pub.network/" crossOrigin="anonymous" />
```

Replace ad script blocks with the Freestar queue init + SDK:
```jsx
{/* Freestar SDK — only when ads should show */}
{shouldShowAds && (
  <>
    <Script id="freestar-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: `
      window.freestar = window.freestar || {};
      window.freestar.queue = window.freestar.queue || [];
      window.freestar.config = window.freestar.config || {};
      window.freestar.config.enabled_slots = window.freestar.config.enabled_slots || [];
    `}} />
    <Script
      id="freestar-sdk"
      src="https://a.pub.network/bigbrotherjunkies-com/pubfig.min.js"
      strategy="afterInteractive"
      crossOrigin="anonymous"
    />
  </>
)}
```

Remove these 4 blocks (the `ad_header` / `ad_footer` injections):
```jsx
{!isSupporter && adScripts.ad_header && extractInlineScript(adScripts.ad_header) && (
  <Script id="ad-header" ... />
)}
{!isSupporter && extractDeferredScripts(adScripts.ad_header, 'ad-hdr')}
{!isSupporter && adScripts.ad_footer && extractInlineScript(adScripts.ad_footer) && (
  <Script id="ad-footer" ... />
)}
{!isSupporter && extractDeferredScripts(adScripts.ad_footer, 'ad-ftr')}
```

- [ ] **Step 2: Verify the app loads with the SDK**

Run: `npm run dev`
Visit `http://localhost:3000`
Open DevTools Network tab, filter by "pubfig" — you should see `pubfig.min.js` loading (it may error on localhost since the domain doesn't match, that's expected).

- [ ] **Step 3: Commit**

```bash
git add src/app/layout.jsx
git commit -m "feat: load Freestar SDK in layout, replace WordPress ad script injection"
```

---

## Chunk 2: Migrate All Ad Placements

### Task 5: Migrate homepage ads

**Files:**
- Modify: `src/app/page.jsx`

- [ ] **Step 1: Replace AdPlaceholder imports and usage**

Replace:
```jsx
import { AdPlaceholder } from "@/components/ads/AdPlaceholder";
```
With:
```jsx
import { FreestarSlot } from "@/components/ads/FreestarSlot";
```

Replace:
```jsx
<AdPlaceholder slot="index_top" minHeight="100px" />
```
With:
```jsx
<FreestarSlot placementName="bigbrotherjunkies_incontent_reusable" />
```

Replace:
```jsx
<AdPlaceholder slot="index_mid" minHeight="100px" />
```
With:
```jsx
<FreestarSlot placementName="bigbrotherjunkies_incontent_reusable_Homepage2" />
```

Note: `page.jsx` is a server component but `FreestarSlot` is a client component — this is fine, Next.js handles client components inside server components. However, the homepage is `async` and uses `await` — the FreestarSlot won't break this since it doesn't need data from the server.

- [ ] **Step 2: Verify homepage loads**

Run: `npm run dev`
Visit `http://localhost:3000` — should load without errors. Ad slots should render as empty containers (SDK won't fill on localhost).

- [ ] **Step 3: Commit**

```bash
git add src/app/page.jsx
git commit -m "feat: migrate homepage to FreestarSlot"
```

---

### Task 6: Migrate sidebar ads

**Files:**
- Modify: `src/components/layout/Sidebar.jsx`

- [ ] **Step 1: Replace ClientAdPlaceholder with FreestarSlot**

Replace:
```jsx
import { ClientAdPlaceholder } from "../ads/ClientAdPlaceholder";
```
With:
```jsx
import { FreestarSlot } from "../ads/FreestarSlot";
```

Replace:
```jsx
{showAds && <ClientAdPlaceholder slot="sidebar_top" minHeight="250px" />}
```
With:
```jsx
{showAds && <FreestarSlot placementName="bigbrotherjunkies_siderail_right_1" />}
```

Replace:
```jsx
{showAds && <ClientAdPlaceholder slot="sidebar_bottom" minHeight="250px" />}
```
With:
```jsx
{showAds && <FreestarSlot placementName="bigbrotherjunkies_siderail_right_2" />}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/layout/Sidebar.jsx
git commit -m "feat: migrate sidebar to FreestarSlot"
```

---

### Task 7: Migrate single post/page ads

**Files:**
- Modify: `src/app/[slug]/page.jsx`

- [ ] **Step 1: Replace import and usage**

Replace:
```jsx
import { AdPlaceholder } from "@/components/ads/AdPlaceholder";
```
With:
```jsx
import { FreestarSlot } from "@/components/ads/FreestarSlot";
```

Replace:
```jsx
<AdPlaceholder slot="before-content" minHeight="100px" className="mb-4" />
```
With:
```jsx
<FreestarSlot placementName="bigbrotherjunkies_leaderboard_atf" className="mb-4" />
```

- [ ] **Step 2: Commit**

```bash
git add src/app/[slug]/page.jsx
git commit -m "feat: migrate single post/page to FreestarSlot"
```

---

### Task 8: Migrate player profile ads

**Files:**
- Modify: `src/app/bigbrother-players/[slug]/page.jsx`

- [ ] **Step 1: Replace import and usage**

Replace:
```jsx
import { AdPlaceholder } from "@/components/ads/AdPlaceholder";
```
With:
```jsx
import { FreestarSlot } from "@/components/ads/FreestarSlot";
```

Replace:
```jsx
<AdPlaceholder slot="before-content" minHeight="100px" />
```
With:
```jsx
<FreestarSlot placementName="bigbrotherjunkies_leaderboard_atf" />
```

- [ ] **Step 2: Commit**

```bash
git add src/app/bigbrother-players/[slug]/page.jsx
git commit -m "feat: migrate player profile to FreestarSlot"
```

---

### Task 9: Migrate directory ads

**Files:**
- Modify: `src/app/directory/page.jsx`

- [ ] **Step 1: Replace ClientAdPlaceholder with FreestarSlot**

Replace:
```jsx
import { ClientAdPlaceholder } from "@/components/ads/ClientAdPlaceholder";
```
With:
```jsx
import { FreestarSlot } from "@/components/ads/FreestarSlot";
```

Replace:
```jsx
<ClientAdPlaceholder slot="directory_top" />
```
With:
```jsx
<FreestarSlot placementName="bigbrotherjunkies_leaderboard_atf" />
```

Replace:
```jsx
<ClientAdPlaceholder slot="directory_bottom" />
```
With:
```jsx
<FreestarSlot placementName="bigbrotherjunkies_incontent_reusable" />
```

- [ ] **Step 2: Commit**

```bash
git add src/app/directory/page.jsx
git commit -m "feat: migrate directory to FreestarSlot"
```

---

### Task 10: Migrate feed updates in-feed ads

**Files:**
- Modify: `src/components/posts/FeedUpdates.jsx`

- [ ] **Step 1: Replace AdPlaceholder with FreestarSlot**

Replace:
```jsx
import { AdPlaceholder } from "@/components/ads/AdPlaceholder";
```
With:
```jsx
import { FreestarSlot } from "@/components/ads/FreestarSlot";
```

Replace the ad rendering block:
```jsx
{showAd && (
  <div className="my-4">
    <AdPlaceholder slot={adSlot} minHeight="100px" />
  </div>
)}
```
With:
```jsx
{showAd && (
  <div className="my-4">
    <FreestarSlot
      placementName="bigbrotherjunkies_middle_feed"
      slotId={`bigbrotherjunkies_middle_feed_${Math.ceil(position / AD_INTERVAL)}`}
      showBranding={false}
    />
  </div>
)}
```

Note: Each in-feed ad instance gets a unique `slotId` to avoid duplicate HTML IDs. The `placementName` stays the same (Freestar maps the demand), but the `slotId` must be unique per DOM element. Remove the old dynamic `adSlot` variable.

- [ ] **Step 2: Commit**

```bash
git add src/components/posts/FeedUpdates.jsx
git commit -m "feat: migrate feed updates in-feed ads to FreestarSlot"
```

---

### Task 11: Simplify ContentWithAds

**Files:**
- Modify: `src/components/posts/ContentWithAds.jsx`

- [ ] **Step 1: Simplify to just render HTML**

Freestar's `bigbrotherjunkies_articles_dynamic_incontent` auto-inserts ads between paragraphs. Remove the paragraph-splitting logic. Add a single manual `middle_post` slot as a mid-article fallback.

Replace the entire file with:

```jsx
import { FreestarSlot } from "@/components/ads/FreestarSlot";

/**
 * Renders post content with optional mid-article ad
 * In-content ads are handled by Freestar's articles_dynamic_incontent (auto-inserted by SDK)
 * We place one manual mid-article slot as a guaranteed placement
 *
 * @param {string} content - HTML content to render
 * @param {string} className - CSS class for the wrapper
 * @param {boolean} showAds - Whether to show the mid-article ad (default: true)
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

  // Split content roughly in half to insert a mid-article ad
  const midpoint = findMidpoint(content);

  if (midpoint === -1) {
    // Not enough content to split — just render with no manual ad
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
  const minLength = 1500; // Don't split short content
  if (content.length < minLength) return -1;

  const mid = Math.floor(content.length / 2);
  // Search for the nearest </p> after the midpoint
  const afterMid = content.indexOf("</p>", mid);
  if (afterMid === -1) return -1;

  return afterMid + 4; // After the closing </p> tag
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/posts/ContentWithAds.jsx
git commit -m "refactor: simplify ContentWithAds — Freestar handles in-content ads"
```

---

## Chunk 3: Admin Settings & Cleanup

### Task 12: WordPress API endpoint for ad settings

**Files:**
- Create: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\AdSettingsRoutes.php`
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Plugin.php`

- [ ] **Step 1: Create AdSettingsRoutes.php**

```php
<?php

namespace BigBrotherJunkies\Data\Api;

use WP_REST_Request;
use WP_REST_Response;
use BigBrotherJunkies\Data\Permissions\PermissionChecker;

class AdSettingsRoutes
{
    private const OPTION_KEY = 'bbjd_freestar_settings';

    private const DEFAULTS = [
        'ads_enabled'          => true,
        'disabled_placements'  => [],
        'house_ad'             => 'premium-cta',
        'supporter_roles'      => ['administrator', 'editor', 'supporter', 'lifetime'],
        'pwa_suppressed'       => ['bigbrotherjunkies_sticky_footer', 'bigbrotherjunkies_google_interstitial'],
    ];

    public function register(): void
    {
        add_action('rest_api_init', [$this, 'registerRoutes']);
    }

    public function registerRoutes(): void
    {
        register_rest_route('bbjd/v1', '/ad-settings', [
            [
                'methods'             => 'GET',
                'callback'            => [$this, 'getSettings'],
                'permission_callback' => '__return_true',
            ],
            [
                'methods'             => 'POST',
                'callback'            => [$this, 'updateSettings'],
                'permission_callback' => function () {
                    return PermissionChecker::userCan('ad_management');
                },
            ],
        ]);
    }

    public function getSettings(): WP_REST_Response
    {
        $settings = get_option(self::OPTION_KEY, self::DEFAULTS);
        $settings = wp_parse_args($settings, self::DEFAULTS);

        return new WP_REST_Response($settings, 200);
    }

    public function updateSettings(WP_REST_Request $request): WP_REST_Response
    {
        $current = get_option(self::OPTION_KEY, self::DEFAULTS);
        $body = $request->get_json_params();

        $updated = [
            'ads_enabled'         => isset($body['ads_enabled']) ? (bool) $body['ads_enabled'] : $current['ads_enabled'],
            'disabled_placements' => isset($body['disabled_placements']) ? array_map('sanitize_text_field', (array) $body['disabled_placements']) : $current['disabled_placements'],
            'house_ad'            => isset($body['house_ad']) ? sanitize_text_field($body['house_ad']) : $current['house_ad'],
            'supporter_roles'     => isset($body['supporter_roles']) ? array_map('sanitize_text_field', (array) $body['supporter_roles']) : $current['supporter_roles'],
            'pwa_suppressed'      => isset($body['pwa_suppressed']) ? array_map('sanitize_text_field', (array) $body['pwa_suppressed']) : $current['pwa_suppressed'],
        ];

        update_option(self::OPTION_KEY, $updated);

        return new WP_REST_Response($updated, 200);
    }
}
```

- [ ] **Step 2: Register the route in Plugin.php**

In `Plugin.php`, add the import at the top with the other `use` statements:
```php
use BigBrotherJunkies\Data\Api\AdSettingsRoutes;
```

Then in `initApiRoutes()` method, add:
```php
(new Api\AdSettingsRoutes())->register();
```

- [ ] **Step 3: Commit**

```bash
cd /c/xampp/htdocs/bbj/wp-content/plugins/bigbrotherjunkies-data
git add src/Api/AdSettingsRoutes.php src/Plugin.php
git commit -m "feat: add /bbjd/v1/ad-settings REST endpoint for Freestar settings"
```

---

### Task 13: Frontend admin ads page

**Files:**
- Modify: `src/app/admin/ads/page.jsx`
- Create: `src/lib/api/ad-settings.js`

- [ ] **Step 1: Create ad-settings API client**

Note: `adminFetch` is NOT exported from `admin.js`. Instead, add these functions directly to `src/lib/api/admin.js` (following the existing pattern where all admin API functions live in that file). OR export `adminFetch` by adding `export` before its declaration. Check which pattern is cleaner when implementing.

For a standalone file approach, use `getToken()` directly:

```javascript
import { getToken } from "@/lib/auth/token";

const API_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL ||
  "https://bigbrotherjunkies.com/wp-json";

export async function getAdSettings() {
  const res = await fetch(`${API_URL}/bbjd/v1/ad-settings`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch ad settings");
  return res.json();
}

export async function updateAdSettings(settings) {
  const token = getToken();
  const res = await fetch(`${API_URL}/bbjd/v1/ad-settings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to update ad settings");
  return res.json();
}
```

- [ ] **Step 2: Build the admin ads page**

Replace the placeholder `src/app/admin/ads/page.jsx` with a full settings page. This should include:

- Toggle for kill switch (ads_enabled)
- Toggles for each of the 7 manual Freestar placements + 6 auto-managed
- Dropdown for house ad selection (premium-cta, newsletter)
- Checkboxes for supporter roles
- Checkboxes for PWA-suppressed placements
- Save button that POSTs to the API

Use the same admin UI patterns as other admin pages in the project (check `src/app/admin/` for existing patterns — use the same card/section styling, toast notifications, etc.)

The page is already a `"use client"` component. Use `useEffect` to fetch settings on mount, `useState` for form state, and call `updateAdSettings()` on save.

- [ ] **Step 3: Verify admin page loads**

Run: `npm run dev`
Visit `http://localhost:3000/admin/ads` — should show the settings form. Saving should persist to WordPress.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/ad-settings.js src/app/admin/ads/page.jsx
git commit -m "feat: add frontend admin ads settings page"
```

---

### Task 14: Add ads.txt to public folder

**Files:**
- Create: `public/ads.txt`

- [ ] **Step 1: Get ads.txt content from Freestar dashboard**

Go to pubos.freestar.io → Site Configuration → Ads.txt tab. Copy the full content.

Create `public/ads.txt` with that content. If Freestar manages it dynamically and you can't get a static version, create a placeholder with a comment:

```
# Freestar ads.txt for bigbrotherjunkies.com
# Copy the full content from pubos.freestar.io > Site Configuration > Ads.txt
# This file MUST be kept in sync with Freestar's dashboard
```

Also add your AdSense publisher ID line if not already included by Freestar:
```
google.com, pub-1172879704296990, DIRECT, f08c47fec0942fa0
```

- [ ] **Step 2: Commit**

```bash
git add public/ads.txt
git commit -m "feat: add ads.txt for Freestar and AdSense"
```

---

### Task 15: Clean up retired code

**Files:**
- Modify: `src/components/ads/AdBlockerMessage.jsx` (retire — functionality now in FreestarSlot)
- Modify: `src/hooks/useAdBlockDetector.js` (retire — functionality now in AdContext)
- Modify: `src/lib/api/ads.js` (remove `getSlotAd`, `getMultipleSlotAds`, `shouldShowAds`; keep `getAdScripts`)

- [ ] **Step 1: Trim ads.js to only keep getAdScripts**

Remove `getSlotAd()`, `getMultipleSlotAds()`, and `shouldShowAds()` from `src/lib/api/ads.js`. Keep only `getAdScripts()` (still needed for analytics/global scripts in layout.jsx).

- [ ] **Step 2: Verify no remaining imports of old components**

Run: `grep -r "AdPlaceholder\|ClientAdPlaceholder" src/app/ src/components/ --include="*.jsx" --include="*.js" -l`

Expected: Only the retired files themselves (`AdPlaceholder.jsx`, `ClientAdPlaceholder.jsx`) and possibly `AdBlockerMessage.jsx` and docs. No page or layout files should import them.

- [ ] **Step 3: Build check**

Run: `npm run build`
Expected: Build succeeds with no errors. Warnings about unused imports in retired files are OK.

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/ads.js
git commit -m "refactor: clean up retired ad API functions, keep getAdScripts for analytics"
```

---

### Task 16: Full integration test

- [ ] **Step 1: Run production build**

Run: `npm run build && npm run start`
Expected: Build succeeds, app starts on port 3000

- [ ] **Step 2: Test all pages with ads**

Visit each page and verify FreestarSlot containers render:
- `http://localhost:3000` — homepage: 2 content ads + sidebar ads
- `http://localhost:3000/some-post-slug` — single post: leaderboard + middle_post + sidebar
- `http://localhost:3000/bigbrother-players/some-player` — player: leaderboard + sidebar
- `http://localhost:3000/directory` — directory: leaderboard + bottom ad + sidebar

Check: No console errors, CLS prevention heights visible, "Advertisement" branding shows

- [ ] **Step 3: Test supporter flow**

Log in as a supporter/admin user. Verify:
- No Freestar SDK loaded (check Network tab)
- No ad containers rendered in the DOM
- No "Advertisement" text visible anywhere

- [ ] **Step 4: Test ad blocker simulation**

Add `?adblock=1` to URL or use a real ad blocker. Verify:
- House ad (Premium CTA) shows instead of empty slots
- "Explore Premium" link works

- [ ] **Step 5: Verify admin settings page**

Visit `http://localhost:3000/admin/ads`:
- Toggle kill switch → reload page → ads should disappear/reappear
- Disable a specific placement → that slot should not render

- [ ] **Step 6: Final commit**

If any fixes were needed during testing, commit them:
```bash
git add -A
git commit -m "fix: integration test fixes for Freestar ad system"
```
