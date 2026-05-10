# Ad Preview Mode — Design Spec

**Date:** 2026-05-09
**Author:** brainstormed with Claude (superpowers:brainstorming)
**Status:** Draft — pending implementation plan

## Goal

Give the admin a way to replace every Freestar ad on the site with a sized placeholder card while they design and program ad slot positions. Only the admin's own browser session sees placeholders — regular visitors still get real ads, so there is zero revenue interruption.

## Why

The user is iterating on the homepage layout (and other pages) and finds real ads visually distracting and click-risky. They want to see exactly where each ad slot lands, what size it is, and what role it plays — without paying for impressions or risking click-fraud while previewing. The existing "Ads Enabled" master switch returns `null` for `<FreestarSlot>`, leaving blank gaps with no visual indication of slot placement. That's the wrong tool for this job.

## Decisions Locked In

| Decision | Choice | Why |
|---|---|---|
| Scope | Admin-only (per-session) | Preserves ad revenue for visitors during preview |
| State storage | Cookie | Simple, persists across tabs/navigation, no server roundtrip |
| Placeholder content | Size + friendly label | Matches v2 PHP placeholder pattern |
| Toggle location | `/admin/ads` page, under "Global Ad Control" | Same card as existing "Ads Enabled" switch |

## UX Flow

1. Admin visits `/admin/ads`
2. Under the existing **"Ads Enabled"** master switch, a new toggle appears: **"Ad Preview Mode"** with help text: *"Replaces all ads with sized placeholders so you can lay out the page without distractions. Only YOU see this — visitors still get real ads."*
3. Toggle ON → sets cookie `bbj_ad_preview=1` (path `/`, 7-day expiry)
4. Toggle OFF → deletes the cookie
5. While ON, every `<FreestarSlot>` on the site renders an `<AdPlaceholder>` (gray card with size + label) instead of the real Freestar component
6. Reloading any page on the site shows the placeholders. No site-wide flag — this is purely a per-browser experience for the admin

## Component Architecture

### Files Modified or Created

| File | Change |
|---|---|
| `src/config/ads.js` | Add `width` and `label` fields to each entry in the `adSlots` map. Both `desktop` and `mobile` get `width` (height already present). `label` is a friendly string per slot (e.g., `"Leaderboard ATF"`). |
| `src/components/ads/AdPlaceholder.jsx` | NEW — `"use client"` component. Renders a gray card matching the real ad's reserved dimensions so layout doesn't shift. Shows `WIDTH × HEIGHT` (large, bold) + `LABEL` (small, uppercase). Props: `{ placementName, config, hiddenOnMobile }`. |
| `src/context/AdContext.jsx` | Add `previewMode` to the context value. Read cookie `bbj_ad_preview` on client mount in a `useEffect`. Set `previewMode = true` only if cookie present AND `user.user_roles` includes any role from the `adminRoles` prop (default: `["administrator", "editor"]`). |
| `src/components/ads/FreestarSlot.jsx` | New early branch BEFORE the `!shouldShowAds` return: `if (previewMode) return <AdPlaceholder placementName={placementName} config={config} hiddenOnMobile={hiddenOnMobile} />`. Preview wins over supporter-hide AND ad-blocker detection. |
| `src/app/admin/ads/page.jsx` | New "Ad Preview Mode" toggle component within the existing "Global Ad Control" section. Cookie read/write via `js-cookie` (already in `package.json`). |

### Component Boundaries

- **`AdPlaceholder`** — purely presentational, no context access. Receives everything via props from `FreestarSlot`. Easy to unit-test.
- **`FreestarSlot`** — orchestration. Reads `useAds()`, decides between placeholder, real ad, ad-blocker UI, or null.
- **`AdContext`** — single source of truth for preview state. `previewMode` is a derived boolean (cookie + role).
- **Admin toggle** — local component on the admin page. Cookie set/delete + UI state.

## Data Flow

```
[Admin on /admin/ads clicks "Ad Preview Mode" toggle]
        ↓
[Cookie 'bbj_ad_preview' set or deleted via js-cookie]
        ↓
[On any subsequent page render]
        ↓
[AdContext useEffect reads Cookies.get('bbj_ad_preview')]
        ↓
[Cross-checks against user.user_roles via useAuth()]
        ↓
[previewMode = (cookie === '1' && hasAdminRole)]
        ↓
[FreestarSlot reads previewMode from useAds()]
        ↓
[Renders <AdPlaceholder> with size/label from getSlotConfig()]
```

No server-side flow. No SSR concerns. Cookie + client-side hydration only — does not affect ISR caching.

## State Storage

**Cookie name:** `bbj_ad_preview`
**Value:** `1` (presence is the signal; absence = off)
**Path:** `/`
**Expiry:** 7 days
**SameSite:** `Lax`
**Secure:** `true` in production (matches existing patterns)

