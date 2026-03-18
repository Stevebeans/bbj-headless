# Freestar Official React Component Migration

**Date:** 2026-03-18
**Status:** Approved
**Approach:** Replace custom SDK wrangling with Freestar's official `@freestar/pubfig-adslot-react-component` package

## Overview

Freestar provided a React-specific integration guide (PDF) and confirmed we should use their official React package instead of manually managing the pubfig.js SDK. This migration swaps the internals of our ad system while preserving all existing wrapper logic (supporter hiding, ad-blocker fallback, PWA suppression, admin settings).

### Goals
- Use Freestar's official React component for slot lifecycle management
- Match their exact head code snippet (preconnects, CLS CSS, AdShield, Amazon)
- Add CMP consent button (Sourcepoint, auto-injected by Freestar)
- Add HEM email passthrough for logged-in users (boosts ad revenue)
- Add SPA route change tracking via `FreestarAdSlot.trackPageView()`
- Add `bigbrotherjunkies_sticky_siderail_right` placement from their spreadsheet

### What Stays the Same
- `shouldShowAds = false` for supporters — component returns `null`, head code gated
- Ad-blocker fallback showing Premium CTA
- Admin settings at `/admin/ads` (kill switch, per-placement disable, PWA suppressions)
- Branding wrapper ("Advertisement" / "Go Ad-Free")
- CLS height reservation from `ads.js` config
- `AdProvider` wrapping the app via `Providers.jsx`

## Architecture

### Package Installation

```bash
npm install @freestar/pubfig-adslot-react-component --save
```

Peer dependencies: `react` is already installed. `prop-types` is not currently in `package.json` and must be added.

### FreestarSlot.jsx Refactor

**Current:** Manually calls `window.freestar.config.enabled_slots.push()`, `window.freestar.newAdSlots()`, and `window.freestar.deleteAdSlots()` in a `useEffect`.

**New:** Wraps Freestar's `<FreestarAdSlot>` loaded via Next.js `dynamic()` with `ssr: false` to avoid SSR hydration issues.

```jsx
import dynamic from "next/dynamic";

const FreestarAdSlot = dynamic(
  () => import("@freestar/pubfig-adslot-react-component").then(m => ({ default: m.FreestarAdSlot })),
  { ssr: false }
);
```

**Important:** Next.js `dynamic()` expects the factory to resolve with a `default` export. Since `FreestarAdSlot` is a named export, we wrap it in `{ default: m.FreestarAdSlot }`. Verify this against the actual package exports at implementation time — if it happens to be the default export, simplify to just `import(...)`.

**Removed from current implementation:**
- The entire `useEffect` that manages `enabled_slots`, `newAdSlots`, `deleteAdSlots` — replaced by the React component
- The `sdkReady` dependency — the official component handles SDK readiness internally
- The `useId()`-based `slotId` auto-generation — the React component manages its own DOM IDs. No existing callers pass a custom `slotId`, so this logic is dead code. The `slotId` prop is kept in the component interface as an optional pass-through for future use (e.g., same placementName multiple times on a page).

**Preserved wrapper logic:**
1. Return `null` if `!shouldShowAds` (supporter)
2. Return `null` if placement is in `disabledPlacements` (admin kill per-slot)
3. Return `null` if PWA mode and placement is in `pwaSuppressed`
4. Show Premium CTA if `isAdBlocked`
5. Reserve CLS height via `getSlotConfig()` heights
6. Wrap in "Advertisement" / "Go Ad-Free" branding when `showBranding` is true

**FreestarAdSlot props used:**
- `publisher="bigbrotherjunkies-com"` (constant)
- `placementName` (passed through)
- `slotId` (optional, only pass when explicitly provided by caller — the React component manages its own DOM IDs internally by default)
- `targeting` (optional, for per-slot targeting)

### AdContext.jsx Changes

**Remove:** `sdkReady` state and the polling interval that checks for `window.freestar.config`. The React component handles SDK bootstrapping internally.

**Keep:**
- `shouldShowAds` — from server-side supporter check
- `isPWA` — client-side detection
- `disabledPlacements` — from admin settings API
- `pwaSuppressed` — from admin settings API

**Changed: Ad-blocker detection**

The current approach polls for `window.freestar.config` and falls back to `isAdBlocked` after 5s. Since the head code initializes `window.freestar` as a stub object (so `window.freestar` always exists), we need a deeper check. After the timeout, check for a property that only exists after the full SDK loads (e.g., `window.freestar.newAdSlots` being a function, not undefined):

```jsx
const [isAdBlocked, setIsAdBlocked] = useState(false);

useEffect(() => {
  if (!initialShouldShowAds) return;

  const timeout = setTimeout(() => {
    // The head code creates window.freestar as a stub.
    // If the full SDK loaded, freestar.newAdSlots will be a function.
    // If blocked, it remains undefined (only the stub exists).
    if (typeof window.freestar?.newAdSlots !== "function") {
      setIsAdBlocked(true);
    }
  }, SDK_TIMEOUT_MS);

  return () => clearTimeout(timeout);
}, [initialShouldShowAds]);
```

