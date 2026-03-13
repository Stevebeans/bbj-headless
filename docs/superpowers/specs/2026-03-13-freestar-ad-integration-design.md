# Freestar Ad Integration Design

**Date:** 2026-03-13
**Status:** Approved
**Approach:** Direct SDK Integration (custom components, no Freestar React package)

## Overview

Replace the current WordPress-API-driven ad system with Freestar's native SDK integration. Freestar is already running on the WordPress PHP site with 13 active placements. This design migrates those placements to the Next.js headless frontend on the same domain.

### Goals
- Integrate all 13 Freestar placements into Next.js
- Add AdSense as backfill for ~31% unfilled inventory (configured in dashboards, no code)
- Show house ads (React components) to ad-blocker users
- PWA-aware ad handling
- Admin UI at `/admin/ads` for settings management
- Keep WordPress ad manager as legacy fallback, not used day-to-day

## Architecture

### SDK Loading (layout.jsx)

Freestar's head code loaded directly in `<head>`:
- Preconnect links to `a/b/c/d.pub.network`
- `pubfig.min.js` + `pubfig.engine.js` from `a.pub.network/bigbrotherjunkies-com/`
- **Only loaded for non-supporters** (same check as today)
- **Kill switch respected** — if ads globally disabled via admin, SDK never loads
- `getAdScripts()` stays but only `global_header`/`global_footer` fields are used (for GA4, analytics)
- `ad_header`/`ad_footer` fields are deprecated — replaced by hardcoded Freestar SDK scripts

### AdContext Provider

**File:** `src/context/AdContext.jsx`

Exposes ad visibility state to all client components:
- `shouldShowAds` — boolean (false for supporters, false if kill switch is off)
- `isPWA` — boolean (standalone/window-controls-overlay mode or iOS Safari PWA)
- `isAdBlocked` — boolean (detected via `window.freestar` existence check after timeout)
- `houseAd` — which house ad component to show for ad-blocker users
- `disabledPlacements` — set of placement names disabled via admin

Populated server-side in layout.jsx from the existing `isSupporter` check, passed through `<Providers>`. PWA and ad-blocker detection happen client-side on mount.

### Core Component: `<FreestarSlot>`

**File:** `src/components/ads/FreestarSlot.jsx` (client component)

Replaces both `AdPlaceholder` (server) and `ClientAdPlaceholder` (client).

**Behavior:**
1. Reads `shouldShowAds`, `isPWA`, `isAdBlocked`, `disabledPlacements` from AdContext
2. Returns `null` if: supporter, kill switch off, or placement disabled
3. Returns `null` if PWA mode and placement is in PWA suppression list
4. Renders div with `id={placementName}` and `data-freestar-ad` attribute
5. On mount: `freestar.config.enabled_slots.push({ placementName, slotId })`
6. On unmount: `freestar.deleteAdSlots({ placementName, slotId })` to properly destroy GPT slots
7. Reserves height for CLS prevention using `adConfig.slots` sizes
8. Wraps in "Advertisement" / "Go Ad-Free" branding
9. If `isAdBlocked`, renders the selected house ad component instead of the Freestar div

**Slot Lifecycle (Freestar JS API):**
- **Create:** `freestar.config.enabled_slots.push({ placementName, slotId })` — registers slot for filling
- **Refresh:** `freestar.newAdSlots([{ placementName, slotId }])` — request new ad fill (e.g., after SPA navigation)
- **Destroy:** `freestar.deleteAdSlots([{ placementName, slotId }])` — properly destroys GPT slot, prevents "slot already defined" errors and memory leaks
- Confirm exact API methods during staging QA with Freestar

**SDK Load Timeout:**
- After 5 seconds, if `window.freestar` is undefined, mark `isAdBlocked: true` in AdContext
- This catches CDN outages and ad blockers, falling back to house ads

**Fallback priority:**
1. Freestar fills (~69%)
2. AdSense backfill (configured in Freestar/GAM dashboards, no code)
3. Ad blocker or SDK failure detected → show house ad (React component)
4. Supporter/premium user → component returns `null`

