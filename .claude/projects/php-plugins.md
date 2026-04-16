# WordPress Plugin Audit

**Last Updated:** April 4, 2026
**Goal:** Scrap as many plugins as possible during the Next.js merger transition.

## Active Plugins

| Plugin                             | What It Does                 | Verdict             | Notes                                                                                                                              |
| ---------------------------------- | ---------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **301 Redirects**                  | Manages redirect rules       | SCRAP after cutover | Vercel/Next.js handles redirects via `next.config.js`. Keep until full DNS cutover.                                                |
| **Advanced Ads**                   | Ad management                | SCRAP after cutover | Still serving Freestar ads on WP frontend via `the_ad_placement()`. bbjd ad system only used by Next.js. Keep until WP is API-only. |
| **Advanced Ads Pro**               | Premium ad features          | SCRAP after cutover | Same — needed while WP serves frontend                                                                                             |
| **Advanced Ads – GAM Integration** | Google Ad Manager            | SCRAP after cutover | Same                                                                                                                               |
| **Advanced Ads – AdSense In-feed** | In-feed AdSense              | SCRAP after cutover | Same                                                                                                                               |
| **All in One SEO**                 | SEO meta/sitemaps            | SCRAP after cutover | Next.js handles SEO. Keep on WP until it's no longer the frontend.                                                                 |
| **All in One SEO Pro**             | Premium SEO                  | SCRAP after cutover | Same as above                                                                                                                      |
| **Asset CleanUp**                  | Script/style optimizer       | SCRAP after cutover | Only matters for WP frontend rendering. Not needed when WP is API-only.                                                            |
| **BBJ Tools**                      | Custom BBJ data tools        | KEEP                | Legacy BBJ functionality, still referenced                                                                                         |
| **BBJ v2**                         | BBJ plugin v2                | KEEP (for now)      | Being superseded by bbjd plugin, but still has some active functionality                                                           |
| **Big Brother Junkies Data**       | Core data plugin             | KEEP                | The main plugin — this IS the backend                                                                                              |
| **Breeze**                         | Cloudways cache              | KEEP                | Server-side caching, still helps API response times                                                                                |
| **Crop Thumbnails**                | Image crop UI                | KEEP (for now)      | Used in wp-admin for image management. bbjd has crop API but this is for admin UX.                                                 |
| **Formidable Forms** (+ 9 addons)  | Forms, surveys, registration | SCRAP               | Contact form → Next.js. Feed updates → bbjd API. Newsletter → MailPoet direct. Payments → bbjd billing. See "What To Build" below. |
| **JWT Authentication for WP-API**  | JWT auth for REST            | KEEP                | Critical — Next.js auth depends on this                                                                                            |
| **Kadence Blocks** (+ Pro)         | Gutenberg page builder       | SCRAP after cutover | Only needed for WP frontend pages. Not needed when WP is API-only.                                                                 |
| **Login as User**                  | Admin user switching         | KEEP                | Useful admin/debugging tool                                                                                                        |
| **MailPoet** (+ Premium)           | Email newsletters            | KEEP                | Still the email system. May integrate with Next.js later.                                                                          |
| **MemberPress Basic**              | Membership/payments          | SCRAP               | Replaced by bbjd billing system (Stripe + PayPal)                                                                                  |
| **Meta Box** (+ AIO)               | Custom fields/post types     | KEEP                | Deeply embedded in BBJ theme (34 files). Defines player, season, feed update fields.                                               |
| **ProfilePress**                   | User profiles/registration   | SCRAP after cutover | Replaced by Next.js user profiles + bbjd auth system                                                                               |
| **Query Monitor**                  | Dev tools panel              | KEEP                | Essential debugging tool                                                                                                           |
| **Redis Object Cache**             | Object caching               | KEEP                | Server performance for API responses                                                                                               |
| **Regenerate Thumbnails**          | Rebuild image sizes          | KEEP (utility)      | Occasionally needed for image management                                                                                           |
| **UpdraftPlus**                    | Backups                      | KEEP                | Critical — site backups                                                                                                            |
| **User Role Editor**               | Role management              | KEEP                | Manages custom roles (supporter, updater, etc.)                                                                                    |
| **WP Mail SMTP**                   | Email delivery               | KEEP                | Ensures reliable email sending                                                                                                     |
| **WP-Optimize**                    | DB cleanup/cache             | KEEP (for now)      | Useful for database maintenance. Less critical when API-only.                                                                      |
| **wpDiscuz** (+ 7 addons)          | Comment system               | SCRAP               | Replaced by new comment system in bbjd plugin + Next.js                                                                            |
| **WPGraphQL**                      | GraphQL API                  | EVALUATE            | Currently active but Next.js uses REST. Check if anything depends on it.                                                           |
| **Yoast Duplicate Post**           | Clone posts                  | KEEP                | Useful wp-admin content tool                                                                                                       |

## Inactive Plugins (Safe to Delete)

| Plugin                         | Notes                                                               |
| ------------------------------ | ------------------------------------------------------------------- |
| Ad Inserter Pro                | Replaced by bbjd ads                                                |
| Enable CORS                    | Handled by bbjd plugin                                              |
| EWWW Image Optimizer           | Not in use                                                          |
| jQuery Updater                 | Not needed                                                          |
| MemberPress Math CAPTCHA       | Not in use (MemberPress being scrapped)                             |
| REST API Authentication for WP | JWT handles this                                                    |
| Site Kit by Google             | Not in use, analytics handled by bbjd                               |
| W3 Total Cache                 | Keep as backup cache option but can delete. Breeze handles caching. |
| WP Migrate + Lite              | Migration tools, not needed                                         |

## Summary

| Category                  | Count                                   | Action                                    |
| ------------------------- | --------------------------------------- | ----------------------------------------- |
| **Keep**                  | ~15                                     | Essential for WP backend + admin          |
| **Scrap (can do now)**    | ~8 (wpDiscuz suite, Advanced Ads suite) | Need new comment system on WP theme first |
| **Scrap (after cutover)** | ~8 (SEO, Asset CleanUp, Kadence, etc.)  | Only needed while WP serves frontend      |
| **Delete (inactive)**     | 9                                       | Safe to delete immediately                |
| **Evaluate**              | 1 (WPGraphQL)                           | Check if anything uses it                 |
