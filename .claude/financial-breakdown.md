# Vercel Financial Breakdown for BBJ

**Created:** February 2, 2026
**Based on:** GA4 data from Jan 1 - Dec 31, 2025

---

## Your Traffic Profile (2025)

| Metric | Value |
|--------|-------|
| Active Users | 595K |
| New Users | 583K |
| Total Sessions | ~2M |
| Peak Month | July (BB season premiere) |
| Peak Concurrent | 2-3K (Thursday live shows) |
| Current Real-time | ~21 active users (off-season) |

### Session Sources
| Channel | Sessions |
|---------|----------|
| Organic Search | 1.3M |
| Direct | 473K |
| Organic Social | 145K |
| Email | 35K |
| Unassigned | 19K |
| Referral | 1.7K |

### Traffic Pattern
- **Off-season (Oct-May):** Very low - maybe 50-80K sessions/month
- **Pre-season (June):** Ramp-up, ~150-200K sessions/month
- **Peak season (July-Aug):** ~400-500K sessions/month
- **Late season (Sep):** Tapering, ~200-300K sessions/month
- **July alone likely accounts for 30-40% of annual traffic**

---

## Vercel Plans Comparison

### Hobby Plan (Free)

| Resource | Included |
|----------|----------|
| Cost | $0/month |
| Bandwidth (Fast Data Transfer) | 100 GB/month |
| Edge Requests | 1M/month |
| ISR Reads | 1M/month |
| ISR Writes | 200K/month |
| Serverless Function Duration | 100 GB-hours |
| Function Invocations | 1M/month |
| Image Optimization Sources | 1,000/month |
| Custom Domains | Yes (up to 50 per project) |
| Team Members | 1 (single developer) |
| Overages | **None available - service paused until next cycle** |

**CRITICAL: Hobby plan is restricted to non-commercial, personal use only.** BBJ has ads and premium subscriptions, which makes it a commercial project. **You cannot legally use the Hobby plan for BBJ.**

### Pro Plan ($20/month)

| Resource | Included | Overage Rate |
|----------|----------|-------------|
| Cost | $20/user/month (1 user = $20/mo) |  |
| Bandwidth (Fast Data Transfer) | 1 TB/month | $0.15/GB |
| Edge Requests | 10M/month | $0.65 per 1M |
| ISR Reads | 10M/month | $6.50 per 1M |
| ISR Writes | 2M/month | $8.00 per 1M |
| Fast Origin Transfer | 100 GB/month | $0.06/GB |
| Active CPU | 16 CPU-hours | $0.128/hr |
| Function Invocations | 1M/month | $0.60 per 1M |
| Image Optimization Sources | 5,000/month | $5 per 1,000 |
| Custom Domains | Unlimited | |
| Team Members | Unlimited viewers, $20/billing seat | |
| Spend Management | Default $200 cap (configurable) | |

### Enterprise (Custom Pricing)
- Overkill for BBJ's scale. Skip this.

---

## Estimated Monthly Costs on Pro

### How BBJ Uses Bandwidth

Key factor: **Images are served from WordPress/Cloudways, NOT Vercel.** Vercel only serves HTML, JavaScript, and CSS. This massively reduces bandwidth usage.

**Per-page transfer estimate (compressed with Brotli):**
- First page load: ~100-150KB (HTML + JS bundle + CSS)
- Subsequent pages (client-side navigation): ~30-50KB (just the new page data)
- Average across a session: ~50KB per pageview

**Pages per session estimate:** ~3-5 pages

### Off-Season Months (Oct-May)

| Resource | Usage | Cost |
|----------|-------|------|
| Sessions | ~60K/month | |
| Pageviews | ~240K/month | |
| Bandwidth | ~12 GB | Included (1TB limit) |
| Edge Requests | ~500K | Included (10M limit) |
| ISR Reads | ~300K | Included (10M limit) |
| Functions | Minimal | Included |
| **Monthly Total** | | **$20** (base only) |

### Peak Season (July-August)