**Add: SPA route tracking**

Use Next.js `usePathname()` to detect route changes and call `FreestarAdSlot.trackPageView()`. Skip the initial render to avoid double-counting the first page view (the SDK already tracks it on load):

```jsx
import { usePathname } from "next/navigation";
import { useRef } from "react";

// Inside AdProvider:
const pathname = usePathname();
const isFirstRender = useRef(true);

useEffect(() => {
  if (isFirstRender.current) {
    isFirstRender.current = false;
    return;
  }
  if (!initialShouldShowAds) return;
  import("@freestar/pubfig-adslot-react-component").then(m => {
    m.FreestarAdSlot.trackPageView();
  });
}, [pathname, initialShouldShowAds]);
```

**Add: HEM email passthrough**

When a logged-in user's email is available, pass it to Freestar for hashed identity matching (Option A — Freestar hashes it). This boosts ad inventory value.

`AdProvider` is nested inside `AuthProvider` in the component tree (see `Providers.jsx`), so it can use `useAuth()` directly to get the user's email — no prop-drilling needed:

```jsx
import { useAuth } from "@/context/AuthContext";

// Inside AdProvider:
const { user } = useAuth();
const userEmail = user?.user_email;

useEffect(() => {
  if (!initialShouldShowAds || !userEmail) return;
  // freestar.queue is initialized by the head code stub, so this is safe
  // even before the full SDK loads. The queue executes when the SDK initializes.
  window.freestar?.queue?.push(function() {
    window.freestar.identity.setIdentity({ email: userEmail });
  });
}, [initialShouldShowAds, userEmail]);
```

**Queue safety:** The head code initializes `window.freestar.queue = []` before the SDK script loads. Calls pushed to the queue execute when the SDK initializes via `freestar.initCallback`. This means `setIdentity` is safe to queue even before the SDK fully loads — it will execute once the SDK is ready. The `window.freestar?.queue?.push` guard handles the edge case where the head code hasn't run yet (e.g., if ads are disabled).

### layout.jsx Head Code Update

Replace current Freestar head code with the exact snippet from their PDF. Still gated behind `shouldShowAds`.

**Full head code block (inside `{shouldShowAds && ( ... )}`):**

```jsx
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

{/* Freestar SDK init + script */}
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
<Script
  id="freestar-sdk"
  src="https://a.pub.network/bigbrotherjunkies-com/pubfig.min.js"
  strategy="afterInteractive"
  data-cfasync="false"  // Prevents Cloudflare Rocket Loader from deferring — would break ad loading
/>

{/* AdShield — adblock recovery (provided by Freestar) */}
<Script id="adshield" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `/* AdShield obfuscated script from PDF — paste exact content at implementation */` }} />
```

**Notes:**
- Preconnects move from `<head>` to the `shouldShowAds` conditional block (they were always there but not gated — now they are)
- The CLS stylesheet from Freestar supplements our own CLS height reservations. Freestar's CSS targets their SDK-generated DOM elements; our heights target the wrapper divs before the SDK renders. No conflict.
- The AdShield script is heavily obfuscated (provided by Freestar in their PDF). It's their adblock recovery tool. We paste it exactly as provided — do not modify.
- `freestar.initCallback` is Freestar's mechanism to fill slots that were registered before the SDK loaded. The React component handles slot registration internally, so this is a fallback for the head-code-only path.

**`getAdScripts()` disposition:** The `getAdScripts()` call and its rendering logic in `layout.jsx` still serves a purpose: it loads `global_header`/`global_footer` scripts (GA4, analytics). The old `ad_header`/`ad_footer` fields from that endpoint are now deprecated (replaced by the hardcoded Freestar head code above). Keep the `getAdScripts()` call but only render `global_header` and `global_footer` fields. The `ad_header`/`ad_footer` rendering can be removed.

### ads.js Config Update

Add the new placement from Freestar's spreadsheet:

```javascript
bigbrotherjunkies_sticky_siderail_right: {
  desktop: { height: 250 },  // 300x250 primary size (sticky positioning managed by SDK)
  mobile: { height: 0 },     // Hidden on mobile
},
```

**Note:** Sticky ad positioning is managed by the Freestar SDK, not by CSS height reservation. The CLS height here is set to 250px (the primary ad size) rather than 600px, since the SDK handles the sticky behavior. This placement is added to config but not placed in the UI yet — confirm with Freestar during QA whether it should replace `siderail_right_1` or be placed separately.

### Footer CMP Button

