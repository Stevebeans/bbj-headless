# BBJ Site Merger Strategy — WordPress to Next.js

**Created:** April 4, 2026
**Goal:** Gradually migrate users from `www.bigbrotherjunkies.com` (WordPress) to the new Next.js site (Vercel) without any hard cutover or risk of downtime during BB28 season.

---

## The Problem

The current WordPress site at `www.bigbrotherjunkies.com` works fine. It handles BB season traffic (2-3k concurrent on Thursday nights). But it's doing everything — rendering, serving, auth, comments, ads — all on one Cloudways server.

The Next.js app on Vercel would offload all frontend rendering to a global CDN with static pages, dramatically reducing server load. But we can't risk a hard cutover during peak season with unknown Vercel usage costs.

## The Strategy: Hard Cutover

~~Originally planned a gradual opt-in migration, but decided against it (April 4, 2026).~~

**Decision:** Hard cutover during off-season. WordPress mobile performance is 19 (LCP 24.9s). Next.js even with ads is 45 (LCP 4.4s). No point keeping the slow site live when the new one is already better. Off-season traffic is low-risk, and months of real usage before BB28 premiere is more valuable than a cautious rollout.

**SEO motivation:** Currently #2 for "Big Brother Spoilers" (behind Reddit), bottom of page 2 for "Big Brother 27". Google's Core Web Vitals ranking factor means the performance jump alone could push rankings. Fresh BB28 content posted early builds topical authority before major outlets start covering.

### DNS Changes (Cutover Day)

| Subdomain                       | Points To             | Purpose                    |
| ------------------------------- | --------------------- | -------------------------- |
| `www.bigbrotherjunkies.com`     | Vercel (Next.js)      | Main site (NEW)            |
| `wp.bigbrotherjunkies.com`      | Cloudways (WordPress) | Admin + API only (NEW)     |
| `stg-wp.bigbrotherjunkies.com`  | Cloudways staging     | Staging WP backend         |
| `staging.bigbrotherjunkies.com` | Vercel preview        | Dev/QA testing             |

### Post-Cutover Content Plan

Drive real traffic to test the full stack before BB28:
- Post BB28 speculation/rumors articles, share on Facebook
- Test email subscription flow with real signups
- Test comment system, ads, login under real conditions
- Monitor Vercel usage, PageSpeed, and Search Console weekly
- Build topical authority for BB28 keywords before premiere

---

## Features That MUST Work on New Site Before Any Migration

These are non-negotiable. Users switching over must have feature parity or better.

### Comment System (DONE - carry over as-is)

The new comment system is significantly better than WordPress's native comments:

- Threaded replies (3 levels)
- @mentions with autocomplete
- Emoji reactions
- Staff picks / pinned comments
- Voting (upvote/downvote)
- Media attachments (image upload + Giphy)
- Comment permalinks with highlight
- Notifications (replies, mentions, thread subscriptions)
- User profiles with comment history
- Gamification (rank system: Newbie to Legend)
- Online status indicator

This is a major upgrade and a selling point for the new site.

### Auth System (DONE)

- Email/password login
- Google OAuth
- JWT-based, works across both sites since both talk to same WP backend
- Password reset flow
- Remember me

### Ad System (NEEDS ATTENTION)

**Current state:** Both sites CAN run ads, but there are domain considerations.

- Freestar publisher ID is hardcoded to `bigbrotherjunkies-com` in the Next.js app
- Freestar SDK URL includes domain: `a.pub.network/bigbrotherjunkies-com/pubfig.min.js`
- Placement names all prefixed with `bigbrotherjunkies_`
- The WordPress site has its own ad rendering (PHP/HTML based)
- The Next.js site uses `FreestarSlot` React component + raw HTML from WP API

**Key question:** Does Freestar care about the serving domain? If `new.bigbrotherjunkies.com` serves the same Freestar tags, will impressions count? Need to check with Freestar or test on staging.

**Options:**

1. **Same Freestar account for both** — both sites report to same publisher. Simple, but can't differentiate revenue between old/new site
2. **Separate Freestar setup for new domain** — need new publisher ID, new placements. More work but cleaner analytics
3. **Ask Freestar to add subdomain** — they may just whitelist `new.bigbrotherjunkies.com` under the existing account

**Recommendation:** Contact Freestar and ask if the existing tags work on a subdomain. If yes, option 1 is zero work. If not, option 3 is likely a quick ask on their end.

### Spoiler Bar (DONE)

- Pulls from same WP API
- Shows player statuses for current season

### Feed Updates (DONE)

- Live feed posting
- Voting
- Comments on feed updates

### Blog Posts (DONE)

