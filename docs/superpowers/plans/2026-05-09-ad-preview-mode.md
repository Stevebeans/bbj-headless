# Ad Preview Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give admin a per-session cookie-based toggle on `/admin/ads` that replaces every `<FreestarSlot>` on the site with a labeled, sized placeholder card. Regular visitors continue to see real ads.

**Architecture:** Cookie-driven preview mode flag plumbed through the existing `AdContext`. Admin toggle on `/admin/ads` reads/writes the cookie. `FreestarSlot` checks `previewMode` BEFORE its existing branches (supporter check, ad-blocker, real ad render) and short-circuits to `<AdPlaceholder>` when active. Role check inside `AdContext` ensures only admins can ever see placeholders.

**Tech Stack:** Next.js 15 App Router, React 19, JavaScript (no TypeScript), Tailwind CSS v3, `js-cookie@^3.0.5` (already in package.json).

**Spec:** `docs/superpowers/specs/2026-05-09-ad-preview-mode-design.md`

**Verification model:** No Jest/Vitest. Verify via local dev server (`npm run dev`), `npm run lint`, `npm run build`, and visual inspection. The user has the homepage running on `http://localhost:3000`.

---

## File Map

- Modify: `src/config/ads.js` — add `width` + `label` per slot
- Create: `src/components/ads/AdPlaceholder.jsx` — gray placeholder card
- Modify: `src/context/AdContext.jsx` — add `previewMode` derived from cookie + role
- Modify: `src/components/ads/FreestarSlot.jsx` — branch to placeholder when `previewMode`
- Modify: `src/app/admin/ads/page.jsx` — preview-mode toggle UI in Global Ad Control card

---

## Pre-flight

- [ ] **Step 1: Confirm working directory and branch**

```powershell
cd C:\xampp\htdocs\bbj-app
git status
git branch --show-current
```

Expected: working tree clean (or only the untracked spec file from earlier), branch `feature/v2-homepage-match`.

- [ ] **Step 2: Confirm dev server is running**

The user already has `npm run dev` running on port 3000. Visit `http://localhost:3000` — should render. Leave it running.

- [ ] **Step 3: Confirm `js-cookie` is installed**

```powershell
Select-String -Path "C:\xampp\htdocs\bbj-app\package.json" -Pattern "js-cookie"
```

Expected: `"js-cookie": "^3.0.5"` listed in dependencies.

---

## Task 1: Add `width` and `label` to adSlots config

**Files:**
- Modify: `src/config/ads.js`

**Why:** `AdPlaceholder` (Task 2) reads width and label from `getSlotConfig()`. The current config only has `height` per slot — needs `width` (for `WIDTH × HEIGHT` display) and a top-level `label` (for the friendly name).

- [ ] **Step 1: Open `src/config/ads.js` and replace the `adSlots` object**

Find:

```js
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
  bigbrotherjunkies_sticky_siderail_right: {
    desktop: { height: 250 },  // 300x250 primary (SDK handles sticky behavior)
    mobile: { height: 0 },     // Hidden on mobile
  },
};
```

Replace with:

```js
export const adSlots = {
  bigbrotherjunkies_leaderboard_atf: {
    desktop: { width: 728, height: 90 },
    mobile: { width: 320, height: 100 },
    label: "Leaderboard ATF",
  },
  bigbrotherjunkies_incontent_reusable: {
    desktop: { width: 336, height: 280 },
    mobile: { width: 300, height: 250 },
    label: "In-Content Reusable",
  },
  bigbrotherjunkies_incontent_reusable_Homepage2: {
    desktop: { width: 336, height: 280 },
    mobile: { width: 300, height: 250 },
    label: "In-Content (Homepage 2)",
  },
  bigbrotherjunkies_middle_feed: {
    desktop: { width: 336, height: 280 },
    mobile: { width: 300, height: 250 },
    label: "Middle Feed",
  },
  bigbrotherjunkies_middle_post: {
    desktop: { width: 336, height: 280 },
    mobile: { width: 300, height: 250 },
    label: "Middle Post",
  },
  bigbrotherjunkies_siderail_right_1: {
    desktop: { width: 300, height: 250 },
    mobile: { width: 0, height: 0 },
    label: "Siderail Right 1",
  },
  bigbrotherjunkies_siderail_right_2: {
    desktop: { width: 300, height: 250 },
    mobile: { width: 0, height: 0 },
    label: "Siderail Right 2",
  },
  bigbrotherjunkies_sticky_siderail_right: {
    desktop: { width: 300, height: 250 },
    mobile: { width: 0, height: 0 },
    label: "Sticky Siderail",
  },
};
```