Freestar uses Sourcepoint for consent management (CCPA/GDPR). The CMP is auto-injected by their SDK, but we need a "resurfacing link" in the footer for users to re-open privacy preferences.

**Footer.jsx:** Add button in the copyright bar area:

```jsx
<button id="pmLink" className="pm-link">Privacy Manager</button>
```

**globals.css:** Add required CSS:

```css
/* Freestar CMP (Sourcepoint) privacy manager resurfacing link.
   Starts hidden — Sourcepoint's script sets visibility: visible
   based on user geolocation (CCPA: "Do Not Sell", GDPR: "Privacy Preferences"). */
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

The hover rule from Freestar's example (`#pmLink:hover { visibility: visible }`) is omitted — an invisible element cannot receive hover events. Sourcepoint controls visibility via JS; once visible, the button inherits standard footer link styling.

## Placement Reference

From Freestar's spreadsheet — all confirmed placements:

### Manual (we render `<FreestarSlot>`)

| Placement | Primary Sizes | Location |
|---|---|---|
| `bigbrotherjunkies_leaderboard_atf` | 728x90, 320x100, 300x250, 970x90 + many more | Top of content, all pages |
| `bigbrotherjunkies_incontent_reusable` | 300x250, 336x280, 728x90 | Between sections, homepage |
| `bigbrotherjunkies_incontent_reusable_Homepage2` | 300x250, 336x280, 728x90 | Below feed updates, homepage |
| `bigbrotherjunkies_middle_feed` | 300x250, 336x280, 600x300 | Between feed items |
| `bigbrotherjunkies_middle_post` | 300x250, 336x280, 600x300 | Mid-article |
| `bigbrotherjunkies_siderail_right_1` | 300x250, 336x280, 300x600 | Sidebar top |
| `bigbrotherjunkies_siderail_right_2` | 300x250, 336x280, 300x600 | Sidebar bottom |
| `bigbrotherjunkies_sticky_siderail_right` | 300x250, 336x280, 300x600 | Sidebar sticky (confirm placement with Freestar) |

### Auto-Managed (Freestar SDK injects, zero code)

| Placement | Behavior |
|---|---|
| `bigbrotherjunkies_articles_dynamic_incontent` | Auto-inserts between article paragraphs |
| `bigbrotherjunkies_comments_dynamic_incontent` | Auto-inserts between comments |
| `bigbrotherjunkies_sticky_footer` | Sticky bar at bottom of viewport |
| `bigbrotherjunkies_sticky_pushdown` | Pushdown unit at top |
| `bigbrotherjunkies_google_interstitial` | Full-page interstitial |
| `FreeStarVideoAdContainer_Slider` | Floating video player |

## Files Changed

### Modified
- `package.json` — add `@freestar/pubfig-adslot-react-component` (and `prop-types` if missing)
- `src/components/ads/FreestarSlot.jsx` — replace manual SDK calls with official component via `dynamic()`
- `src/context/AdContext.jsx` — remove `sdkReady`, simplify ad-blocker detection, add SPA route tracking + HEM via `useAuth()`
- `src/app/layout.jsx` — update head code to match PDF snippet (add Amazon/BTLoader preconnects, CLS CSS, initCallback, AdShield), remove `ad_header`/`ad_footer` rendering
- `src/config/ads.js` — add `sticky_siderail_right` placement
- `src/app/admin/ads/page.jsx` — add `sticky_siderail_right` to `MANUAL_PLACEMENTS` array
- `src/components/layout/Footer.jsx` — add CMP privacy button
- `src/styles/globals.css` — add CMP button CSS

### Not Changed
- `src/components/Providers.jsx` — no changes needed (HEM uses `useAuth()` inside AdProvider instead of prop-drilling)
- `src/lib/api/ad-settings.js` — admin API client stays as-is
- `src/components/ads/house-ads/` — house ad components stay as-is
- All page files using `<FreestarSlot>` — no prop changes needed, same API

## Rollback Plan

If Freestar QA fails or revenue drops after launch:
1. Revert the git commit — our old manual SDK approach still works
2. No Freestar dashboard changes needed (placements are the same)
3. The `@freestar/pubfig-adslot-react-component` package can stay installed harmlessly

## AdSense Backfill (Separate, Post-Migration)

Not part of this migration. After Freestar QAs the staging deployment, we'll:
1. Set up AdSense ad units (fixed sizes, named `bigbrotherjunkies_fs_300x250`, etc.)
2. Send tags to `trafficking@freestar.com`
3. Add AdSense pub ID to ads.txt
4. Set up daily reporting to `scheduled-reports@freestar.com`

## Deployment Plan

1. Implement changes on `staging` branch
2. Push to staging (Vercel + WP plugin if needed)
3. Share staging URL with Freestar via their Onboarding page > Testing tab
4. Freestar QAs the implementation
5. Address any feedback
6. Coordinate production launch with Freestar
