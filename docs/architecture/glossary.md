# BBJ Glossary

Plain-English entries, one per concept, each linking to the chapter that teaches it in context. Grows as chapters land.

---

**App Router** — Next.js routing where folders under `src/app/` ARE the URLs: `app/directory/page.jsx` = `/directory`, `[slug]` folders = dynamic segments. Layouts nest around pages automatically. *(Ch. 00)*

**bbjdFetch / wpFetch** — this repo's server-side data clients (`src/lib/api/wordpress.js`). `wpFetch` is a `fetch()` to WordPress with the caching options baked in (`tags`, `revalidate: false`); `bbjdFetch` just prefixes `/bbjd/v1`. If a server component needs WP data, it goes through these. *(Ch. 01)*

**cache tag** — a label attached to a cached fetch (`tags: ["posts"]`) so it can be invalidated by name later with `revalidateTag("posts")` — without knowing which pages used it. The site's freshness mechanism. *(Ch. 01)*

**client component / client island** — a component whose file starts with `"use client"`. Ships JS to the browser, may use state/effects/cookies. Everything personal on BBJ (auth, ads, comments) is a client island floating in server-rendered HTML. *(Ch. 00, 01)*

**Data Cache** — Vercel's server-side cache of `fetch()` responses, keyed by URL. Not the browser cache, not the CDN. `revalidate: false` = keep until a tag kills it. *(Ch. 01)*

**dynamic rendering** — the mode Next drops a route into when it detects per-request data (like `cookies()`) in a server component: every view renders fresh, nothing caches. On this site that's a cost bug, not a feature — the root layout has a comment forbidding it. *(Ch. 01)*

**edge cache** — Cloudflare's copy of whole HTML pages, served from datacenters near the reader. Homepage/live-feeds: 10-min TTL; content archive: 30-day TTL. The reason most pageviews cost ~nothing. *(Ch. 00, 01)*

**headless (WordPress)** — WP used purely as database + admin + JSON API (`wp.bigbrotherjunkies.com/wp-json/bbjd/v1/*`). No WP theme renders anything a visitor sees; Next.js does all rendering. *(Ch. 00)*

**hydration** — after cached HTML paints, React downloads the client components' JS and "attaches" it to the existing markup, making it interactive. The gap between paint and hydration is where every flash-of-wrong-state bug lives. *(Ch. 01; case study in 04)*

**ISR (Incremental Static Regeneration)** — Next's "render once, cache, refresh later" system. BBJ uses the tag-driven flavor exclusively: `revalidate: false` + webhook invalidation, never timers. *(Ch. 00, 01)*

**middleware matcher** — the config in `src/middleware.js` listing which paths run middleware. Kept to admin/protected routes ONLY, because cookie-reading middleware makes responses uncacheable. *(Ch. 01)*

**purge-on-edit** — the freshness strategy: saving content in WP fires a webhook → `/api/revalidate` → kills the right Vercel tags + targeted-purges the changed URLs on Cloudflare. Freshness is *pushed* by edits, never *polled* by timers. *(Ch. 00, 01)*

**revalidateTag** — the Next function (`next/cache`) that invalidates every cached fetch carrying a given tag. Called only from `src/app/api/revalidate/route.js`. *(Ch. 01)*

**route handler** — an API endpoint inside the Next app: a `route.js` exporting `GET`/`POST` instead of a React component. BBJ's main one is `/api/revalidate`. *(Ch. 01)*

**server component** — the App Router default: renders on the server, can be `async`, ships no JS of its own. Pages and layouts here are server components; their HTML is what Cloudflare caches. *(Ch. 01)*