- [ ] **Step 2: Update the `getSlotConfig` fallback to include the new fields**

Find:

```js
export function getSlotConfig(placementName) {
  return adSlots[placementName] || { desktop: { height: 250 }, mobile: { height: 250 } };
}
```

Replace with:

```js
export function getSlotConfig(placementName) {
  return (
    adSlots[placementName] || {
      desktop: { width: 300, height: 250 },
      mobile: { width: 300, height: 250 },
      label: "Unknown Slot",
    }
  );
}
```

- [ ] **Step 3: Lint**

```powershell
npm run lint
```

Expected: no new errors.

- [ ] **Step 4: Verify dev server still compiles**

Watch the dev server terminal — Tailwind/Next should hot-reload with no errors. Open `http://localhost:3000` to confirm the page still renders (existing FreestarSlot uses `desktop.height` / `mobile.height` which are still present, so nothing breaks).

- [ ] **Step 5: Commit**

```powershell
git add src/config/ads.js
git commit -m "feat(ads): add width and label to ad slot configs"
```

---

## Task 2: Build `AdPlaceholder` component

**Files:**
- Create: `src/components/ads/AdPlaceholder.jsx`

**Why:** Visual placeholder rendered in place of real ads when preview mode is active. Same reserved height as the real ad so layout doesn't shift.

- [ ] **Step 1: Create `src/components/ads/AdPlaceholder.jsx`**

```jsx
"use client";

/**
 * Ad slot placeholder rendered in place of a real Freestar ad when admin
 * preview mode is active. Visually communicates the slot's size and label
 * while reserving the same height as the real ad would occupy.
 */
export function AdPlaceholder({ placementName, config, hiddenOnMobile = false, className = "" }) {
  const desktop = config?.desktop || { width: 300, height: 250 };
  const mobile = config?.mobile || { width: 300, height: 250 };
  const label = config?.label || "Ad Slot";

  // Build a compact size string. If desktop and mobile dims differ, show both.
  const sameSize =
    desktop.width === mobile.width && desktop.height === mobile.height;
  const desktopSize = `${desktop.width} × ${desktop.height}`;
  const mobileSize = `${mobile.width} × ${mobile.height}`;

  return (
    <div
      className={`flex items-center justify-center ${
        hiddenOnMobile ? "hidden md:block" : ""
      } ${className}`}
      style={{
        "--ad-h": `${mobile.height}px`,
        "--ad-h-desktop": `${desktop.height}px`,
      }}
      aria-label="Ad slot preview placeholder"
      data-placement={placementName}
    >
      <div
        className="w-full h-[var(--ad-h)] md:h-[var(--ad-h-desktop)] flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-600 rounded text-center px-3"
      >
        <div className="font-display text-xl md:text-2xl font-bold text-primary-500 dark:text-primary-400 leading-tight">
          {sameSize ? desktopSize : (
            <>
              <span className="hidden md:inline">{desktopSize}</span>
              <span className="md:hidden">{mobileSize}</span>
            </>
          )}
        </div>
        <div className="mt-1 font-osw uppercase tracking-wider text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
          {label}
        </div>
        <div className="mt-1 font-mono text-[9px] text-slate-400 dark:text-slate-500 truncate max-w-full">
          {placementName}
        </div>
      </div>
    </div>
  );
}

export default AdPlaceholder;
```

- [ ] **Step 2: Lint**

```powershell
npm run lint
```

- [ ] **Step 3: Commit**

```powershell
git add src/components/ads/AdPlaceholder.jsx
git commit -m "feat(ads): add AdPlaceholder component for preview mode"
```

---

## Task 3: Wire `previewMode` through `AdContext`

**Files:**
- Modify: `src/context/AdContext.jsx`

**Why:** Single source of truth for preview state. Reads cookie on mount, cross-checks against admin role, exposes `previewMode` flag to consumers (`FreestarSlot`).

- [ ] **Step 1: Update the imports at the top of `src/context/AdContext.jsx`**

Find:

```jsx
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
```

Replace with:

```jsx
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { useAuth } from "@/context/AuthContext";

const PREVIEW_COOKIE_NAME = "bbj_ad_preview";
const PREVIEW_ADMIN_ROLES = ["administrator", "editor"];
```

- [ ] **Step 2: Update the default context value**

Find:

```jsx
const AdContext = createContext({
  shouldShowAds: true,
  isPWA: false,
  isAdBlocked: false,
  disabledPlacements: [],
  pwaSuppressed: [],
});
```

Replace with:

```jsx
const AdContext = createContext({
  shouldShowAds: true,
  isPWA: false,
  isAdBlocked: false,
  disabledPlacements: [],
  pwaSuppressed: [],
  previewMode: false,
});
```

- [ ] **Step 3: Add preview-mode state and the cookie-read effect inside `AdProvider`**

Find this block in the `AdProvider` function body:

```jsx
  const [isPWA, setIsPWA] = useState(false);
  const [isAdBlocked, setIsAdBlocked] = useState(false);
```

Replace with:

```jsx
  const [isPWA, setIsPWA] = useState(false);
  const [isAdBlocked, setIsAdBlocked] = useState(false);
  const [previewCookie, setPreviewCookie] = useState(false);
```

Then, find the existing PWA detection effect:

```jsx
  // PWA detection
  useEffect(() => {
    setIsPWA(detectPWA());
  }, []);
```

Add a new effect IMMEDIATELY AFTER it:

```jsx
  // Read preview-mode cookie on mount and whenever auth state changes
  useEffect(() => {
    const value = Cookies.get(PREVIEW_COOKIE_NAME);
    setPreviewCookie(value === "1");
  }, [user?.id]);
```

(The dependency on `user?.id` ensures the cookie is re-read after a login/logout. If the codebase uses `user?.user_id` or another id field instead, match that — verify in `useAuth()` what the id field name is.)

- [ ] **Step 4: Compute `previewMode` and add to context value**

Find the line:

```jsx
  const shouldShowAds = initialShouldShowAds && !isSupporter;
```

Add directly below it:

```jsx
  // Preview mode: cookie present AND user is admin/editor.
  // Always false for logged-out, non-admin, or cookie-absent users.
  const isAdmin =
    user &&
    Array.isArray(user.user_roles) &&
    user.user_roles.some((role) => PREVIEW_ADMIN_ROLES.includes(role));
  const previewMode = previewCookie && isAdmin;
```

Then find the `AdContext.Provider` value object:

```jsx
    <AdContext.Provider
      value={{
        shouldShowAds,
        isPWA,
        isAdBlocked,
        disabledPlacements,
        pwaSuppressed,
      }}
    >
```

Replace with:

```jsx
    <AdContext.Provider
      value={{
        shouldShowAds,
        isPWA,
        isAdBlocked,
        disabledPlacements,
        pwaSuppressed,
        previewMode,
      }}
    >
```

- [ ] **Step 5: Lint**

```powershell
npm run lint
```

- [ ] **Step 6: Verify dev server**

Reload `http://localhost:3000`. Should render normally (no consumer of `previewMode` yet, so behavior is unchanged). No console errors.

- [ ] **Step 7: Commit**

```powershell
git add src/context/AdContext.jsx
git commit -m "feat(ads): plumb previewMode through AdContext (cookie + role gated)"
```

---

## Task 4: Branch to placeholder in `FreestarSlot` when `previewMode`

**Files:**
- Modify: `src/components/ads/FreestarSlot.jsx`

**Why:** This is where the preview-mode behavior actually shows up on the site. When `previewMode === true`, render `<AdPlaceholder>` instead of all the existing branches (supporter null, ad-blocker UI, real Freestar slot).

- [ ] **Step 1: Update the imports**

Find:

```jsx
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useAds } from "@/context/AdContext";
import { getSlotConfig } from "@/config/ads";
```

Replace with:

```jsx
"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useAds } from "@/context/AdContext";
import { getSlotConfig } from "@/config/ads";
import { AdPlaceholder } from "./AdPlaceholder";
```

- [ ] **Step 2: Destructure `previewMode` from `useAds()`**

Find:

```jsx
  const { shouldShowAds, isPWA, isAdBlocked, disabledPlacements, pwaSuppressed } = useAds();
```

Replace with:

```jsx
  const { shouldShowAds, isPWA, isAdBlocked, disabledPlacements, pwaSuppressed, previewMode } = useAds();
```

- [ ] **Step 3: Add the preview-mode early-return BEFORE all other branches**

Find the existing early-return block:

```jsx
  if (!shouldShowAds) return null;
  if (disabledPlacements.includes(placementName)) return null;
  if (isPWA && pwaSuppressed.includes(placementName)) return null;
```

Insert this block IMMEDIATELY ABOVE it (so preview wins over every other gate):

```jsx
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

```

The block above the early-returns now reads:

```jsx
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
```

- [ ] **Step 4: Lint**

```powershell
npm run lint
```

- [ ] **Step 5: Test the preview mode manually using DevTools**

