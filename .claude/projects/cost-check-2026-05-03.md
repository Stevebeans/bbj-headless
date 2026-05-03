# Vercel Cost Optimization — Session Notes & Reference

**Sessions:** 2026-05-01 (initial deploys) and 2026-05-02 (cascade fix verification)
**Status:** All 3 rounds deployed to production. Verified working via X-Vercel-Cache test.

---

## TL;DR

- **Daily cost: $1.73 → ~$0.30** (~83% reduction once fully warmed)
- **Monthly bill: $45-50 → $20 flat** during off-season (fully absorbed by Pro credit)
- **BB28 peak projection: $700-1,200/mo → $50-100/mo** (now cheaper than Cloudways)
- **Annual Vercel: $5K-9K → $355-505**
- **Verified:** X-Vercel-Cache: HIT × 3 on cache-buster test = no more cascade

---

## What got deployed (all in `main`, live in production)

### Round 1 (2026-05-01 ~8pm)
**Commit:** `c26f695` perf(isr): switch dynamic content pages to revalidate=false
**Commit:** `7c1aa9c` perf(isr): switch data-layer fetches to webhook-driven revalidation

Code changes:
- `src/lib/api/wordpress.js` `wpFetch` default: `revalidate: 60` → `false`
- 11 page routes: `export const revalidate = 86400/3600/60` → `false`
  - Posts, players, seasons, individual feed updates, compare, category, tag, users, privacy-policy, directory, live-feed-updates index
- 6 explicit fetch calls: `revalidate: 60` → `false`
- 2 user profile fetches: `revalidate: 60` → `3600` (no webhook coverage, 1h fallback)
- `next.config.js`: added `/index` → `/` 301 redirect
- Cloudflare config (manual via dashboard):
  - HTML Cache Rule: 4hr edge TTL, excluding `/api/*`, `/admin*`, `/editor*`, `/login*`, `/settings*`, `/notifications*`, `/checkout*`, `/feed*`, `/preview*`
  - Bot Fight Mode: ON
  - Block AI Bots: All pages
  - AI Labyrinth: ON

### Round 2 (2026-05-02 ~10am)
**Commit:** `bf1ae67` perf(isr): narrow data-fetch tags to per-slug to prevent broad invalidation cascade

- `getPost` / `getPage`: drop broad `posts` / `pages`, keep only `post-${slug}` / `page-${slug}`
- `getRelatedPosts`: change to category-scoped `related-posts-${categoryId}`
- `getPlayerBySlug`: drop `players`, keep only `player-${slug}`
- `getFeedUpdateBySlug`: drop `feed-updates`, keep only `feed-update-${slug}`
- `getFeedUpdatesByDate`: drop `feed-updates`, keep only `feed-updates-${dateStr}`
- `getSeasonBySlug` / `getSeasonById`: drop `seasons`, keep `season-${slug}` + `players`
- Webhook handler: added `revalidateTag(\`post-${slug}\`)`, `revalidateTag(\`player-${slug}\`)`, `revalidateTag(\`feed-update-${slug}\`)` to fire alongside broad tags

### Round 3 (2026-05-02 ~4pm)
**Commit:** `6ac47ea` perf(isr): drop "players" tag from spoiler bar fetches to prevent layout cascade

- `getCurrentSeasonPlayers`: tags `["players", "current-season", "spoiler-bar"]` → `["spoiler-bar", "current-season"]`
- `getSpoilerBar`: tags `["spoiler-bar", "players"]` → `["spoiler-bar"]`

The spoiler bar fetch lives in the root layout (`src/app/layout.jsx` → `<SpoilerBarWrapper />`). Having `players` tag on it meant **every player edit invalidated the spoiler bar's data cache on every page**, triggering stale-while-revalidate background regenerations. Removing the broad tag killed the cascade.

**Trade-off:** Editing a player's status no longer auto-refreshes spoiler bar. Admin must explicitly fire `spoiler-bar` webhook (matches stated 2-3x/week workflow).

---

## Number progression — the proof

### Daily costs

| Date | Status | Daily cost | Notes |
|---|---|---|---|
| 2026-04-30 | Pre-fix baseline | $1.65 | Long-tail Vercel cycle average |
| 2026-05-01 | Round 1 mid-day | $1.50 | Transition day |
| 2026-05-02 (16h) | After Round 1+2 | $0.53 actual ($0.40 projected/day) | Big drop visible |
| **2026-05-02 evening** | **After Round 3** | **~$0.30/day projected** | **Cascade killed** |