The role check in `AdContext` makes the cookie a no-op for any non-admin user who happens to have it.

## Slot Config Additions

Each entry in `adSlots` (`src/config/ads.js`) gains:

```js
bigbrotherjunkies_leaderboard_atf: {
  desktop: { width: 728, height: 90 },
  mobile:  { width: 320, height: 100 },
  label: "Leaderboard ATF",
},
```

The `getSlotConfig()` helper returns the full object including `label`. Default fallback when an unknown placement is queried gets `label: "Unknown Slot"` and `width: 300, height: 250` (medium rectangle defaults).

Placement label list (10 slots):

| Placement | Label |
|---|---|
| `bigbrotherjunkies_leaderboard_atf` | Leaderboard ATF |
| `bigbrotherjunkies_incontent_reusable` | In-Content Reusable |
| `bigbrotherjunkies_incontent_reusable_Homepage2` | In-Content (Homepage 2) |
| `bigbrotherjunkies_middle_feed` | Middle Feed |
| `bigbrotherjunkies_middle_post` | Middle Post |
| `bigbrotherjunkies_siderail_right_1` | Siderail Right 1 |
| `bigbrotherjunkies_siderail_right_2` | Siderail Right 2 |
| `bigbrotherjunkies_sticky_siderail_right` | Sticky Siderail |

## AdPlaceholder Visual

```
┌─────────────────────────────────┐
│                                 │
│         728 × 90                │  ← font-display, text-3xl, primary-500
│                                 │
│      Leaderboard ATF            │  ← font-osw, uppercase, tracking-wider, text-xs, slate-500
│                                 │
└─────────────────────────────────┘
```

Background: `bg-slate-100 dark:bg-slate-800/50`
Border: `border border-dashed border-slate-300 dark:border-slate-600`
Reserved height: matches the real ad's `desktop.height` / `mobile.height` so layout doesn't shift between preview-on and preview-off states.

## Edge Cases

| Case | Behavior |
|---|---|
| Non-admin user with cookie present | Role check fails → `previewMode = false` → real ads serve |
| Logged-out user with cookie present | No `user.user_roles` → role check fails → real ads serve |
| Admin user, cookie absent | `previewMode = false` → real ads serve |
| Admin + cookie + supporter (admins-who-are-supporters): | `previewMode = true` beats supporter ad-hide. Admin sees placeholders. |
| Admin + cookie + ad-blocker detected | `previewMode = true` beats ad-blocker UI. Admin sees placeholders. |
| Auto-managed placements (sticky footer, interstitial) | Out of scope — these come directly from Freestar SDK, not through `<FreestarSlot>`. They will still serve real ads even in preview mode. Documented as a known limitation. |
| SSR / first paint flicker | Cookie read happens in `useEffect` (client only). SSR renders the real Freestar slot mount; hydration swaps to placeholder. Acceptable flicker for an admin tool. |

## Caching / Performance

No caching impact:
- No new server fetches
- No `cookies()` / `headers()` call in any route or layout
- No `force-dynamic` opt-in
- ISR cache contracts unchanged

The only client-side cost is one extra `useEffect` in `AdContext` on mount to read the cookie. Trivial.

## Out of Scope

- Auto-managed placements (sticky footer, interstitial, video slider) — these don't go through `<FreestarSlot>` so preview mode can't intercept them
- Site-wide preview mode (admin chose admin-only)
- Per-placement preview (toggling individual slots) — covered by the existing per-placement disable toggles already on `/admin/ads`
- Adding `width` to ALL placements not in our manual `adSlots` map (e.g., the auto-managed ones) — only manual placements need width since only they render through FreestarSlot

## Test Plan

| Check | How |
|---|---|
| Cookie sets on toggle ON | DevTools → Application → Cookies — `bbj_ad_preview=1` present |
| Cookie clears on toggle OFF | Cookie removed |
| Admin sees placeholders when preview is on | Open homepage with cookie set → all `<FreestarSlot>` render `<AdPlaceholder>` |
| Non-admin doesn't see placeholders even with cookie | Manually set the cookie in a logged-out incognito window → real Freestar slots render |
| Toggle persists across navigation | Toggle on, navigate around the site, placeholders remain |
| Toggle persists across reloads | Toggle on, hard reload, placeholders remain |
| Layout doesn't shift between preview/real | Compare screenshots — placeholder height equals real ad reserved height |
| Mobile/desktop sizing | Inspect placeholder at < md and ≥ md breakpoints — both render correct W×H |

## Acceptance

Admin can flip a switch on `/admin/ads` and see every ad on the site replaced with a labeled, sized placeholder. Cookie persists for 7 days. Non-admin users always see real ads. No caching regressions, no SSR concerns, no impact on Vercel cost.