Until Task 5 ships the toggle UI, manually set the cookie to verify the flow works end-to-end:

1. Open `http://localhost:3000` in your browser
2. DevTools → Application → Cookies → `http://localhost:3000`
3. Click "Add cookie", set Name=`bbj_ad_preview`, Value=`1`, Path=`/`
4. **You must be logged in as a user with role `administrator` or `editor`** for the gate to pass. If not, log in first.
5. Hard reload the page (Ctrl+Shift+R)

Expected: Every Freestar ad slot on the page now shows a gray dashed-border card with the size + label inside.

If you don't have an admin user handy in dev: skip this step — Task 5's UI flow will exercise it properly with your real admin account.

- [ ] **Step 6: Commit**

```powershell
git add src/components/ads/FreestarSlot.jsx
git commit -m "feat(ads): render AdPlaceholder when previewMode is active"
```

---

## Task 5: Add preview-mode toggle to `/admin/ads`

**Files:**
- Modify: `src/app/admin/ads/page.jsx`

**Why:** The actual UI surface admin uses to flip preview mode on/off. Lives inside the existing "Global Ad Control" section, directly under the "Ads Enabled" master switch. Cookie-based — does NOT go through `updateAdSettings()` since it's per-browser-session, not server-stored.

- [ ] **Step 1: Update the imports at the top of `src/app/admin/ads/page.jsx`**

Find:

```jsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { getAdSettings, updateAdSettings } from "@/lib/api/ad-settings";
```

Replace with:

```jsx
"use client";

import { useEffect, useState, useCallback } from "react";
import Cookies from "js-cookie";
import { getAdSettings, updateAdSettings } from "@/lib/api/ad-settings";

const PREVIEW_COOKIE_NAME = "bbj_ad_preview";
const PREVIEW_COOKIE_DAYS = 7;
```

- [ ] **Step 2: Add preview-mode state and the cookie effect inside the `AdminAds` function**

Find:

```jsx
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
```

Replace with:

```jsx
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
```

Then find:

```jsx
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);
```

Add a new effect immediately below it:

```jsx
  useEffect(() => {
    setPreviewMode(Cookies.get(PREVIEW_COOKIE_NAME) === "1");
  }, []);
```

- [ ] **Step 3: Add the toggle handler**

Find:

```jsx
  const toggleKillSwitch = () => {
    setSettings((prev) => ({
      ...prev,
      ads_enabled: !prev.ads_enabled,
    }));
  };
```

Add directly below it:

```jsx
  const togglePreviewMode = () => {
    const next = !previewMode;
    if (next) {
      Cookies.set(PREVIEW_COOKIE_NAME, "1", {
        expires: PREVIEW_COOKIE_DAYS,
        sameSite: "Lax",
        path: "/",
      });
    } else {
      Cookies.remove(PREVIEW_COOKIE_NAME, { path: "/" });
    }
    setPreviewMode(next);
  };
```

- [ ] **Step 4: Add the toggle UI to the "Global Ad Control" section**

Find the Kill Switch section:

```jsx
      {/* Kill Switch */}
      <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white mb-2">
          Global Ad Control
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Master switch to enable or disable all ads site-wide.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleKillSwitch}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings?.ads_enabled
                ? "bg-green-500"
                : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings?.ads_enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            {settings?.ads_enabled ? "Ads Enabled" : "Ads Disabled"}
          </span>
        </div>
      </section>
```

Replace with (adds the preview toggle below the kill switch, inside the same card):

```jsx
      {/* Kill Switch + Preview Mode */}
      <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white mb-2">
          Global Ad Control
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          Master switch to enable or disable all ads site-wide.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleKillSwitch}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              settings?.ads_enabled
                ? "bg-green-500"
                : "bg-slate-300 dark:bg-slate-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings?.ads_enabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span className="text-slate-700 dark:text-slate-300 font-medium">
            {settings?.ads_enabled ? "Ads Enabled" : "Ads Disabled"}
          </span>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-base font-osw font-bold text-slate-800 dark:text-white mb-1">
            Ad Preview Mode
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
            Replaces all ads with sized placeholders so you can lay out the page without distractions.
            Only YOU see this — visitors still get real ads. Setting persists 7 days in this browser.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={togglePreviewMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                previewMode
                  ? "bg-amber-500"
                  : "bg-slate-300 dark:bg-slate-600"
              }`}
              aria-pressed={previewMode}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  previewMode ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-slate-700 dark:text-slate-300 font-medium">
              {previewMode ? "Preview Mode ON (showing placeholders)" : "Preview Mode OFF"}
            </span>
          </div>
        </div>
      </section>
