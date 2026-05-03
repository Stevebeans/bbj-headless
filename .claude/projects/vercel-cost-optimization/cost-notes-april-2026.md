# Vercel Cost Optimization Notes — April 2026

**Context:** DNS flipped from Cloudways/WordPress to Vercel/Next.js on 2026-04-16. Then spent 4 days measuring cost, identifying levers, optimizing. This file preserves all the raw data + findings for future reference.

## Current Projected Monthly Cost

**~$135/mo total at current (off-season) traffic**
- Infra: ~$100/mo
- Build minutes buffer: ~$15/mo
- Pro subscription: $20/mo

**Cloudways comparison (historical):**
| Month | Cost |
|---|---|
| Nov 2025 | $117 |
| Oct 2025 | $146 |
| Sep 2025 (BB27 peak tail) | $243 |
| Aug 2025 (BB27 peak) | $208 |
| Jul 2025 (BB27 ramp) | $106 |

**Verdict at current traffic: Vercel ($135) now beats Cloudways baseline ($105-146).**

## Traffic Reality Check

- Current DAU: **~120** (off-season)
- BB28 peak DAU estimate: **26,000–37,000**
- Scaling factor: **~250x**

Serverless cost scales roughly linearly with traffic. Dedicated hosting (Cloudways) doesn't.

## Raw 12-Hour Window Data

### Window A: 2026-04-17 midnight-to-noon (post-DNS-flip chaos, pre-optimization)
Autoscaler was spinning up tons of warm containers to handle unfamiliar traffic patterns.

| Line | Usage | Cost |
|---|---|---|
| Edge Requests - Additional CPU Duration | 19.69 seconds | $0.00 |
| Fast Data Transfer | 4 GB / 1 TB | $0.00 |
| Edge Middleware Invocations | 6 | $0.00 |
| Edge Requests | 179.82K / 10M | $0.00 |
| Fast Origin Transfer | 3 GB | $0.16 |
| **Fluid Provisioned Memory** | **188.47 GB Hrs** | **$2.00** |
| Fluid Active CPU | 2 hours | $0.28 |
| Function Duration | 0.14 GB Hrs | $0.02 |
| Function Invocations | 30.18K | $0.00 |
| ISR Writes | 172.23K | $0.69 |
| ISR Reads | 153.43K | $0.06 |
| Web Analytics Events | 4.65K | $0.14 |
| **Infrastructure Subtotal** | | **$3.35** |

### Window B: 2026-04-18 1am–1pm (post-autoscaler-settle, pre-Cloudflare)
Autoscaler had stabilized into steady state. Fluid Provisioned Memory dropped 90% naturally.

| Line | Usage | Cost |
|---|---|---|
| Edge Requests - Additional CPU | 45.14 seconds | $0.00 |
| Fast Data Transfer | 7 GB / 1 TB | $0.00 |
| Edge Middleware Invocations | 6 | $0.00 |
| Edge Requests | 456.61K / 10M | $0.00 |
| Fast Origin Transfer | 5 GB | $0.27 |
| Fluid Provisioned Memory | 19.75 GB Hrs | $0.21 |
| Fluid Active CPU | 1 hour | $0.17 |
| Function Invocations | 40.58K | $0.00 |
| **ISR Writes** | **225.81K** | **$0.90** |
| ISR Reads | 373.66K | $0.15 |
| Web Analytics Events | 11.99K | $0.36 |
| Build Minutes | 6 min | $0.76 |
| **Infrastructure Subtotal** | | **$2.83** |
| Pro subscription (prorated) | | $1.29 |

### Window C: 2026-04-19 noon–2026-04-20 noon (Cloudflare proxy ON, Analytics removed)
**The best window. All optimizations applied.**

