# Freestar React Component Migration — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the custom Freestar SDK integration with Freestar's official React component package, add CMP consent, HEM email passthrough, and SPA route tracking.

**Architecture:** Install `@freestar/pubfig-adslot-react-component`, refactor `FreestarSlot.jsx` to wrap it via `dynamic()` with `ssr: false`, simplify `AdContext` (remove `sdkReady`, add route tracking + HEM via `useAuth()`), update head code to match Freestar's PDF snippet, add CMP button to footer.

**Tech Stack:** Next.js 15 (App Router, JavaScript), `@freestar/pubfig-adslot-react-component`, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-18-freestar-react-component-migration-design.md`

---

## Chunk 1: Dependencies & Config

### Task 1: Install packages and update ad config

**Files:**
- Modify: `package.json`
- Modify: `src/config/ads.js`
- Modify: `src/app/admin/ads/page.jsx:6-14`

- [ ] **Step 1: Install Freestar React component and prop-types**

```bash
npm install @freestar/pubfig-adslot-react-component prop-types --save
```

- [ ] **Step 2: Add sticky siderail placement to ads.js**

In `src/config/ads.js`, add to the `adSlots` object after `bigbrotherjunkies_siderail_right_2`:

```javascript
bigbrotherjunkies_sticky_siderail_right: {
  desktop: { height: 250 },  // 300x250 primary (SDK handles sticky behavior)
  mobile: { height: 0 },     // Hidden on mobile
},
```

- [ ] **Step 3: Add sticky siderail to admin placements list**

In `src/app/admin/ads/page.jsx`, add to the `MANUAL_PLACEMENTS` array after the `siderail_right_2` entry:

```javascript
{ key: "bigbrotherjunkies_sticky_siderail_right", label: "Sticky Siderail Right" },
```

- [ ] **Step 4: Verify build succeeds**

```bash
npm run build 2>&1 | tail -5
```

Expected: Build completes without errors.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json src/config/ads.js src/app/admin/ads/page.jsx
git commit -m "feat(ads): install Freestar React component, add sticky siderail placement"
```

---

## Chunk 2: Core Component Refactor

### Task 2: Refactor FreestarSlot.jsx to use official React component

**Files:**
- Modify: `src/components/ads/FreestarSlot.jsx`

- [ ] **Step 1: Verify package exports**

```bash
node -e "const m = require('@freestar/pubfig-adslot-react-component'); console.log(Object.keys(m))"
```

Expected: Output includes `FreestarAdSlot`. If it's the default export instead of a named export, adjust the `dynamic()` import in the next step accordingly (use `import(...)` without `.then()`).

- [ ] **Step 2: Rewrite FreestarSlot.jsx**

Replace the entire file with:

```jsx
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useAds } from "@/context/AdContext";
import { getSlotConfig } from "@/config/ads";

const FreestarAdSlot = dynamic(
  () =>
    import("@freestar/pubfig-adslot-react-component").then((m) => ({
      default: m.FreestarAdSlot,
    })),
  { ssr: false }
);

export function FreestarSlot({
  placementName,
  slotId,
  className = "",
  showBranding = true,
  targeting,
}) {
  const { shouldShowAds, isPWA, isAdBlocked, disabledPlacements, pwaSuppressed } = useAds();

  const config = getSlotConfig(placementName);
  const desktopHeight = config.desktop?.height || 250;
  const mobileHeight = config.mobile?.height ?? desktopHeight;
  const hiddenOnMobile = mobileHeight === 0;

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
      <FreestarAdSlot
        publisher="bigbrotherjunkies-com"
        placementName={placementName}
        slotId={slotId}
        targeting={targeting}
      />
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
```

- [ ] **Step 2: Verify build succeeds**

```bash
npm run build 2>&1 | tail -5
```

Expected: Build completes. Note: `AdContext` still exports `sdkReady` at this point — that's fine, we just stopped consuming it here.

- [ ] **Step 4: Commit**

```bash
git add src/components/ads/FreestarSlot.jsx
git commit -m "refactor(ads): use official Freestar React component in FreestarSlot"
```

---

### Task 3: Simplify AdContext — remove sdkReady, add route tracking + HEM

**Files:**
- Modify: `src/context/AdContext.jsx`

- [ ] **Step 1: Rewrite AdContext.jsx**

Replace the entire file with:

```jsx
"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const AdContext = createContext({
  shouldShowAds: true,
  isPWA: false,
  isAdBlocked: false,
  disabledPlacements: [],
  pwaSuppressed: [],
});

const SDK_TIMEOUT_MS = 5000;

function detectPWA() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    window.navigator.standalone === true
  );
}

export function AdProvider({ children, initialShouldShowAds = true, disabledPlacements = [], pwaSuppressed = [] }) {
  const [isPWA, setIsPWA] = useState(false);
  const [isAdBlocked, setIsAdBlocked] = useState(false);
  const pathname = usePathname();
  const isFirstRender = useRef(true);
  const { user } = useAuth();
  const userEmail = user?.user_email;

  // PWA detection
  useEffect(() => {
    setIsPWA(detectPWA());
  }, []);

  // Ad-blocker detection — check if full SDK loaded after timeout
  useEffect(() => {
    if (!initialShouldShowAds) return;

    const timeout = setTimeout(() => {
      if (typeof window.freestar?.newAdSlots !== "function") {
        setIsAdBlocked(true);
      }
    }, SDK_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [initialShouldShowAds]);

  // SPA route tracking — skip initial render (SDK tracks first page view itself)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!initialShouldShowAds) return;
    import("@freestar/pubfig-adslot-react-component").then((m) => {
      if (typeof m.FreestarAdSlot?.trackPageView === "function") {
        m.FreestarAdSlot.trackPageView();
      }
    }).catch(() => {
      // SDK not loaded (ad-blocker or network issue) — non-critical
    });
  }, [pathname, initialShouldShowAds]);

  // HEM email passthrough — pass logged-in user's email to Freestar for identity matching
  useEffect(() => {
    if (!initialShouldShowAds || !userEmail) return;
    window.freestar?.queue?.push(function () {
      window.freestar.identity.setIdentity({ email: userEmail });
    });
  }, [initialShouldShowAds, userEmail]);

  return (
    <AdContext.Provider
      value={{
        shouldShowAds: initialShouldShowAds,
        isPWA,
        isAdBlocked,
        disabledPlacements,
        pwaSuppressed,
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

- [ ] **Step 2: Verify build succeeds**

```bash
npm run build 2>&1 | tail -5
```

Expected: Build completes without errors.

- [ ] **Step 3: Commit**

```bash
git add src/context/AdContext.jsx
git commit -m "refactor(ads): simplify AdContext, add SPA tracking and HEM passthrough"
```

---

## Chunk 3: Head Code & Layout

### Task 4: Update layout.jsx head code to match Freestar's PDF

**Files:**
- Modify: `src/app/layout.jsx`

- [ ] **Step 1: Update head preconnects and SDK scripts**

In `src/app/layout.jsx`, update the `<head>` block to conditionally render preconnects and add the missing Amazon/BTLoader preconnects + CLS stylesheet. Replace lines 111-118:

```jsx
<head>
  <ThemeScript />
  {shouldShowAds && (
    <>
      {/* Freestar preconnects */}
      <link rel="preconnect" href="https://a.pub.network/" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://b.pub.network/" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://c.pub.network/" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://d.pub.network/" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://c.amazon-adsystem.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://s.amazon-adsystem.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://btloader.com/" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://api.btloader.com/" crossOrigin="anonymous" />
      {/* Freestar CLS prevention stylesheet */}
      <link rel="stylesheet" href="https://a.pub.network/bigbrotherjunkies-com/cls.css" />
    </>
  )}
