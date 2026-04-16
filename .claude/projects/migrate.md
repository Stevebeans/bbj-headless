# BBJ Migration: WordPress → Vercel DNS Flip

## Pre-Flight Checklist

| #   | Item                                          | Status     | Notes                                                                                                                                                       |
| --- | --------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Swap `public/ads.txt`                         | ✅ Done    | 7-line stub → full 100-line Freestar content. AdSense pub lines included.                                                                                   |
| 2   | Build `src/app/sitemap.js`                    | ✅ Done    | Option A (native Next.js). Queries WP API for posts, players, seasons, feed updates. 1hr ISR.                                                               |
| 3   | Rename `/feed-updates` → `/live-feed-updates` | ✅ Done    | 11 files, 15 references updated. API endpoints untouched. Fixes ~3,000 404s.                                                                                |
| 4   | Build `/category/[slug]` route                | ✅ Done    | ISR, PostCard grid, SEO metadata, Sidebar layout.                                                                                                           |
| 5   | URL coverage audit                            | ✅ Done    | 5,452 URLs tested. See results below.                                                                                                                       |
| 6   | Build `/tag/[slug]` route                     | ❌ Pending | 23 tag archive URLs currently 404. Decision needed: build route, redirect to home, or ignore.                                                               |
| 7   | Add redirects for index pages                 | ❌ Pending | `/bigbrother-players` → `/directory`, `/bigbrother-seasons` → `/directory`, `/live-feed-archives` → `/live-feed-updates`                                    |
| 8   | Nested category routes                        | ❌ Pending | URLs like `/category/big-brother-20/feed-updates-big-brother-20` — current route handles `/category/[slug]` but not nested. May need catch-all `[...slug]`. |
| 9   | Verify placeholder pages are real             | ❌ Pending | `/contact`, `/privacy-policy` — confirm these have real content, not stubs.                                                                                 |
| 10  | Rollback plan documented                      | ❌ Pending | DNS TTL, who flips back, abort trigger.                                                                                                                     |
| 11  | Set Vercel Spend Management caps              | ❌ Pending | User should set alerts at $75/$150/$300, hard cap at $600. Path: vercel.com → Settings → Billing → Spend Management.                                        |

---

## URL Coverage Audit Results (2026-04-15)

### Methodology

- Fetched all child sitemaps from `bigbrotherjunkies.com/sitemap.xml` (All in One SEO Pro)
- Skipped: `post-sitemap3.xml` (2016), `post-sitemap4.xml` (2012), all `attachment-sitemap*.xml` (20 files), MemberPress, MailPoet
- Included: recent posts, pages, players, seasons, 3 most recent feed-update sitemaps, categories, tags, archives
- Filtered individual URLs by lastmod >= 2017-01-01
- Tested 5,452 URLs against `staging.bigbrotherjunkies.com` via HEAD requests

### Results Summary

| Status        | Count | Resolution                                                                                                           |
| ------------- | ----- | -------------------------------------------------------------------------------------------------------------------- |
| 200 OK        | 615   | Working                                                                                                              |
| 404 Not Found | 3,069 | See breakdown below                                                                                                  |
| 504 Timeout   | 1,768 | Retested at concurrency=3: 1,713 became 200. Only 55 still timeout (BB21 heavy pages, will cache on first real hit). |

### 404 Breakdown

| Category                             | Count  | Fix                                                      |
| ------------------------------------ | ------ | -------------------------------------------------------- |
| `/live-feed-updates/*` path mismatch | ~3,000 | ✅ FIXED — renamed Next.js route to `/live-feed-updates` |
| `/category/*` archive pages          | 37     | ✅ FIXED — built `/category/[slug]/page.jsx` route       |
| `/tag/*` archive pages               | 23     | ❌ PENDING — no route exists. See list below.            |
| Individual posts/pages               | 9      | ❌ PENDING — see list below.                             |

### Tag Archive URLs (23 — no route exists)

Decision needed: **build `/tag/[slug]` route** (same pattern as category), **redirect all `/tag/*` → homepage**, or **ignore/noindex**.

```
/tag/big-brother-14-2
/tag/big-brother-16-2
/tag/big-brother-18
/tag/big-brother-15
/tag/bb19
/tag/power-rankings
/tag/james-huling
/tag/big-brother-17
/tag/sept-11th
/tag/big-brother-19
/tag/big-brother-19-spoilers
/tag/dr-will
/tag/michelle-meech
/tag/house-tour
/tag/bigbrother19
/tag/celebrity-big-brother
/tag/cbbus
/tag/bb20
/tag/big-brother-20
/tag/shannon-elizabeth
/tag/big-brother-all-stars
/tag/tyler
/tag/cody
```

### Individual Missing Posts/Pages (9)

