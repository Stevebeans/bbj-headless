# Vercel Cost Optimization Notes — May 2026

**Companion file to:** `cost-notes-april-2026.md` (post-DNS-flip cost stabilization)

**Context:** April 2026 stabilized Vercel post-DNS-flip at ~$1.65/day with Cloudflare proxy and Analytics removal. May 2026 was four rounds of progressive ISR optimization to drive that down further. This file captures the May arc start-to-finish.

---

## TL;DR

- **April 30 baseline:** $1.65/day infrastructure (~$50/mo, $30 over Pro credit)
- **May 8 post-Round-4:** ~$0.10-0.15/day organic infra (~$3-5/mo, well inside $20 Pro credit → **$20 flat bill**)
- **Total reduction:** ~90-93% over 8 days across four rounds
- **BB28 peak projection:** ~$80-150/mo total (vs $700-1200 feared in April; competitive with Cloudways' historical $243/mo peak)

---

## The four rounds

### Round 1 (2026-05-01): wpFetch default revalidate

**Trigger:** Vercel billing showed 2.21M ISR Writes ($8.82) over 11 days at 120 DAU off-season. Math impossible — 200K writes/day on 120 DAU = bots.

**Root cause:** `wpFetch()` default was `revalidate: 60`. Spoiler bar fetch was in the layout. Layout fetches floor route segments to their lowest revalidate. Result: every page in the app had effective 60s rebuild floor.

**Fix:**
- `wordpress.js` default: `60` → `false`
- All dynamic page routes: `revalidate = false`
- Explicit `revalidate: false` on webhook-covered fetches
- `/index` 301 redirect to `/`
- Build floor on static pages: 1m → 5m (still capped by `getAdScripts()` at 300s — flagged as deferred)

**Result:** $1.65/day → ~$1.50/day (transition)

### Round 2 (2026-05-02 morning): granular cache tags

**Trigger:** 9h post-Round-1, write reduction was -50% not the projected -90%. Three routes barely moved or got worse:
- /[slug] (posts): -11%
- /live-feed-updates/[slug]: +76%
- /compare/[matchup]: +20%

**Root cause:** Single-item fetches had both broad and granular tags (e.g., `["posts", \`post-${slug}\`]`). Webhook firing `revalidateTag("posts")` invalidated EVERY post page → bots crawling cold pages = cascading rebuilds.

**Fix:**
- Single-item fetches: drop broad tag, keep only granular (`\`post-${slug}\``, `\`player-${slug}\``, etc.)
- Webhook handler: fire BOTH broad (for lists) + granular (for the specific item)
- Architectural rule: never put a broad tag on a single-item fetch

**Result:** $1.50/day → ~$0.55/day projected

### Round 3 (2026-05-02 afternoon): kill the spoiler-bar layout cascade

**Trigger:** /bigbrother-players/[slug] still 8.2 writes/unique-path despite 96.1% Vercel edge cache hit rate. Math: 285 cold misses × 5 fetches/render = 1.4K max but observed 2.3K. Extra 900 = stale-while-revalidate background regenerations.

**Root cause:** `getCurrentSeasonPlayers` and `getSpoilerBar` both tagged with broad `"players"` tag. Spoiler bar lives in layout (via `<SpoilerBarWrapper />` in 6 pages — actually it was wrapped via root layout in this round). Webhook firing `revalidateTag("players")` on every player edit invalidated spoiler bar's data cache on every page.

**Fix:**
- Drop `"players"` tag from spoiler bar fetches
- Trade-off: editing a player no longer auto-refreshes spoiler bar; admin must explicitly fire spoiler-bar webhook (which they do 2-3x/week as normal workflow)

**Result:** $0.55/day → ~$0.30/day projected (~83% total reduction)

### Round 4 (2026-05-08): finish what Round 1 deferred

**Trigger:** Three days post-Tuesday-5/5-optimizations (compare query-params, edit ISR timer kill, legacy redirects). User saw cost still ~$1.30/day, panicked. Investigation revealed:
- $0.43/day was Observability Plus (toggled on for debugging, masked the real cost)
- Apples-to-apples organic was ~$0.91/day — Tuesday's wave had landed but settling slowly
- ISR Writes still $0.45/day with this distribution (24h):
  - Static pages with NO content events were rebuilding 350-566 times/day each
  - /contact: 514 writes / 1 path
  - /privacy-policy: 356 / 1
  - /become-supporter: 515 / 1
  - /index: 566 / 1
  - /directory: 532 / 1
  - /live-feed-updates list: 529 / 1

**Root cause:** Round 1 had deferred `getAdScripts()` (`revalidate: 300`) plus another inline ad-settings fetch in `layout.jsx` (`revalidate: 3600`). Both in the root layout. Per Next.js: "the lowest revalidate value of a given route will be the route's revalidation frequency." Layout fetches floor every page in the segment.

**Fix (commit `671fa9d` on staging → `5ef3e04` on main):**
- `lib/api/ads.js` `getAdScripts`: `revalidate: 300` → `revalidate: false`
- `app/layout.jsx` inline ad-settings fetch: added `tags: ["ad-settings"]`, `revalidate: 3600` → `revalidate: false`
- `app/api/revalidate/route.js`: added `case "ad-scripts":` and `case "ad-settings":` for tag-based purge

**Result:** validated within 6h post-deploy.

---

## Round 4 validation data (2026-05-08, ~5pm post-deploy)

### Daily cost breakdown comparison

| Line | May 7 (pre-fix, Plus on) | May 8 (post-fix, Plus partial) | Change |
|---|---|---|---|
| ISR Writes | $0.45 | $0.14 | **-69%** |
| Observability Events | $0.43 | $0.14 | -67% (manual toggle) |
| Fluid Provisioned Memory | $0.18 | $0.05 | -72% |
| Fast Origin Transfer | $0.12 | $0.04 | -67% |
| Fluid Active CPU | $0.10 | $0.04 | -60% |
| Build CPU Minutes | $0 | $0.32 | one-time deploy |
| **Total** | **$1.34** | **$0.74** | **-45%** |

**Apples-to-apples organic infra (no Plus, no build):**
- May 7: $1.34 - $0.43 = $0.91
- May 8: $0.74 - $0.32 - $0.14 = $0.28 (~69% drop)

### The smoking-gun signal: Time-based Revalidations

| Window | Time-based Revalidations |
|---|---|
| 24h ending morning 5/8 | 26K |
| Last 12h (mixed pre/post fix) | 2.6K |
| Last 6h (post-fix only) | **66** |

**~99.7% reduction.** The 26K was almost entirely the layout-fetch cascade ticking on every cached fetch URL. After fix: effectively zero.

### Writes drop 6h before vs 6h after fix

- First 6h (pre-fix): 15K writes
- Last 6h (post-fix): 2.9K writes
- **80% drop in 6 hours**

### Per-route validation

| Page | 24h pre-fix | 12h post-fix | Notes |
|---|---|---|---|
| / (home) | 566 | 0 | Confirmed working |
| /contact | 514 | 96 | Trending toward zero |
| /become-supporter | 515 | 90 | Trending toward zero |
| /privacy-policy | 356 | dropped out of top | Confirmed working |
| /live-feed-updates (list) | 529 | 94 | Working |
| /bigbrother-players/[slug] | 22 writes/path | 1.35 writes/path | Cascade was the dominant cause |

---

## Architectural rules (codified after Round 4)

These are now hard rules for any future work on bbj-app:

1. **Never call `cookies()`, `headers()`, or `draftMode()` in `layout.jsx` or any shared route segment.** Opts the entire tree into dynamic rendering. (Round 0 / April incident)

2. **Never use time-based `revalidate` on layout fetches.** Floors every page in the route segment to that timer (Next.js takes the lowest revalidate of any fetch in the segment). Use `revalidate: false` + tag-based invalidation. (Round 4)

3. **Never put a broad tag on a single-item fetch.** Webhook firing the broad tag will cascade-invalidate every cached single-item page. Use granular tags (`\`item-${slug}\``) for single items, broad tags only for list/index fetches. Webhook handler fires both. (Round 2)

4. **Never put a broadly-invalidated fetch in a layout.** Layouts wrap every route; their data invalidations cascade. Layout fetches must use either a never-invalidated tag or a very narrow invalidation surface (e.g., `spoiler-bar` only fires on explicit spoiler bar updates). (Round 3)

5. **Never use `force-dynamic` on content pages.** Pages are webhook-driven (`revalidate: false`), rebuilt by `/api/revalidate`. (April 2026 cost incident)

6. **Per-user data is always client-side, never server-rendered.** Auth state, supporter flag, comments under user's name — all client-side. (April 2026 cost incident)

7. **Any new fetch (server OR client) must declare its cache strategy before merging.** "Will this fire on every visit, or is it cached?" If unknown, stop and figure it out before writing code. (CLAUDE.md gatekeeper rule)

---

## Cost trajectory across all 4 rounds

| Date | State | Daily infra cost |
|---|---|---|
| 2026-04-16 | DNS flip from Cloudways to Vercel | (chaos) |
| 2026-04-19 | Cloudflare proxy on, Analytics removed | $1.66 (12h window) |
| 2026-04-30 | Pre-Round-1 baseline | $1.65 |
| 2026-05-01 | Round 1: wpFetch default, page revalidate=false | ~$1.50 |
| 2026-05-02 (am) | Round 2: granular tags | ~$0.55 |
| 2026-05-02 (pm) | Round 3: spoiler bar tag scoping | ~$0.30 (projected) |
| 2026-05-05 | Tuesday: compare query-params, edit ISR kill, legacy redirects | (settling) |
| 2026-05-08 | Round 4: layout-fetch revalidate kill | ~$0.10-0.15 (projected from 6h post-fix data) |

---

## Open items (not addressed, not urgent at current cost levels)

### /live-feed-updates/[slug] — Google re-indexing crawl bleed (19K writes/day pre-Round-4)
- Bots crawling 13K unique feed update slugs / day
- Source: Google's existing index of old WP URLs after DNS flip
- Sitemap only exposes 200 newest, so we're not feeding the crawl
- Should naturally decay as Google updates its index
- Mitigation if it doesn't: noindex old feed updates, restrict sitemap further, robots.txt rules

### /[slug] catch-all — bot probes generating cached 404s (6.1K writes/day pre-Round-4)
- ~1900 unique garbage URLs/day each generating a cached 404 ISR write
- Future fix: short-circuit unknown slugs to a non-cacheable 404 response (early-bail before render)

### Webhook fan-out: spoiler-bar invalidates 6 pages
- `<SpoilerBarWrapper />` rendered in: /, /bigbrother-players/[slug], /bigbrother-seasons/[slug], /live-feed-updates, /live-feed-updates/[slug], /[slug]
- Spoiler-bar webhook → all 6 pages invalidated → next visit rebuilds
- Manageable at current update rate (2-3x/week)
- During BB28 live shows could fire 10-50x/night; if writes spike, split SpoilerBarWrapper into a Client Component to remove from server render

### WP plugin: fire `ad-scripts` / `ad-settings` webhooks on settings save
- Currently relies on manual purge via `POST /api/revalidate { secret, tag: "ad-scripts" }`
- Acceptable since ad scripts change quarterly
- Wire when convenient

### Inner page-fetch revalidate timers (intentional, not a problem)
These remain and are fine — they don't cascade because they're inside specific pages, not layouts:

| Fetch | Revalidate | Reason |
|---|---|---|
| `users.js` profile data | 1h | No webhook coverage for user profile changes |
| `posts.js` list fetches | 1h | Defensive fallback alongside webhook |
| `feedUpdates.js` lists | 1h | Defensive |
| `players.js` lists | 1h | Defensive |
| `category/[...slug]` page | 1h | Inner page fetch |
| `tag/[slug]` page | 1h | Inner page fetch |
| `users/[username]` initial comments | 5min | SSR initial only, client takes over |
| `contact.js` config | 24h | No webhook |

---

## In-season scaling (BB28 projection)

User asked how the architecture scales during peak BB28 traffic (~30K DAU vs current ~120 DAU).

**Webhook-driven write events scale with content volume, not traffic:**

| Source | Daily writes (BB28 peak estimate) |
|---|---|
| Feed update webhooks | 600-1000 |
| Comment webhooks | 1000-2000 |
| Post publishes | ~50 |
| Player/spoiler-bar updates | 200-500 |
| Bot first-visits (new feed update slugs) | 5K-15K |
| **Total writes** | **~7K-18K/day** |

vs current ~12K/day post-Round-4. So ~1-2x growth in writes. Cost on writes: ~$0.05-0.10/day.

**Other lines scale with traffic** — Fluid CPU, Origin Transfer, Edge Requests. These are where in-season cost will actually grow. Cloudflare proxy absorbs most static asset traffic; Vercel only sees uncached requests + first-time HTML renders.

**Peak month projection:** ~$80-150/mo total. Beats Cloudways' historical $243/mo BB27 peak.

---

## Strategic context

- April 2026: User was actively building PHP fallback in `/bbj` as cost hedge
- May 2026: Round 4 validation pushed user back toward Next.js commitment
- 2026-05-08 user statement: "I'm going to start moving over the design I created with my PHP theme to offline here. Monitor Vercel without building anything for a week. If numbers remain low, push the changes and start really going into BB28 season."
- Decision point: ~2026-05-15 after week of cost monitoring
- If cost stays <$0.50/day: Next.js becomes committed production stack; PHP rewrite stays as fallback only

---

## Files of note (current state, post-Round-4)

| File | Note |
|---|---|
| `src/lib/api/wordpress.js` line 11 | wpFetch default `revalidate: false` |
| `src/lib/api/ads.js` line 16 | getAdScripts `revalidate: false` (Round 4) |
| `src/app/layout.jsx` line 98 | inline ad-settings fetch `revalidate: false`, tagged |
| `src/app/api/revalidate/route.js` | webhook handler with all cases including ad-scripts/ad-settings |
| All `src/app/**/page.jsx` dynamic routes | `revalidate = false` + `dynamicParams = true` |

---

## Reference key memory files

- `memory/feedback_caching_first.md` — gatekeeper rule (caching first before any code change)
- `memory/project_isr_webhook_strategy.md` — full Round 1-4 history
- `memory/project_php_rewrite_parallel_track.md` — strategic context (May 8 update)
- `memory/project_vercel_cost_incident.md` — April 2026 force-dynamic incident
