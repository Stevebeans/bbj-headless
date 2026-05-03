# Multi-Show Reality Platform Strategy

**Created:** 2026-04-24
**Status:** Strategic planning — not committed, not scheduled
**Horizon:** 2026 → 2027+

---

## Executive Summary

BBJ is the prototype for a **multi-show reality TV platform** built on a shared Next.js + WordPress architecture. The long-term vision is 3-5 show-specific sites (Big Brother, Survivor, Traitors, Bachelor, etc.) running on a shared codebase, diversifying revenue and smoothing Vercel's seasonal cost curve.

The current Next.js work is **not wasted** even if BBJ pivots to PHP short-term — every feature built here (auth, comments, PWA, ads, admin dashboard, feed updates) is show-agnostic and becomes platform infrastructure for future sites.

---

## The Strategic Problem

### Cost structure pain points

| Problem | Impact |
|---|---|
| Cloudways runs $100/mo year-round regardless of traffic | Fixed floor cost |
| Vercel scales with BB concurrency spikes (projected $300-500/mo at BB28 peak) | Variable cost spike |
| Revenue is 100% concentrated in one show | Sept-May is ad-revenue desert |
| Cloudways peaks ($243/mo in Sep 2025) correlate with the one season that earns | Revenue concentration risk |

### The insight

Reality TV has a **staggered calendar**. If you run sites for shows with different seasons, you get:

- Revenue year-round instead of 3-month spikes
- Vercel traffic load spread across months instead of concentrated in BB season
- Shared infrastructure cost amortized across multiple revenue streams

| Show | Peak Months |
|---|---|
| Big Brother | Jun–Sep |
| Survivor | Sep–Dec |
| Traitors | Jan–Mar |
| Bachelor/Bachelorette | Jan–May, Jun–Aug |

At most 2 shows peak simultaneously, and the BB summer peak is offset from most others.

---

## The Strategy (3 Phases)

### Phase 1: Revenue Stabilization (2026, current)

**Goal:** Get BBJ to a stable, profitable state on *either* stack before expanding.

**Options (not mutually exclusive):**
- **A.** Ship PHP rewrite as production frontend — lowest risk, lowest cost ceiling
- **B.** Ship full Next.js as production — higher cost but faster UX, better PWA, push notifications
- **C.** Hybrid: PHP main site + Next.js PWA subdomain — middle ground

**Decision deferred to:** After BB28 (Oct 2026) when we have real peak cost data from either stack.

**Work that compounds regardless of Phase 1 choice:**
- WordPress backend plugin (`bigbrotherjunkies-data`) — used by both stacks
- Database schema (players, seasons, feed updates) — stable
- Auth system (JWT + Google OAuth) — stable
- Ad system (Freestar integration) — stable
- Admin dashboard — stable

### Phase 2: Second-Site Validation (late 2026 → early 2027)

**Goal:** Prove the platform model by launching show #2 at minimum viable quality.

**Candidate:** **Survivor** or **Traitors**
- Survivor has bigger audience but is more crowded (RHAP, etc.)
- Traitors is less saturated, trending, January peak fills BB off-season gap

**Scope (MVP):**
- Homepage with hero post + recent posts
- Post pages with comments
- Basic player/season directory
- Shared login across sites
- Ad slots wired to Freestar

**Explicitly out of scope for MVP:**
- PWA / push notifications (add in Phase 3 if traction)
- Live feed updates (may not apply to all shows)
- Show-specific features (spoiler bars, HoH/PoV boards are BB-specific)

**Success metric:** $200/mo in ad revenue within 6 months of launch. If yes → Phase 3. If no → focus back on BBJ.

### Phase 3: Platform Expansion (2027+)

**Goal:** Scale to 3-5 shows, each generating $300-1000/mo.

**Enabler investments (only if Phase 2 succeeds):**
- Multi-tenant config system (themes, feature flags, nav per show)
- Centralized user account with per-show subscriptions
- Cross-promotion ("You follow BBJ — check out our new Survivor site")
- Unified admin dashboard managing all sites

---

## Architecture

### Domain topology (Phase 2+)

```
bigbrotherjunkies.com          → Next.js tenant: bb
survivorjunkies.com            → Next.js tenant: survivor
traitorsjunkies.com            → Next.js tenant: traitors
                                  ↓ all call
wp.realityjunkies.com          → WordPress multisite (shared)
accounts.realityjunkies.com    → Shared auth + user profile
```

Each show gets its own domain for SEO/branding. All share:
- One Next.js codebase (deployed as separate Vercel projects or as one with tenant routing)
- One WordPress multisite install (or separate installs if multisite gets painful)
- One account system (JWT cookie scoped to `.realityjunkies.com` parent)

### Codebase structure (single-repo, multi-tenant)

```
bbj-app/
├── src/
│   ├── app/              # Next.js routes (mostly shared)
│   ├── components/       # Shared UI components
│   ├── tenants/
│   │   ├── bb/           # BB-specific config, theme, copy, features
│   │   ├── survivor/
│   │   └── traitors/
│   ├── lib/
│   │   └── tenant.js     # Resolves tenant from request hostname
│   └── ...
```

Tenant resolution happens in middleware. Each tenant exports a config object with:
- Brand colors / fonts / logo
- Feature flags (spoiler bar on/off, live feed on/off)
- Nav structure
- WordPress site ID (for multisite) or API base URL
- Ad slot IDs (separate Freestar zones per show)

### WordPress backend strategy

**Option A: WordPress multisite** *(recommended)*
- One WP install, many subsites
- Shared plugin code, shared users (or per-site users)
- One Cloudways plan for now
- Pro: single codebase to maintain, cheaper hosting
- Con: multisite can get gnarly, migration later is painful