- Full post rendering
- Featured images
- Category pages
- SEO meta tags + JSON-LD structured data

### Cache Revalidation (JUST ADDED - April 2026)

- WordPress fires webhook to Vercel on post publish
- Home page, post pages, and feed updates auto-refresh
- Secret configured on staging WP + Vercel

---

## Cost Safety

- Vercel Pro: $20/month, includes 1TB bandwidth + 1M function invocations
- Static pages (majority of traffic) = bandwidth only, no function costs
- Set a **spending limit** on Vercel to cap overage charges
- Monitor usage dashboard during first week of season
- Worst case: remove redirect, users go back to WordPress. Zero downtime.

---

## WordPress Plugin Transition

Full audit: `.claude/projects/php-plugins.md`

### Scrap Immediately (after building replacements)

| Plugin Suite | # Plugins | Replaced By | What's Needed |
|-------------|-----------|-------------|---------------|
| **wpDiscuz** (+ 7 addons) | 8 | New comment system (bbjd plugin + Next.js) | Embed React comment widget on WP theme OR wait for cutover |
| **Advanced Ads** (+ 3 addons) | 4 | bbjd plugin ad system | **Can't scrap yet** — WP theme uses `the_ad_placement()` to serve Freestar tags. Advanced Ads is the middleman. Scrap after full cutover when WP is API-only. |
| **MemberPress** | 1 | bbjd billing (Stripe + PayPal) | Already built and deployed |

### Scrap After Full Cutover (WP no longer serves frontend)

| Plugin | Replaced By |
|--------|-------------|
| All in One SEO (+ Pro) | Next.js meta tags + JSON-LD |
| Asset CleanUp | Not needed — WP is API-only |
| Kadence Blocks (+ Pro) | Not needed — no WP frontend pages |
| ProfilePress | Next.js user profiles |
| 301 Redirects | Vercel/next.config.js redirects |

### Scrap When Contact/Newsletter Forms Are Rebuilt

| Plugin Suite | # Plugins | What It Currently Handles |
|-------------|-----------|--------------------------|
| **Formidable Forms** (+ 9 addons) | 10 | Contact form, feed update form, newsletter signup, supporter payments, surveys |

Formidable is used for: feed update posting (replaced by bbjd API), newsletter signup (wire to MailPoet directly), contact form (build in Next.js), payment forms (replaced by bbjd billing). All replacements exist or are trivial.

### Delete Now (Already Inactive)

9 plugins sitting inactive: Ad Inserter Pro, Enable CORS, EWWW Image Optimizer, jQuery Updater, MemberPress Math CAPTCHA, REST API Auth, Site Kit, W3 Total Cache, WP Migrate (x2). Safe to delete.

### The wpDiscuz Question

This is the big one. Scrapping wpDiscuz (8 plugins) is high-value but requires the new comment system to work on the WordPress theme during the transition period.

**Options:**

1. **React widget embed on WP theme** — Build a standalone React bundle of the comment system. Add a `<div id="bbj-comments">` to the WP single post template. Load the React bundle. It talks to the same bbjd REST API. Users get the new comment experience on BOTH sites during transition.

2. **Wait for cutover** — Keep wpDiscuz on WP until the full DNS switch. New comments only on Next.js. Downside: maintaining two comment systems during transition.

3. **Simple PHP/JS comments on WP** — Build a lightweight vanilla JS comment UI on the WP theme that talks to the bbjd comment API. Less feature-rich than the React version but scraps wpDiscuz sooner.

**Recommendation:** Option 1. A React widget embed is the cleanest path. The comment components already exist — we'd just build them as a standalone bundle that can mount on any page. This also lets you launch the new comments on www BEFORE the full site migration, which is a win for users and lets you test the comment system at scale.

### Google Login on WordPress

To encourage logins (which drives the merger strategy), add Google OAuth to the WordPress login/registration:
- The bbjd plugin already has the Google auth endpoint (`/bbjd/v1/auth/google`)
- Add a "Sign in with Google" button to the WP login page and comment form
- Users who log in via Google on WP will seamlessly work on the Next.js site too (same JWT system)
- This builds the logged-in user base BEFORE the migration begins

---

## Still Needs Building Before Migration

| Feature                             | Status         | Priority                            |
| ----------------------------------- | -------------- | ----------------------------------- |
| Player directory + profiles         | Partial        | High — fans use these during season |
| Season directory + profiles         | Partial        | High                                |
| Feed Updates hub page               | Placeholder    | High — core BB season feature       |
| PWA / push notifications            | Not started    | Medium                              |
| Search                              | Working        | Done                                |
| Email subscriptions (Mailpoet)      | Not started    | Medium                              |
| "Switch back to classic" on Next.js | Not started    | Required for merger                 |
| `new.bigbrotherjunkies.com` DNS     | Not configured | Required for merger                 |
| Freestar ad domain verification     | Not checked    | Required for merger                 |

