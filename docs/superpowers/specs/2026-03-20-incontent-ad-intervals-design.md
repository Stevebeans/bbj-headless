# In-Content Ad Intervals — Design Spec

## Summary

Update `ContentWithAds` to insert multiple in-content ads at configurable paragraph intervals instead of one at the midpoint. Interval defaults to every 5 paragraphs, configurable via admin Ads settings page.

## Current Behavior

- `ContentWithAds.jsx` finds the midpoint of the HTML content and inserts a single `bigbrotherjunkies_middle_post` FreestarSlot
- Long articles get only 1 in-content ad regardless of length

## New Behavior

- Split article HTML at `</p>` tag boundaries into an array of paragraphs
- Insert a `FreestarSlot` using `bigbrotherjunkies_incontent_reusable` placement every N paragraphs
- N defaults to 5, configurable via admin settings
- Each slot gets a unique `slotId` suffix starting at 1 (`incontent-1`, `incontent-2`, etc.) — counter increments per ad inserted, not per paragraph

### Rules

- First ad never appears before paragraph 3 (even if interval is set lower)
- Maximum 5 ads per article regardless of length
- Articles shorter than 1500 characters get no in-content ads (existing behavior preserved)
- `bigbrotherjunkies_middle_post` is no longer used in ContentWithAds but remains in the ad config/admin for other potential uses

## Architecture Note

`ContentWithAds` is a **Server Component** (no `"use client"` directive) and MUST remain one. It cannot use hooks or context. The `adInterval` value is passed as a prop from the page, which fetches it server-side.

## Files to Change

### 1. `src/components/posts/ContentWithAds.jsx`

- Accept `adInterval` prop (default: 5)
- Split content into paragraphs by `</p>` boundaries
- Insert `FreestarSlot` with `placementName="bigbrotherjunkies_incontent_reusable"` and `slotId={`incontent-${adCount}`}` at every `adInterval` paragraphs
- Enforce minimum position (paragraph 3) and max count (5)
- Remains a Server Component — no hooks, no context

### 2. `src/app/[slug]/page.jsx`

- Fetch ad settings server-side (page is already `force-dynamic`)
- Extract `incontent_interval` from settings (default 5)
- Pass as `adInterval` prop to `ContentWithAds`

### 3. `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\AdSettingsRoutes.php`

- Add `incontent_interval` to the `DEFAULTS` array (default: 5)
- Add to `updateSettings()` with server-side clamping: `max(2, min(10, absint(...)))`

### 4. `src/app/admin/ads/page.jsx`

- Add a number input for "In-Content Ad Interval" (paragraphs between ads)
- Range: 2-10, default 5
- Brief helper text: "Insert an ad every X paragraphs in blog posts"

## Non-Goals

- No changes to sidebar, homepage, or feed update ads
- No changes to Freestar SDK auto-managed placements
- No new ad placements created in Freestar dashboard (reuses existing `incontent_reusable`)
- No changes to AdContext or Providers (not needed — prop-passing from server page)