| Line | Usage | Cost | Change vs Window B |
|---|---|---|---|
| Edge Requests - Additional CPU | 28.43 seconds | $0.00 | — |
| Fast Data Transfer | 4 GB / 1 TB | $0.00 | — |
| Edge Middleware Invocations | 5 | $0.00 | — |
| **Edge Requests** | **306.09K** | $0.00 | ⬇️ **-33%** |
| Fast Origin Transfer | 3 GB | $0.20 | ⬇️ -26% |
| Fluid Provisioned Memory | 17.05 GB Hrs | $0.18 | ⬇️ -14% |
| Fluid Active CPU | 1 hour | $0.13 | ⬇️ -24% |
| Function Invocations | 30.09K | $0.00 | — |
| **ISR Writes** | **168.33K** | **$0.67** | ⬇️ -26% |
| ISR Reads | 271.53K | $0.11 | ⬇️ -27% |
| Web Analytics Events | 3.65K | $0.11 | ⬇️ -69% (removal still propagating) |
| Build Minutes | 2 min | $0.25 | — |
| **Infrastructure Subtotal** | | **$1.66** | ⬇️ **-41%** |
| Pro subscription (prorated) | | $1.29 | — |

## 45-Minute Window Data (2026-04-17 afternoon rapid iterations)

### 45min Window 1 (~2pm, pre-optimizations)
Fluid Memory: 4.81 GB-hrs / $0.05 • CPU: 19min / $0.04 • Origin: 1GB / $0.07 • Invocations: 10.16K • ISR Writes: 54.68K / $0.22 • ISR Reads: 93.61K / $0.04 • Analytics: 3.08K / $0.09 • Build: 2min / $0.25 • **Total: $0.76**

### 45min Window 2 (~2:45pm, memory change attempted, ISR timers still 300s)
Fluid Memory: 5.48 GB-hrs / $0.06 • CPU: 22min / $0.05 • Origin: 1GB / $0.08 • Invocations: 11.6K • ISR Writes: 63.7K / $0.25 • ISR Reads: 106.61K / $0.04 • Analytics: 3.36K / $0.10 • Build: 3min / $0.38 • **Total: $0.96**

### 45min Window 3 (~5:30pm, ISR timers bumped, higher evening traffic)
Fluid Memory: 7.64 GB-hrs / $0.08 • CPU: 32min / $0.07 • Origin: 2GB / $0.11 • Invocations: 16.42K • ISR Writes: 90.41K / $0.36 • ISR Reads: 150.43K / $0.06 • Analytics: 4.93K / $0.15 • Build: 6min / $0.76 • **Total: $1.59**

**Note:** Window 3 had ~42% more traffic than Window 2 (evening peak), so absolute numbers up but traffic-normalized they were comparable. ISR Writes-per-invocation ratio stayed ~5.5 across all windows, confirming the revalidate timer change had limited impact on long-tail-URL content sites.

## Lessons Learned

### What worked
1. **Cloudflare proxy re-enabled** — single biggest lever (-41% overall). Flip orange cloud on apex + www DNS records. Requires SSL/TLS mode = Full (Strict). Cloudflare absorbs static asset requests before they hit Vercel's meter.
2. **Vercel Analytics removal** — saves $20-30/mo, redundant with GA4 already running via Freestar.
3. **Autoscaler self-optimization** — the post-flip chaos ($2/12h on Fluid Memory) was a temporary warm-pool over-provisioning that self-corrected over 24-36h as Vercel's autoscaler learned real concurrency needs. Wait 48h before panicking.

### What didn't work
1. **vercel.json memory override (`memory: 1024`)** — **ignored** when Fluid Compute is enabled. Vercel's dashboard shows a yellow warning: "The current production deployment has custom overrides in vercel.json, which gets ignored." Fluid Compute has only 2 fixed CPU tiers:
   - Standard: 1 vCPU / 2GB (floor)
   - Performance: 2 vCPUs / 4GB
2. **ISR revalidate bumps (300s → 86400s)** — minimal impact. ISR Writes-per-invocation stayed at ~5.5 across all windows. The long-tail of unique URLs means most page visits are first-time (uncached) renders regardless of revalidate timer. Works in theory, doesn't move the needle for a content site with 1000s of posts.

### Fluid Compute mechanics (for future reference)
- Single container handles many concurrent requests (not 1:1 like traditional Lambda)
- Pay for **Provisioned Memory** (GB-hrs) = memory tier × time × container count
- ~$0.0106 per GB-hr
- Can't go below 2GB memory tier — memory coupled to CPU tier
- Starts warm containers across regions pre-emptively to avoid cold starts

## BB28 Peak Projections (July-Sept 2026)