| URL                                          | Assessment                                | Suggested Action                    |
| -------------------------------------------- | ----------------------------------------- | ----------------------------------- |
| `/rylie-and-zach-squaring-off`               | Old post — likely deleted or slug changed | Let 404 or check WP                 |
| `/take-part-in-beta-testing-bbj-2-0`         | Old announcement                          | Let 404                             |
| `/big-brother-22-saturday-recap-for-9-12-20` | Real post — may have slug mismatch        | Check WP for actual slug            |
| `/big-brother-21-friday-update`              | Real post — same                          | Check WP for actual slug            |
| `/bigbrother-players/jennifer-vasquez`       | Player not in DB or slug mismatch         | Check WP player data                |
| `/bigbrother-players`                        | Index page (no listing at this URL)       | **Redirect → `/directory`**         |
| `/live-feed-archives`                        | WP-only page, no Next.js equivalent       | **Redirect → `/live-feed-updates`** |
| `/live-feed-updates`                         | Base URL for feed updates                 | Should work now after rename ✅     |
| `/bigbrother-seasons`                        | Index page (no listing at this URL)       | **Redirect → `/directory`**         |

### Nested Category URLs (may still 404)

Current route handles `/category/[slug]` but some WP categories are nested:

```
/category/big-brother-19/player-poll-big-brother-19
/category/big-brother-20/feed-updates-big-brother-20
/category/big-brother-20/top-tweets
/category/big-brother-20/cast-list
/category/big-brother-22/video-clips
/category/big-brother-23/power-rankings-big-brother-23
/category/big-brother-25/live-feed-updates-big-brother-25
/category/big-brother-26/live-feed-updates-big-brother-26
/category/big-brother-27/awards
```

**Fix**: Convert `src/app/category/[slug]/page.jsx` to `src/app/category/[...slug]/page.jsx` (catch-all) and use the last segment as the actual category slug.

### 55 Still-Timeout URLs (BB21 era, 2019)

These are legitimately heavy pages that take >30s for cold ISR generation. They will work once hit by a real user and cached. Not a blocker for DNS flip. All are BB21 posts like:

- `/big-brother-21-friday-night-plus-nominations`
- `/big-brother-21-saturday-evening-feeds`
- `/big-brother-21-friday-afternoon-feeds-3`
- etc.

---

## Vercel Cost Fixes (completed 2026-04-13)

| Fix                                             | Status                  | Impact                                                                                |
| ----------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------- |
| Disallow `/compare/` in robots.js               | ✅ Deployed             | Stopped bot spider trap. Invocations dropped 66%, Edge Middleware dropped 99.9%.      |
| Add `noindex/nofollow` to compare page metadata | ✅ Deployed             | Prevents future Google indexing of compare URLs.                                      |
| Enable Fluid Compute                            | ✅ Toggled in dashboard | Legacy Function Duration frozen at $14.24. New usage flows to Fluid Active CPU (~$0). |
| Set Spend Management caps                       | ❌ Pending              | User should set alerts at $75/$150/$300, hard cap at $600.                            |

---

## Ad System Status

| Item                                                 | Status                   | Notes                                                                                                                                          |
| ---------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `public/ads.txt` deployed                            | ✅ Done                  | Full 100-line Freestar content with AdSense publisher lines                                                                                    |
| AdSense backfill setup                               | ✅ Done (user confirmed) | Ad units created, tags sent to Freestar                                                                                                        |
| Kill `google_interstitial`                           | ❌ Pending               | User needs to email Freestar AM. ~$1,700/yr (~11% revenue) tradeoff accepted.                                                                  |
| Wire `bigbrotherjunkies_leaderboard_atf` into header | ❌ Pending               | Al Jazeera style: above `<Header />` in layout.jsx, light gray bg, "Advertisement" label, hidden for supporters. Freestar slot already exists. |

---

## TRJ (therealityjunkies.com) — Future Project

**Timeline**: Casual build now → soft launch end of BB28 (~Sept 2026) → build content winter → hard launch post-BB29 with paid ads.

**Architecture decided**:

- Fork BBJ Next.js repo (not multi-tenant)
- Same WordPress backend (shared user table, shared premium via roles)
- Reusable components: comment system, auth, ads, search, post templates, admin dashboard
- Remove BB-specific: spoiler bar, HouseBoard, player directory (keep lightweight BB section for cross-promo)
- Skip SSO initially — users log in per domain, premium carries via WP role

**First show to cover**: Love Island USA (summer, overlaps BB, similar content pattern)

---

## Quick Reference: What's Left Before DNS Flip

### Must-Do

1. Build `/tag/[slug]` route OR add redirect in `next.config.js`
2. Add 3 redirects: `/bigbrother-players` → `/directory`, `/bigbrother-seasons` → `/directory`, `/live-feed-archives` → `/live-feed-updates`
3. Fix nested category routes (catch-all `[...slug]`)
4. Verify `/contact` and `/privacy-policy` have real content
5. Set Vercel Spend Management caps
6. Document rollback plan (DNS TTL, abort trigger)

### Nice-to-Have Before Flip

7. Wire up `leaderboard_atf` ad in header
8. Freestar confirms interstitial disabled
9. Review 4 truly missing post slugs against WP
10. Test with a real browser session (login, comment, navigate, check ads render)