**Props:**
- `placementName` (required) — Freestar placement name
- `className` — additional styles
- `showBranding` — show/hide branding wrapper (default: true)

**PWA detection:**
```javascript
const isPWA = window.matchMedia('(display-mode: standalone)').matches
  || window.matchMedia('(display-mode: window-controls-overlay)').matches
  || window.navigator.standalone === true; // iOS Safari
```

Suppresses `sticky_footer` and `google_interstitial` in PWA mode by default (configurable via admin).

## Placement Mapping

### Manual Placements (we render `<FreestarSlot>`)

| Freestar Placement | Size (desktop) | Size (mobile) | CLS Height (d/m) | Location | Page |
|---|---|---|---|---|---|
| `bigbrotherjunkies_leaderboard_atf` | 728x90 | 320x100 | 90px / 100px | Above the fold, top of content | All pages |
| `bigbrotherjunkies_incontent_reusable` | 336x280 | 300x250 | 280px / 250px | Between posts section | Homepage |
| `bigbrotherjunkies_incontent_reusable_Homepage2` | 336x280 | 300x250 | 280px / 250px | Below feed updates section | Homepage |
| `bigbrotherjunkies_middle_feed` | 336x280 | 300x250 | 280px / 250px | Between feed update items | Homepage / Feed Updates |
| `bigbrotherjunkies_middle_post` | 336x280 | 300x250 | 280px / 250px | Mid-article banner | Single posts |
| `bigbrotherjunkies_siderail_right_1` | 300x250 | hidden | 250px / 0 | Sidebar top | All pages with sidebar |
| `bigbrotherjunkies_siderail_right_2` | 300x250 | hidden | 250px / 0 | Sidebar bottom | All pages with sidebar |

Note: Freestar may serve responsive/variable sizes. These CLS heights are based on the primary creative sizes from the existing WordPress integration. Adjust during staging QA if needed.

### Auto-Managed (Freestar SDK injects — zero code)

| Freestar Placement | Behavior |
|---|---|
| `bigbrotherjunkies_articles_dynamic_incontent` | Auto-inserts between article paragraphs |
| `bigbrotherjunkies_comments_dynamic_incontent` | Auto-inserts between comments |
| `bigbrotherjunkies_sticky_footer` | Sticky bar at bottom of viewport |
| `bigbrotherjunkies_sticky_pushdown` | Pushdown unit at top |
| `bigbrotherjunkies_google_interstitial` | Full-page interstitial |
| `FreeStarVideoAdContainer_Slider` | Floating video player |

## ContentWithAds Simplification

The current `ContentWithAds.jsx` splits HTML into paragraphs and manually inserts ad divs. Since Freestar's `bigbrotherjunkies_articles_dynamic_incontent` (Element Ad Insert) auto-scans the DOM and inserts ads between content elements, the manual splitting becomes redundant.

**Plan:** Simplify `ContentWithAds` to just render HTML content directly. Keep the component wrapper (for className, etc.) but remove the paragraph-splitting and ad-insertion logic. Remove `getInContentPlacements()` from `ads.js` as dead code.

**Caveat:** This depends on confirming Freestar's auto-insertion works with the Next.js HTML structure during staging QA. If their CSS selectors don't match our markup, Freestar will need to adjust on their end (quick change). If auto-insertion doesn't work for some pages, we can add a manual `bigbrotherjunkies_middle_post` FreestarSlot as a fallback.

## House Ads (Ad-Blocker Fallback)

React components stored in codebase, not in a database:

```
src/components/ads/house-ads/
  PremiumCTA.jsx        — "Go Ad-Free" promo
  NewsletterSignup.jsx  — Email subscribe CTA
```

- Built locally with full Tailwind/React, version-controlled
- Admin dropdown selects which house ad shows to ad-blocker users
- No rich text editor needed
- Add more creatives later by adding new components and registering them

## Admin Page (`/admin/ads`)