### Daily ISR Writes

| Date | Total writes/day |
|---|---|
| 2026-05-01 | 178,750 |
| 2026-05-02 (early 9h) | 20,130 (extrapolated 53,700/day) |
| 2026-05-02 (post-Round 3 2h) | ~9,000 (extrapolated ~108K/day during warmup) |
| **Steady state target** | **~25-30K/day** |

### Per-route writes/path (the key metric)

| Route | Yesterday (May 1) | Today early (9h, after R1) | Today evening (2h, after R3) | Target |
|---|---|---|---|---|
| `/bigbrother-players/[slug]` | n/a | 12.7 | **5.99** ✅ | 5-6 |
| `/[slug]` (posts) | n/a | 3.2 | **2.82** ✅ | 3-5 |
| `/live-feed-updates/[slug]` | n/a | 2.2 | (warming) | <2 |
| `/compare/[matchup]` | n/a | 2.1 | (warming) | <2 |

**The 5.99 on player pages is the verification that Round 3 worked.** Math: 4-6 fetches per cold render = 4-6 writes/path floor. We're at the floor. Anything above 6 writes/path indicates background regenerations from cascade — we're not seeing that anymore.

### Cache hit rates (after Round 3, 2h sample)

| Layer | % of traffic |
|---|---|
| CDN Cache (Vercel edge, before function) | 32.1% |
| ISR Cache (Vercel origin, no rebuild) | 51.6% |
| Cache Miss (full render) | 16.3% |
| **Total hit rate** | **83.7%** |

---

## When you come back — what to check

### 1. Daily cost trajectory
**Path:** vercel.com → bbj-next → Usage tab → Consumption Breakdown chart

Compare today's bar height to yesterday's. Should be visibly smaller.

**Target:** $0.30-0.40/day after full warmup (24-48h post Round 3 deploy)

### 2. Per-route ISR writes
**Path:** Vercel Observability → bbj-next → ISR (left sidebar) → Last 24 hours

Look at writes/unique-path for top routes:
- `/bigbrother-players/[slug]`: target ~5-6 writes/path
- `/[slug]` (posts): target ~3-5 writes/path
- `/live-feed-updates/[slug]`: target ~2-3 writes/path
- `/compare/[matchup]`: target ~2 writes/path

If any are still 8+, something's invalidating that route's cache more than expected. Send the screenshot, we'll diagnose.

### 3. Cache mix
**Path:** Same ISR view → Request Caching panel

Should see:
- ISR Cache (HIT) ≥ 50%
- CDN Cache (HIT) ≥ 30%
- Cache Miss ≤ 20%

### 4. Cache verification test (manual — only if numbers look wrong)
1. Open incognito → visit any player page with cache-buster: `https://bigbrotherjunkies.com/bigbrother-players/some-slug?t=1`
2. DevTools → Network → click doc request → Response Headers
3. Look at `x-vercel-cache`:
   - **HIT** = ISR cache stable, cascade fixed ✅
   - **STALE** = something invalidating cache → cascade is back
   - **MISS** = first hit, repeat with `?t=2` to see if HIT on second try
4. Repeat with `?t=2`, `?t=3` — should consistently show HIT

If you see STALE on player pages, the spoiler bar cascade is back. Check that `getCurrentSeasonPlayers` and `getSpoilerBar` in `src/lib/api/players.js` still don't have the `players` tag.

---

## Cost projections (off-season → peak)

### Off-season (Oct-Jun)
| | Daily | Monthly |
|---|---|---|
| Operating cost | $0.20-0.30 | $6-9 |
| Build CPU (deploys) | $0.05-0.10 avg | $1-3 |
| **Infrastructure** | **~$0.25-0.40** | **$7-12** |
| Pro credit absorbs | -$20 | -$20 |
| **Total bill** | | **$20/mo flat** ✅ |

### BB28 Peak (Jul-Sep)
Content events scale up: ~10-50x more comments, 10-30x more feed updates per day, more posts, eviction night spikes.

| | Daily | Monthly |
|---|---|---|
| Infrastructure | $1.50-3.80 | $45-115 |
| Pro credit absorbs | -$20 | -$20 |
| Net overage | | $25-95 |
| Pro subscription | | $20 |
| **Total bill** | | **$50-100/mo** |

### Annual outlook