</head>
```

Then in the body, replace the existing `{shouldShowAds && (...)}` block (around line 148) with just the SDK scripts:

```jsx
{shouldShowAds && (
  <>
    {/* Freestar SDK init */}
    <Script id="freestar-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: `
      var freestar = freestar || {};
      freestar.queue = freestar.queue || [];
      freestar.config = freestar.config || {};
      freestar.config.enabled_slots = [];
      freestar.initCallback = function () {
        (freestar.config.enabled_slots.length === 0)
          ? freestar.initCallbackCalled = false
          : freestar.newAdSlots(freestar.config.enabled_slots)
      }
    `}} />
    {/* Freestar core SDK — data-cfasync prevents Cloudflare Rocket Loader from deferring */}
    <Script
      id="freestar-sdk"
      src="https://a.pub.network/bigbrotherjunkies-com/pubfig.min.js"
      strategy="afterInteractive"
      data-cfasync="false"
    />
  </>
)}
```

**Note on AdShield:** The AdShield script from Freestar's PDF is heavily obfuscated. Add it as a separate `<Script>` tag inside the `shouldShowAds` block. Copy the exact obfuscated content from the PDF (pages 5-6 of `Ad-Tag-set-up-guide-bigbrotherjunkies.com.pdf`). It's too large to include inline in this plan — copy from the PDF directly:

```jsx
{/* AdShield — adblock recovery (provided by Freestar) */}
<Script id="adshield" strategy="afterInteractive" data-cfasync="false" dangerouslySetInnerHTML={{ __html: `PASTE_ADSHIELD_SCRIPT_FROM_PDF_HERE` }} />
```

- [ ] **Step 2: Remove deprecated ad_header/ad_footer rendering**

In the same file, the `adScripts.global_header` and `adScripts.global_footer` rendering blocks (around lines 138-146) stay as-is. But if there are any blocks rendering `adScripts.ad_header` or `adScripts.ad_footer`, remove them. Currently there are none (they were already removed in a previous refactor), but verify.

- [ ] **Step 3: Verify build succeeds**

```bash
npm run build 2>&1 | tail -5
```

Expected: Build completes without errors.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.jsx
git commit -m "feat(ads): update head code to match Freestar PDF (preconnects, CLS CSS, initCallback)"
```

---

## Chunk 4: CMP & Footer

### Task 5: Add CMP privacy button to Footer and CSS

**Files:**
- Modify: `src/components/layout/Footer.jsx`
- Modify: `src/styles/globals.css`

- [ ] **Step 1: Add CMP button to Footer.jsx**

In `src/components/layout/Footer.jsx`, add the privacy manager button inside the copyright `<div>` (the one with `text-center text-xs py-4`), after the copyright `<p>` tag. Replace the copyright section:

```jsx
{/* Copyright */}
<div className="text-center text-xs py-4 border-t border-primary-400/30 mt-4 text-gray-600 dark:text-gray-400">
  <p>&copy; {currentYear} JunkyNet Media, LLC. All Rights Reserved</p>
  <button id="pmLink">Privacy Manager</button>
</div>
```

- [ ] **Step 2: Add CMP CSS to globals.css**

In `src/styles/globals.css`, add inside the `@layer components` block (after the existing `.freestar-slot` styles, around line 128):

```css
/* Freestar CMP (Sourcepoint) privacy manager resurfacing link.
   Starts hidden — Sourcepoint's script sets visibility: visible
   based on user geolocation (CCPA/GDPR). */
#pmLink {
  visibility: hidden;
  text-decoration: none;
  cursor: pointer;
  background: transparent;
  border: none;
  font-size: 0.75rem;
  color: inherit;
}
```

- [ ] **Step 3: Verify build succeeds**

```bash
npm run build 2>&1 | tail -5
```

Expected: Build completes without errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Footer.jsx src/styles/globals.css
git commit -m "feat(ads): add CMP privacy manager button to footer"
```

---

## Chunk 5: Verification & Cleanup

### Task 6: Local dev verification

**Files:** None (testing only)

- [ ] **Step 1: Start dev server and verify pages load**

```bash
npm run dev
```

Open `http://localhost:3000` in browser. Verify:
- Homepage loads without console errors
- The Freestar SDK script appears in the page source (for non-supporter users)
- No hydration mismatch warnings in console
- Ad slots render (they won't fill with real ads in dev, but the wrapper divs should appear)
- Footer shows the `Privacy Manager` button element (hidden by default, visible in DOM inspector)
- Feed updates page renders multiple ad slots correctly (FeedUpdates.jsx passes custom `slotId` for multiple instances of `middle_feed`)
- Freestar CLS stylesheet (`a.pub.network/.../cls.css`) loads without conflicts with existing `.freestar-slot` CSS

- [ ] **Step 2: Verify supporter ad hiding still works**

Log in as a supporter/admin user. Verify:
- No Freestar preconnect links in page source
- No Freestar SDK scripts loaded
- No ad wrapper divs rendered
- `shouldShowAds` is false in React DevTools (AdContext)

- [ ] **Step 3: Run production build**

```bash
npm run build 2>&1 | tail -10
```

Expected: Build completes without errors.

- [ ] **Step 4: Final commit if any cleanup needed**

If any issues were found and fixed during verification:

```bash
git add -A
git commit -m "fix(ads): address issues found during Freestar migration verification"
```