Settings stored in WordPress via API (`/bbjd/v1/ad-settings`), UI in Next.js admin:

| Setting | UI Control |
|---|---|
| Kill switch | Toggle (on/off all ads) |
| Per-placement enable/disable | Toggle per Freestar slot |
| House ad selection | Dropdown (which component for ad-blocker users) |
| Supporter roles | Checkboxes (which roles are ad-free) |
| PWA suppressions | Checkboxes (which placements to hide in app mode) |

Settings endpoint: `revalidate: 60` (or `no-store` for admin-only fetches).

## ads.txt

`ads.txt` must be served at `bigbrotherjunkies.com/ads.txt`. Since Next.js on Vercel is the frontend:
- Place a static `ads.txt` in `public/ads.txt` with Freestar's required lines
- Or create a Next.js API route (`/api/ads-txt`) that proxies Freestar's dynamic ads.txt
- Freestar may manage this dynamically — confirm with them which approach they prefer
- **Critical:** Missing/incorrect ads.txt will block demand partners and kill revenue

## Files Changed

### New Files
- `src/components/ads/FreestarSlot.jsx` — core ad component
- `src/context/AdContext.jsx` — ad visibility state provider
- `src/components/ads/house-ads/PremiumCTA.jsx` — house ad
- `src/components/ads/house-ads/NewsletterSignup.jsx` — house ad
- `src/app/admin/ads/page.jsx` — admin settings page (replaces placeholder)
- `src/lib/api/ad-settings.js` — admin API client for ad settings

### Modified Files
- `src/app/layout.jsx` — replace ad script injection with Freestar SDK, add AdContext to Providers
- `src/components/Providers.jsx` — wrap with AdContext provider
- `src/config/ads.js` — update slot keys to Freestar placement names with CLS heights, remove `inContent` array and `getInContentPlacements()`
- `src/app/page.jsx` — replace `<AdPlaceholder>` with `<FreestarSlot>`
- `src/app/[slug]/page.jsx` — replace ad components in single post pages
- `src/app/bigbrother-players/[slug]/page.jsx` — replace `<AdPlaceholder>` with `<FreestarSlot>`
- `src/components/layout/Sidebar.jsx` — replace `<ClientAdPlaceholder>` with `<FreestarSlot>`
- `src/components/posts/ContentWithAds.jsx` — simplify to just render HTML (remove paragraph splitting)
- `src/app/directory/components/PlayerDirectory.jsx` — replace ad components

### Retired (kept but unused)
- `src/components/ads/AdPlaceholder.jsx` — replaced by FreestarSlot
- `src/components/ads/ClientAdPlaceholder.jsx` — replaced by FreestarSlot
- `src/lib/api/ads.js` — `getSlotAd()` no longer needed; `getAdScripts()` stays for analytics only (`ad_header`/`ad_footer` fields deprecated)

### WordPress Plugin
- New API endpoint for ad settings CRUD (`/bbjd/v1/ad-settings`)
- Existing ad admin pages kept as legacy fallback

## AdSense Backfill

Configured entirely in dashboards — no code changes:
1. Ensure AdSense account shows bigbrotherjunkies.com as "Ready"
2. Create AdSense ad units for each size
3. Add AdSense ID in Freestar Dashboard for dynamic ads.txt
4. Revenue reported in AdSense dashboard, paid by Google directly

## Follow-up Items (post-V1)

- **GDPR/CMP:** Freestar provides CMP integration for consent management. Add when needed for EU traffic.
- **Analytics:** Cross-reference Freestar dashboard data with GA4 ad impression events if desired.

## Freestar Communication

Before go-live:
1. Email Freestar: migrating to headless Next.js, same domain, same placements
2. Confirm `articles_dynamic_incontent` CSS selectors work with Next.js HTML
3. Confirm exact JS API for slot destroy (`freestar.deleteAdSlots`)
4. Confirm ads.txt serving strategy
5. Deploy to staging
6. Freestar QAs staging
7. Coordinate production launch