| Resource | Usage | Cost |
|----------|-------|------|
| Sessions | ~450K/month | |
| Pageviews | ~1.8M/month | |
| Bandwidth | ~90 GB | Included (1TB limit) |
| Edge Requests | ~3M | Included (10M limit) |
| ISR Reads | ~2M | Included (10M limit) |
| Functions | Light | Included |
| **Monthly Total** | | **$20** (base only) |

### Thursday Live Show Spikes (2-3K concurrent)

Even at 3,000 concurrent users refreshing pages, this is well within Pro limits. Vercel's edge network handles this easily with cached static pages.

### Annual Estimate

| Period | Months | Monthly Cost | Subtotal |
|--------|--------|-------------|----------|
| Off-season | 8 months | $20 | $160 |
| Peak season | 4 months | $20 | $80 |
| **Annual Total** | | | **~$240/year** |

**You're unlikely to hit any overages** unless traffic grows significantly beyond 2025 levels. The 1TB bandwidth and 10M edge request limits are generous for your traffic volume.

---

## Potential Extra Costs to Watch

### Image Optimization
If you use `next/image` for WordPress-hosted images, each **unique source image** counts toward optimization limits. Pro includes 5,000/month, overage is $5 per 1,000.

- If BBJ serves ~500 unique post thumbnails + player photos, you're fine
- If you have thousands of unique images loading across the site, could add $5-15/month in peak season
- **Tip:** Use WordPress image sizes directly instead of Vercel optimization where possible

### ISR Writes (Revalidation)
Each time a page revalidates via webhook or time-based ISR, it counts as a write. Pro includes 2M/month - you'd need to publish thousands of updates per month to approach this.

### Serverless Functions
Your API routes (`/api/revalidate`, admin proxy routes) use serverless functions. Usage should be minimal since most of the site is static.

---

## Comparison: Current Hosting vs Vercel

| | Current (WordPress on Cloudways) | Next.js on Vercel + WP API on Cloudways |
|---|---|---|
| Frontend hosting | Cloudways (included) | Vercel Pro ($20/mo) |
| WordPress/API | Cloudways (~$20-50/mo) | Cloudways (same, keep as API) |
| CDN | Cloudways CDN or Cloudflare | Vercel Edge Network (included, global) |
| SSL | Cloudways | Vercel (automatic) |
| Performance | Server-rendered PHP | Edge-cached static pages (faster) |
| **Total** | **~$20-50/mo** | **~$40-70/mo** |

The additional ~$20/mo for Vercel gets you:
- Global edge caching (faster page loads worldwide)
- Automatic deployments from git
- Preview deployments for every PR
- Built-in DDoS protection and WAF
- Zero-config scaling for traffic spikes
- Staging environments

---

## Do You Need Pro? YES.

**Three reasons:**

1. **Commercial use** - Hobby plan prohibits commercial use. BBJ has ads and premium subscriptions. This alone requires Pro.

2. **Bandwidth headroom** - Hobby's 100GB limit could be exceeded during peak season. Pro's 1TB gives 10x headroom.

3. **Edge requests** - Hobby's 1M/month could get tight in July. Pro's 10M is comfortable.

**Custom domains work on Hobby**, but that's irrelevant since you need Pro for commercial use regardless.

---

## Staging Setup (Included with Pro)

Pro plan includes preview deployments and custom environments at no extra cost:

- Every git branch gets its own deployment URL automatically
- You can map `staging.bigbrotherjunkies.com` to a specific branch
- No additional cost for staging environments
- Password protection available as an add-on if needed

---

## Recommendations

1. **Start with Pro at $20/mo** - One billing seat is all you need
2. **Set spend management cap at $50** - Safety net for unexpected overages
3. **Keep Cloudways** for WordPress API backend (no change needed)
4. **Monitor Image Optimization usage** - Could be the one area that adds cost
5. **Don't worry about bandwidth** - Your traffic comfortably fits within 1TB even at peak

---

## Sources

- [Vercel Pricing Page](https://vercel.com/pricing)
- [Vercel Pro Plan Docs](https://vercel.com/docs/plans/pro-plan)
- [Vercel Hobby Plan Docs](https://vercel.com/docs/plans/hobby)
- [Vercel Pricing Docs](https://vercel.com/docs/pricing)
- [Vercel Limits](https://vercel.com/docs/limits)
- [Vercel Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines)