**Option B: Separate WP installs per show**
- Full isolation, easier to sell/sunset one site
- Each site needs its own Cloudways plan (~$100/mo/site)
- Pro: clean separation
- Con: 3x hosting cost at scale, 3x plugin deployments

**Lean toward A for Phase 2. Reevaluate at Phase 3 if multisite becomes a bottleneck.**

---

## Economics

### Phase 1 (single site, BBJ only)

| Stack | Off-season /mo | BB28 Peak /mo |
|---|---|---|
| Full PHP | $100 | ~$243 |
| Full Next.js | $159 | $343-600 |
| Hybrid (PHP + PWA) | $115-125 | ~$140-180 |

### Phase 2 (BBJ + show #2, assume Next.js)

| Line item | Off-season /mo | Peak (overlapping) /mo |
|---|---|---|
| Cloudways (WP multisite) | $100 | $150 (bump plan during peak) |
| Vercel BBJ tenant | $59 | $300-500 (BB season) |
| Vercel show #2 tenant | $30-60 | $150-300 (its season) |
| **Total (no-overlap month)** | **$190-220** | **$450-750** |
| **Total (overlap month, e.g. Aug when BB + early Survivor)** | — | **$600-950** |

### Revenue model

**Conservative Freestar CPM assumption:** $3 RPM on site content, 2x pageviews per visit.

| Site | DAU (off-season) | DAU (peak) | Est. monthly revenue (off-season / peak) |
|---|---|---|---|
| BBJ | 120 | 30,000 | $22 / $5,400 |
| Show #2 | 60 | 10,000 | $11 / $1,800 |
| Show #3 | 50 | 8,000 | $9 / $1,440 |

Even with pessimistic off-season numbers, **peak revenue across multiple shows dwarfs infrastructure cost**. The real question isn't whether the math works — it's whether you can build an audience for show #2 fast enough to justify the engineering time.

---

## What This Means for Current Work

### Features being built *right now* in bbj-app that compound across future sites

✅ Comment system with mentions, notifications, reactions
✅ JWT + Google OAuth auth
✅ Admin dashboard pattern
✅ Ad system (Freestar integration)
✅ Skeleton loading, error boundaries, performance baselines
✅ PWA shell (when built)
✅ Push notification infrastructure (when built)
✅ SEO patterns (JSON-LD, metadata, sitemap)

### BB-specific features that *don't* transfer directly

⚠️ Spoiler bar (concept transfers, UI doesn't)
⚠️ Houseboard (HoH/PoV/Nominees) — BB-specific game mechanic
⚠️ Live feed updates (only Paramount+ subscribers for BB)
⚠️ BB-specific player status taxonomy (Have-Not, etc.)

These should stay in a `tenants/bb/` namespace when refactoring for multi-tenancy.

### Technical decisions to make Phase 2 easier

1. **Keep show-specific logic isolated.** When you find yourself hardcoding "BB" anywhere outside `tenants/bb/`, refactor.
2. **Resist over-abstracting too early.** Don't build the multi-tenant system until show #2 is actually planned. YAGNI.
3. **Make the WordPress plugin site-agnostic where possible.** Custom post types should be configurable, not hardcoded.
4. **Brand tokens in one file.** Colors, fonts, logo path — if these live in `tenants/bb/config.js` now, cloning to show #2 is a file copy.

---

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Show #2 fails to gain traction → wasted Vercel project | MVP is 3-4 weeks of work, not a year. Small bet. |
| Multisite WordPress becomes unmaintainable | Pre-commit to Option B (separate installs) if pain > 2 months |
| Ad network (Freestar) disapproves non-BB sites | Pre-clear with account manager before committing engineering |
| Two sites at peak overwhelm single WP backend | Cloudways plan is upgradeable; serverless WP (Pressable, WP Engine) is fallback |
| Content treadmill — need writers for 2+ sites | Partner with existing creators, AI-assisted drafts for news aggregation, or focus on recaps vs. original reporting |
| Competitors in Survivor/Traitors space | Differentiation = the community/comment system BBJ has invested heavily in |

---

## Decision Checkpoints

| Date | Question | Go/no-go trigger |
|---|---|---|
| Oct 2026 (post-BB28) | Did full Next.js stay under $600/mo at peak? | If yes → commit to Next.js for Phase 2. If no → hybrid or PHP-first. |
| Jan 2027 | Did BB28 off-season revenue clear $300/mo consistently? | Single site profitable → greenlight show #2 MVP work |
| Jul 2027 | Did show #2 launch clear $200/mo within 6 months? | Yes → Phase 3 multi-tenant infrastructure. No → pause expansion, double down on BBJ. |

---

## Not This Project

Explicitly out of scope for this strategy:
- Podcast / YouTube expansion
- Merch, memberships, or subscription revenue
- Original content production (scripted recaps, interviews)
- Mobile-native apps (React Native, Swift/Kotlin)

All of these are worth considering later but would dilute focus during the platform-validation phase.

---

## TL;DR

1. BBJ is the prototype. Every feature built here is platform infrastructure.
2. Ship Phase 1 (pick a stack, stabilize revenue) before anything else.
3. Show #2 in late 2026 / early 2027 is the real unlock for cost math and revenue diversification.
4. Full Next.js only becomes economically obvious *after* there are multiple sites sharing the infrastructure cost.
5. The hybrid (PHP + Next.js PWA) is the cheapest Phase 1 answer; the multi-show Next.js platform is the biggest Phase 3 upside. Both are valid — just know which phase you're optimizing for.
