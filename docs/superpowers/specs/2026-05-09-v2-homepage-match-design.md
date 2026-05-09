# V2 Homepage Match — Design Spec

**Date:** 2026-05-09
**Author:** brainstormed with Claude (superpowers:brainstorming)
**Status:** Draft — pending implementation plan

## Goal

Bring the bbj-app Next.js homepage layout into parity with the WordPress source-of-truth at `bbj/wp-content/themes/bbj-v2-theme/front-page.php`. All in one PR. Maintain the post-May-2026 webhook-driven ISR caching model.

## Context

- bbj-v2-theme is the design source of truth for both the (running) PHP site and the (separate) Next.js bbj-app
- bbj-app's current homepage diverges in: sidebar contents, houseboard placement, page H1 structure, and is missing two pieces (House Pulse, status strip)
- Caching is the gatekeeper rule (`memory/feedback_caching_first.md`) after two prior cost incidents — every change must declare its cache strategy

## Layout Diff (Current → Target)

### Above main
- Current: `<SpoilerBarWrapper>` only
- Target: `<SpoilerBarWrapper>` + new `<StatusStrip>` (page H1 + scrolling ticker)

### Main column
- Current: Hero → Ad → FeedUpdates → Ad → MoreStories
- Target: Hero (h1→h2) → **HouseStrip (moved from sidebar)** → **HousePulse (new)** → Ad → FeedUpdates → Ad → MoreStories

### Sidebar
- Current: Houseboard → SocialFollow → WatchLiveFeeds → SeasonStats → RecentComments
- Target: **ParamountPlusCard (new)** → SeasonStats (visual refresh, same data) → **NewsletterCard (new, stub)** → RecentComments → **StickyAdSlot (new)**
- Removed: Houseboard (moved to main), SocialFollow, WatchLiveFeeds

## Component Inventory

### NEW components (build)

| Component | Render | Props | Notes |
|---|---|---|---|
| `StatusStrip` | Server | `{ season: { number, full_name }, tickerItems: [{id, title, permalink}] }` | Page `<h1>` = "Big Brother N Spoilers" linking to `/category/spoilers/`. Ticker = first 3 feed-update titles, CSS marquee, doubled for seamless loop. Ticker visible at `md` breakpoint and up; hidden on small screens (h1 always renders). |
| `HouseStrip` | Server | `{ houseboard, season }` (existing data shape) | Horizontal compact strip. Renders 4 status groups (HOH/VETO/NOMS/HAVE-NOTS) as small avatar pills + names. Empty bucket = dashed circle "TBD". |
| `HousePulse` | Server | `{ housePulse: { active, buckets, total } }` | 8 vertical bars showing feed-updates/hour. Color ramp: gray (0) → amber-200/400 → red-400/600. Returns `null` when `!active`. Empty state: "Quiet house · no updates in the last 8 hours." |
| `ParamountPlusCard` | Server | none | Dark navy box with "Watch Live on Paramount+" h2, copy, "Start free trial" yellow button. URL = hardcoded constant matching existing `WatchLiveFeeds` URL (`https://paramountplus.qflm.net/c/161260/3116110/3065`); promotable to env var later. |
| (no new component — reuse `SubscribeWidget`) | Client | n/a | Existing `src/components/email/SubscribeWidget.jsx` is already wired to `/bbjd/v1/email/subscribe` (custom Resend-based system, replaced MailPoet in Feb 2026). Restyle if needed to match v2 dark-navy card; otherwise drop in as-is. |
| `StickyAdSlot` | Client | `{ slot: "homepage_sidebar_sticky" }` | Wraps `ClientAdPlaceholder` in `lg:sticky lg:top-24`. Uses existing client ad pattern. |

### UPDATED components

| Component | Change |
|---|---|
| `Hero` (`src/components/home/Hero.jsx`) | Wrap title in `<h2>` with text "Latest Update" (matches v2 hero-post.php). Post title becomes `<h3>`. **No data change.** |
| `SeasonStats` (in `HomeWidgets.jsx`) | Visual refresh to match v2 sidebar card padding/border. **Same data — full-cast stats table (H/V/N/VR/TD per player).** |

### REMOVED from homepage (deleted from repo if no other consumers)

- `Houseboard` (logic preserved in `HouseStrip` with new layout)
- `SocialFollow`
- `WatchLiveFeeds`

Pre-implementation step: grep for consumers before deleting. If unused, delete the files and exports.

## Data Flow

Single endpoint `/bbjd/v1/homepage` returns one payload, fetched once per home render via `getHomepageData()`. The combined endpoint is extended (not replaced) with two new keys:

```js
{
  // existing
  hero: { post, season },
  feedUpdates: { updates: [...15], total },
  houseboard: { season, houseboard: { hoh, pov, nominees, have_nots } },
  seasonStats: { season, players: [...] },
  recentComments: { comments: [...5], total },
  posts: { posts: [...10] },

  // NEW
  housePulse: {
    active: bool,                                                 // false off-season
    buckets: [{ hour: 14, count: 7, label: "2p" }, ...8],         // chronological
    total: 53,
  },
  currentSeason: { number: 27, full_name: "Big Brother 27" },     // status-strip H1
}
```

Status-strip ticker takes the first 3 of `feedUpdates.updates` — no extra fetch.

## Caching Strategy

Two distinct cache layers — keep them straight:

**Layer 1: Next.js / Vercel ISR (the one that controls cost).** Homepage `getHomepageData()` uses `revalidate: false` — pure webhook-driven. The page is **not** rebuilt on a timer. It rebuilds only when WP fires `/api/revalidate` with one of the homepage's cache tags. Between webhooks, Vercel serves cached HTML, zero origin hits.

**Layer 2: WP plugin transient (internal optimization, no effect on Vercel cost).** `getHomepage()` wraps its DB queries in a 60s `set_transient()`. This only matters when multiple webhook fires happen within the same 60s window — first one runs the queries, subsequent fires get the transient. Does **not** cause Next.js to refetch on a timer.

| Surface | Layer 1 (Next.js ISR) | Layer 2 (WP) | Justification |
|---|---|---|---|
| `/bbjd/v1/homepage` | `revalidate: false`, tags = 7 existing | 60s `set_transient` (existing) | No cache-contract change — adding fields keeps the same cache key on both layers |
| Homepage revalidation webhooks | Existing `hero-post`, `posts`, `feed-updates`, `houseboard`, `players`, `season-stats`, `comments` | n/a | House Pulse data freshness == feed update freshness == covered by existing `feed-update` webhook |
| Status-strip ticker | Slice of existing `feedUpdates.updates` | n/a | Free freshness from existing webhook |
| Newsletter form | Client-only, no fetch | n/a | No cache concern |
| Sticky ad | Existing `ClientAdPlaceholder` pattern | n/a | Already client-rendered |

**Hard rules check (CLAUDE.md):**
- No new `cookies()`/`headers()`/`draftMode()` calls in layout — none added
- No `force-dynamic` — none added
- No per-request server fetch beyond the existing combined `/homepage` call
- No new ISR cache tags (would risk widening invalidation cascades)
- No `revalidate` time on the homepage fetch — stays `false` (webhook-only)

## SEO / Heading Hierarchy

Current: `<h1>` lives inside `Hero.jsx` ("Latest [Season] Spoilers"). Adding `StatusStrip` would create two H1s.

Resolution (matches v2 PHP):

```
<h1> Big Brother N Spoilers          ← StatusStrip (page H1)
<h2> Latest Update                   ← Hero card kicker
  <h3> [Featured post title]         ← Hero post title
<h2> House Pulse                     ← HousePulse section heading
<h2> Latest Feed Updates             ← FeedUpdatesSection heading (existing)
<h2> More BB Stories                 ← MoreStories heading (existing)
```

Result: exactly one `<h1>` per home render, semantic hierarchy intact.

## Server vs Client Component Split

| Component | Type | Reason |
|---|---|---|
| StatusStrip, Hero, HouseStrip, HousePulse, ParamountPlusCard, SeasonStats, RecentComments | Server | Static once data lands; ticker is CSS marquee, no JS |
| NewsletterCard | Client | Form state + toast on submit |
| StickyAdSlot | Client | Wraps existing `ClientAdPlaceholder` |
| SpoilerBarWrapper | (existing — unchanged) | — |

## File Changes

### bbj-app

| File | Change |
|---|---|
| `src/app/page.jsx` | Replace component tree per layout diff; add new imports; remove SocialFollow/WatchLiveFeeds/Houseboard from sidebar |
| `src/lib/api/home.js` | Extend `DEFAULTS` and `getHomepageData()` destructure with `housePulse` + `currentSeason` |
| `src/components/home/Hero.jsx` | h1 → h2 ("Latest Update"), post title → h3 |
| `src/components/home/StatusStrip.jsx` | NEW |
| `src/components/home/HouseStrip.jsx` | NEW |
| `src/components/home/HousePulse.jsx` | NEW |
| `src/components/sidebar/ParamountPlusCard.jsx` | NEW |
| `src/components/email/SubscribeWidget.jsx` | (existing — used directly in the new sidebar tree, no new file) |
| `src/components/sidebar/StickyAdSlot.jsx` | NEW (`"use client"`) |
| `src/components/home/HomeWidgets.jsx` | Update `SeasonStats` visuals; consider deleting `SocialFollow`/`WatchLiveFeeds`/`Houseboard` if unused |
| `src/components/home/index.js` | Update exports to match deletions |
| `src/styles/globals.css` | Add `.bbj-status-strip`, `.bbj-house-strip`, `.bbj-house-pulse`, `.bbj-sidebar-card`, `.bbj-ticker`, `.bbj-ticker-track` utilities — port from `bbj-v2-theme/style.css` |