---

## Analytics: Track WordPress vs Next.js Traffic

**GA4 Property:** `G-1Q771W4ZV2`
**Status:** Already loading on BOTH sites (injected via bbjd ad settings header code)

Both sites report to the same GA4 property. You can filter by hostname in GA4 reports, but a custom dimension makes it much easier.

### Add Custom Dimension: `site_version`

**On WordPress** (in theme `header.php` or via `HeaderFooterCode` hook, AFTER the existing gtag config):
```javascript
gtag('set', { 'site_version': 'wordpress' });
```

**On Next.js** (in `src/app/layout.jsx`, in the gtag inline script after `gtag('config', ...)`):
```javascript
gtag('set', { 'site_version': 'nextjs' });
```

**In GA4 Admin:**
1. Go to Admin → Custom Definitions → Create Custom Dimension
2. Dimension name: `Site Version`
3. Scope: Event
4. Event parameter: `site_version`

This lets you filter ANY GA4 report by which site users are on. During the merger, you'll see the split in real-time: how many sessions on WordPress vs Next.js, which pages they visit, bounce rates, etc.

### Additional Tracking for Merger

Consider also tracking these events during the transition:
- `site_switch` — when a user clicks "Try the new BBJ" or "Switch back to classic"
- `google_link` — when a user links their Google account on WordPress

---

## Handoff: Tasks for WordPress/PHP Claude

**Reference files the WP Claude should read:**
- `C:\xampp\htdocs\bbj-app\.claude\projects\merger-notes.md` (this file)
- `C:\xampp\htdocs\bbj-app\.claude\projects\php-plugins.md` (plugin audit)

### Task 1: Google OAuth on WordPress Login (Small, do first)

Add "Sign in with Google" to the WordPress frontend. The backend already exists.

- **API endpoint:** `POST /bbjd/v1/auth/google` (in `bigbrotherjunkies-data/src/Auth/`)
- **Google Client ID:** Check `.env.local` in bbj-app for `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- **What to build:**
  1. Add Google Identity Services script to WP theme header
  2. "Sign in with Google" button on the WP login page (alongside existing email/password)
  3. "Link Google Account" button on user profile/settings page for existing users
  4. Optionally: Google sign-in on the comment form for anonymous users
- **The JWT system is shared** — tokens from Google login work on both WP and Next.js sites

### Task 2: GA4 Site Version Dimension (Tiny, do with Task 1)

Add `gtag('set', { 'site_version': 'wordpress' });` after the existing gtag config on the WP frontend. See analytics section above for full details.

### Task 3: New Comment System on WordPress (Big, do after Tasks 1-2)

Replace wpDiscuz with the new bbjd comment system on the WP theme. This scraps 8 plugins.

- **Comment API endpoints:** All in `bigbrotherjunkies-data/src/Api/CommentRoutes.php`
- **Approach options:**
  1. **React widget embed** (recommended) — Bundle the Next.js comment components as a standalone script, mount on `<div id="bbj-comments">` in WP's `single.php`
  2. **Vanilla JS** — Lighter, less feature-rich, but simpler to build
- **Key features to include:** Threaded replies, voting, @mentions, reactions, lazy loading
- **Auth integration:** Use the JWT from Google/email login. Show login prompt for anonymous users.
- **Data:** Uses `bbj_comments` table + related tables (reactions, mentions, etc.), NOT the wp_comments table that wpDiscuz uses
- **After deployment:** Deactivate wpDiscuz + 7 addon plugins

### Task 4: Delete Inactive Plugins (Trivial, do anytime)

9 inactive plugins can be deleted immediately: Ad Inserter Pro, Enable CORS, EWWW Image Optimizer, jQuery Updater, MemberPress Math CAPTCHA, REST API Auth, Site Kit, W3 Total Cache, WP Migrate (x2). See `php-plugins.md` for full list.

---

## Timeline

| When                      | What                                                                  |
| ------------------------- | --------------------------------------------------------------------- |
| April-May 2026            | Finish remaining pages, test on staging                               |
| June 2026                 | Set up `new.bigbrotherjunkies.com`, test ads, deploy Phase 1 redirect |
| Early July (pre-BB28)     | Phase 1 live — supporters only                                        |
| BB28 premiere week        | Monitor, expand to Phase 2 if stable                                  |
| Mid-season                | Phase 3 — opt-in banner for everyone                                  |
| Post-season or when ready | Phase 4 — full cutover                                                |