| Period | Months | Monthly | Subtotal |
|---|---|---|---|
| Off-season | 9 | $20 | $180 |
| Pre-season ramp (Jun) | 1 | $25 | $25 |
| BB28 peak | 3 | $50-100 | $150-300 |
| **Annual Vercel** | | | **~$355-505** |

**Compared to:**
- Pre-fix projection: $5,000-9,000/year
- Cloudways historical: $1,400-1,800/year
- **Net savings vs pre-fix: $4,500-8,500/year**

---

## Open questions / deferred work

### 1. `/index` 234 writes/9h despite redirect (low priority)
Theory: stale ISR entries from pre-redirect deploy. Should decay over 48h. If still high in a week, investigate. Cost ~$0.001/hr — not urgent.

### 2. `getAdScripts()` 300s revalidate (small further win)
**File:** `src/lib/api/ads.js:14`
```js
revalidate: 300,
```
Could bump to 3600+. Ad scripts change quarterly. Would drop static-page floor from 5min → 1hr. Saves maybe $0.50/mo. Defer unless cost creeps up.

### 3. Cloudways scale-down (significant savings opportunity)
With Vercel handling all public traffic and webhook frequency now low, Cloudways CPU/RAM use is way down. 2-week monitoring window then evaluate.

**Plan when ready:**
1. Cloudways → Application → Monitoring → check CPU/RAM usage over 7-14 days
2. If consistently <30% CPU and <50% RAM → safe to drop a tier
3. **Clone server** to smallest acceptable tier (test first, don't migrate prod immediately)
4. After confirming clone works, DNS-flip `wp.bigbrotherjunkies.com` to new server, delete old
5. **CRITICAL:** When scaling up for BB28 peak, choose "scale CPU & RAM only, not storage" so you can scale back down after season

**Realistic savings:** $40-65/mo off-season if currently on $94 tier and dropping to $28-50 tier. ~$300-500/year.

### 4. New theme conversion (next session)
User mentioned converting this app to a new look they prefer (from PHP theme exploration). When that work starts, MUST preserve these architecture rules to keep costs low:

---

## Architecture rules to preserve (for new theme work)

When refactoring components or adding new pages:

### ✅ DO
- Use `revalidate = false` on dynamic content pages with webhook coverage
- Use granular per-slug tags on single-item fetches: `tags: [\`item-${slug}\`]`
- Keep broad tags (`posts`, `players`) ONLY on list/index page fetches
- For new fetches, NEVER copy `revalidate: 60` from old code — default is now `false` in `wpFetch`

### ❌ DON'T
- Put broadly-tagged fetches in the layout (cascades to every page)
- Use `cache: 'no-store'` or `dynamic = 'force-dynamic'` unless absolutely necessary (this caused the original April incident)
- Call `cookies()` / `headers()` / `draftMode()` in layout (opts entire app into dynamic rendering — see comment in `layout.jsx:91-95`)
- Add new layout-level data fetches without thinking about cascade impact

### Watch for in new theme code
- New top-of-page sections that fetch data (banner, alerts, breadcrumbs) — make them client-side or use `Suspense` carefully
- New components that fetch fresh data on every render — should use `unstable_cache` or have proper revalidate settings
- Anything that adds `force-dynamic` (the original April incident root cause)

---

## File reference (in case you forget where things live)

| File | What it does |
|---|---|
| `src/lib/api/wordpress.js` | `wpFetch` wrapper — default `revalidate: false` (changed from 60) |
| `src/lib/api/players.js` | Player fetches — `getCurrentSeasonPlayers` is the layout-spoiler-bar one |
| `src/lib/api/posts.js` | Post fetches — granular per-slug tags |
| `src/lib/api/feedUpdates.js` | Feed update fetches — granular per-slug tags |
| `src/lib/api/seasons.js` | Season fetches |
| `src/app/api/revalidate/route.js` | Webhook handler — fires both broad AND granular tags |
| `src/app/layout.jsx` | Root layout — has `<SpoilerBarWrapper />` (cascade source if mis-tagged) |
| `next.config.js` | Has `/index` → `/` redirect, image rewrites |
| `.claude/projects/caching.md` | Cloudflare cache rule expression (copy-paste reference) |

## Memory references

- `MEMORY.md` → `project_isr_webhook_strategy.md` — full architectural reasoning, all 3 rounds documented
- `MEMORY.md` → `project_vercel_cost_resolution.md` — April 2026 work (Cloudflare proxy turn-on)
- `MEMORY.md` → `project_vercel_cost_incident.md` — original April force-dynamic incident