### WordPress plugin (`bigbrotherjunkies-data`)

Edits go in `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\` per CLAUDE.md.

| File | Change |
|---|---|
| `src/Api/HomeRoutes.php` | Add private `getHousePulse()` and `getCurrentSeason()` methods; extend `getHomepage()` return array |

`getHousePulse()` queries `live-feed-updates` post type via `WP_Query` with `date_query` for the last 8 hours in PT timezone, groups by hour, returns 8 chronological buckets with `{hour, count, label}`. Sets `active: false` when off-season (mirrors `bbj_v2_is_active_season()` check).

`getCurrentSeason()` reads `bbj_v2_current_season` option, looks up the season row, returns `{number, full_name}`.

No webhook trigger changes. The existing `feed-update` webhook hit invalidates the combined homepage transient, so House Pulse is fresh on every feed-update creation.

### Ad slot configuration

New slot `homepage_sidebar_sticky` (300x600 desktop, 300x250 mobile fallback) — registered manually via WP admin UI. Out of code scope for this PR.

### Static assets

- Paramount+ affiliate URL: hardcoded constant initially (`https://paramountplus.qflm.net/c/161260/3116110/3065` — same as existing WatchLiveFeeds), promotable to env var later

## Test Plan

| Check | How |
|---|---|
| WP endpoint returns new fields | `curl /wp-json/bbjd/v1/homepage` → assert `housePulse` + `currentSeason` keys present and well-shaped |
| Off-season behavior | With `bbj_v2_is_active_season() === false`, `housePulse.active === false`, HousePulse component renders null |
| Empty feed updates | StatusStrip ticker hides gracefully when `feedUpdates.updates.length < 1` |
| Empty houseboard buckets | HouseStrip shows dashed circle + "TBD" per group |
| Caching | Network tab on home render shows ONE call to `/bbjd/v1/homepage`. After `feed-update` webhook fires, next render reflects new bucket counts |
| SEO | View source: exactly one `<h1>`, the StatusStrip's. Hero is `<h2>`, post title `<h3>` |
| Mobile (< lg) | Layout collapses to single column. StickyAdSlot disengages from sticky positioning |
| Newsletter form | Submit shows "Coming soon" toast, no network request |

## Out of Scope

- Search bar in status-strip
- New ad slot creation in WP admin (manual config)
- Changes to `SpoilerBarWrapper`
- Changes to existing cache tags or webhook routes
- Refactor of unrelated homepage code

## Sidebar Restructure (added after spec review)

`src/components/layout/Sidebar.jsx` is shared across ~17 pages. User direction: modify it directly rather than create a homepage-specific variant.

**Current Sidebar wraps children with:** Welcome widget → Top FreestarSlot ad → `{children}` → SubscribeWidget → "Hot Posts" placeholder → Bottom FreestarSlot ad

**New Sidebar wraps children with:** Welcome widget (kept — auth-aware site-wide) → ParamountPlusCard → `{children}` → StickyAdSlot

**Removed from Sidebar wrapper:** Top FreestarSlot (replaced by Paramount+), SubscribeWidget call (moves into per-page children so each page controls position), Hot Posts placeholder (was a placeholder, dropped), Bottom FreestarSlot (replaced by sticky variant).

**Migration step for the 16 non-home pages:** add `<SubscribeWidget />` to their Sidebar children where they want the newsletter (most do). Mechanical change, included as a task in the plan so other pages don't lose newsletter on this PR.

**Resulting home sidebar order (matches v2 PHP):** Welcome → Paramount+ → SeasonStats → SubscribeWidget → RecentComments → StickyAdSlot. The user-welcome widget is one extra item not in the v2 PHP, kept for site-wide auth UX.

## Risks / Open Questions

| Risk | Mitigation |
|---|---|
| House Pulse query is expensive on tag-rich post types | Folded into the existing combined endpoint, so it only runs when a webhook fires (not on a timer). The 60s WP transient absorbs any burst of webhook fires within the same minute. |
| Status-strip ticker overflows on very long titles | CSS truncate / `text-overflow: ellipsis` per item |
| Sticky-ad slot empty before WP admin config done | `ClientAdPlaceholder` already handles empty `show: false` response — renders nothing |
| Removing SocialFollow loses social-following surface | Acceptable — socials live in footer; this matches v2 PHP |

## Acceptance

Layout matches `bbj/wp-content/themes/bbj-v2-theme/front-page.php` rendered output (per provided screenshot of bbj.localhost), preserving:
- Existing webhook-driven ISR (zero new cache tags, no new server fetches per render)
- Full-cast SeasonStats data table
- One round trip per home render
- One H1 per page