```

- [ ] **Step 5: Lint**

```powershell
npm run lint
```

- [ ] **Step 6: Build**

```powershell
npm run build
```

Expected: clean build, all 46 pages generate, no errors.

- [ ] **Step 7: Manual end-to-end verification**

1. Visit `http://localhost:3000/admin/ads` (logged in as admin)
2. Find the new "Ad Preview Mode" toggle in the Global Ad Control card
3. Click it ON — toggle goes amber, label says "Preview Mode ON (showing placeholders)"
4. Open DevTools → Application → Cookies → confirm `bbj_ad_preview=1` is set
5. Navigate to `http://localhost:3000` (homepage)
6. Expected: Every ad on the page now shows a gray dashed-border card with size + label
7. Navigate to a blog post → same behavior
8. Return to `/admin/ads`, click toggle OFF — toggle goes gray, label flips
9. Confirm cookie is deleted in DevTools
10. Hard reload homepage → real ads back

- [ ] **Step 8: Commit**

```powershell
git add src/app/admin/ads/page.jsx
git commit -m "feat(admin): add Ad Preview Mode toggle on /admin/ads"
```

---

## Task 6: Final verification and notes

- [ ] **Step 1: Build pass**

```powershell
cd C:\xampp\htdocs\bbj-app
npm run build
```

Expected: clean build, no errors.

- [ ] **Step 2: Lint pass**

```powershell
npm run lint
```

- [ ] **Step 3: Confirm git log shows the expected commits**

```powershell
git log --oneline staging..feature/v2-homepage-match | head -20
```

Expected: 5 new commits at the top:
- `feat(admin): add Ad Preview Mode toggle on /admin/ads`
- `feat(ads): render AdPlaceholder when previewMode is active`
- `feat(ads): plumb previewMode through AdContext (cookie + role gated)`
- `feat(ads): add AdPlaceholder component for preview mode`
- `feat(ads): add width and label to ad slot configs`

(Plus the prior v2 homepage match commits.)

- [ ] **Step 4: Verification checklist**

Walk through these in the browser one more time:

- [ ] Toggle ON, cookie set, all `<FreestarSlot>` slots render placeholders site-wide
- [ ] Placeholder reserved height matches real ad reserved height (no layout shift between modes)
- [ ] Mobile view (DevTools responsive at 375px) — placeholders for slots that have mobile width >0 render with mobile size; slots with mobile width 0 are hidden via `hiddenOnMobile`
- [ ] Logged-out incognito window with cookie manually set → real ads serve (role gate works)
- [ ] Toggle OFF on `/admin/ads`, cookie removed, real ads return after reload
- [ ] Build is clean
- [ ] No console errors when toggling

If everything passes, the feature is done.

---

## Self-Review

**Spec coverage:**
- Cookie-based per-session preview ✅ (Task 3 + Task 5)
- Admin-only role gate ✅ (Task 3 — `PREVIEW_ADMIN_ROLES` check)
- Toggle on `/admin/ads` in Global Ad Control card ✅ (Task 5)
- Placeholder shows size + friendly label ✅ (Task 2)
- Reserved height matches real ad ✅ (Task 2 uses same `--ad-h` / `--ad-h-desktop` pattern as `FreestarSlot`)
- Width + label added to slot config ✅ (Task 1)
- Preview mode wins over supporter-hide and ad-blocker UI ✅ (Task 4 inserts the branch BEFORE all other returns)
- Cookie expires after 7 days ✅ (Task 5 sets `expires: 7`)
- No SSR / caching impact ✅ (cookie read in `useEffect`, no server-side fetch added)

**Placeholder scan:** No "TBD"/"TODO" — every step has concrete code. No "similar to Task N" — code blocks repeated where needed.

**Type/name consistency:**
- `PREVIEW_COOKIE_NAME` / `bbj_ad_preview` consistent across Tasks 3 and 5 ✅
- `previewMode` (variable name) consistent across Tasks 3 and 4 ✅
- `PREVIEW_ADMIN_ROLES` (admin role list) defined once in Task 3 ✅
- `AdPlaceholder` props (`placementName`, `config`, `hiddenOnMobile`, `className`) consistent between Task 2 (definition) and Task 4 (consumer) ✅
- `getSlotConfig` return shape (with new `width` and `label`) consistent between Task 1 (definition) and Task 2 (consumer) ✅

---

## Execution

Plan complete and saved to `docs/superpowers/plans/2026-05-09-ad-preview-mode.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task with two-stage review
2. **Inline Execution** — execute tasks here in this session

Which approach?