**Napkin math for 30K DAU peak (~250x current traffic):**

### Without Cloudflare (hypothetical)
| Line | Estimated monthly peak |
|---|---|
| Fluid Active CPU | $1,200-1,500 |
| Fast Origin Transfer | $1,500-2,100 |
| ISR Writes (caps out) | $150-250 |
| Fluid Memory | $50-100 |
| Edge Requests | $0-100 |
| **Total monthly peak** | **$2,900-4,000** |

### With Cloudflare (current setup)
**~$700-1,200/mo during peak BB28 months**

### Cloudways historical peak
**$243/mo (Sep 2025)**

### Gap at peak
Vercel-with-CF will likely cost **3-5x more than Cloudways did during BB28 peak**. That's structural — serverless vs dedicated hardware.

## Strategic Options for BB28

1. **Accept and budget for it.** $700-1200/mo × 3 months = $2-3.5k extra vs Cloudways. If faster site boosts Freestar CPM even 15%, might cover itself. User's Freestar seasonal revenue was ~$4k.

2. **Hybrid deploy: Vercel off-season, Cloudways during BB season.** DNS-flip WP backend (or entire site) to Cloudways for July-September. Annoying but cost-effective.

3. **More aggressive static pre-generation.** `generateStaticParams` with top 500-1000 posts pre-built at deploy time. Would shift cost from per-request ISR to one-time build. Could cut Fluid Active CPU 30-40%.

4. **Vercel Enterprise custom pricing.** Different tier, potentially cheaper at scale. Requires sales conversation.

5. **Self-host Next.js on a VPS (Coolify, etc.).** Flat pricing, lose edge network magic. Fallback option.

## Deploy-log (what changed when)

| Date | Commit | Change |
|---|---|---|
| 2026-04-16 | (DNS flip) | Cloudways → Vercel |
| 2026-04-17 | c5fcc68 | vercel.json memory: 1024 (IGNORED — Fluid Compute locks it) |
| 2026-04-17 | 64ee702 | ISR revalidate bumps: posts 300→86400, players/seasons/feed-updates 300→3600; removed vercel.json |
| 2026-04-18 | d93c93f | Removed Vercel Analytics (`<Analytics />` + `@vercel/analytics` package) |
| 2026-04-19 | (Cloudflare) | Turned on orange cloud proxy (apex + www), SSL = Full Strict, Caching Standard, no custom cache rules |

## Files & Commits of Note

- `src/app/layout.jsx` — Vercel Analytics removed from line 15 import and line 184 render
- `src/app/[slug]/page.jsx` — `revalidate = 86400` (line 22)
- `src/app/bigbrother-players/[slug]/page.jsx` — `revalidate = 3600` (line 24)
- `src/app/bigbrother-seasons/[slug]/page.jsx` — `revalidate = 3600` (line 26)
- `src/app/live-feed-updates/[slug]/page.jsx` — `revalidate = 3600` (line 9)
- `src/app/users/[username]/page.jsx` — `revalidate = 3600` (line 14)
- `next.config.js` — `/wp-content/*` and `/wp-includes/*` rewrites to `wp.bigbrotherjunkies.com` (post-DNS-flip image fix)
- `package.json` — `@vercel/analytics` removed

## Current Cloudflare Settings

- **DNS:** apex + www both proxied (orange cloud ON)
- **SSL/TLS:** Full (Strict) ✅
- **Caching Configuration:** Standard + Respect Existing Headers ✅
- **Cache Rules:** 0 custom rules (Cloudflare uses default: cache assets, pass HTML through) ✅
- **Security → Bots:** default (not explicitly "off")

## Things to Monitor Over Next Week

- Do Web Analytics Events hit $0.00 after full propagation? (Should confirm `<Analytics />` removal is live)
- Does steady-state projection hold? ($100/mo infra, $135/mo all-in)
- Does Cloudflare cache hit rate improve as more pages get requested multiple times?
- Any ISR/webhook issues from Cloudflare being in the middle?

## DO NOT Re-Attempt These (tried and confirmed useless)

- Setting `memory: 1024` or `memory: 512` in vercel.json (ignored by Fluid Compute)
- Expecting ISR revalidate bumps to dramatically reduce ISR Writes on a content site with long-tail URLs
