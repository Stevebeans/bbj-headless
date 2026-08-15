# 01 — Life of a Pageview

*Verified against commit `de29d15` (2026-08-15)*

## The question

**How does the homepage reach a reader for a tenth of a cent — and still show a feed update posted three minutes ago?**

## The trace

A reader taps `bigbrotherjunkies.com`. Follow the request.

### 1. Cloudflare answers first (and usually last)

DNS for the apex is a **proxied** CNAME to Vercel — traffic physically enters Cloudflare's edge. A CF Cache Rule holds the homepage for **10 minutes** and content pages for **30 days**. On a hit, the reader gets HTML from a datacenter near them and *nothing below this line runs*. During the season, that's the overwhelming majority of requests.

> **Sidebar — why 30 days doesn't mean 30-days-stale:** cache lifetime is a *ceiling*, not a promise to serve stale. Edits punch out specific URLs immediately (step 6). Long TTL just means "if nobody edits it, don't re-render it."

### 2. The miss lands on Vercel — but middleware mostly stays out of the way

On a miss, the request reaches the Next app. First possible interceptor: `src/middleware.js`. Open it — the `matcher` (`src/middleware.js:36-55`) lists ONLY `/admin`, `/settings`, `/editor`, `/notifications`, edit routes, and WP attack-probe paths (`/wp-login.php` etc., 404'd instantly to save function invocations).

The homepage is **deliberately not matched**. The comment at `src/middleware.js:38-44` says why: middleware that reads `request.cookies` stamps the response `private, no-store` — which would make every public page uncacheable. One innocent-looking `matcher: "/(.*)"` here would undo the entire cost architecture. This file is a landmine map, not a router.

### 3. The layout renders — the shell every page shares

App Router composes the page from nested files. `src/app/layout.jsx` is an **async server component** — it runs on the server, is allowed to `await`, and ships zero JS for itself to the browser.

- `RootLayout` (`src/app/layout.jsx:133`) fetches three site-wide things in parallel via `Promise.all` (`:143-149`): ad scripts, ad settings, and the active live thread. All are `revalidate: false` + tagged.
- The forbidden-fruit comment (`:134-142`): no `cookies()`/`headers()` here, ever — that would flip the *entire route tree* to dynamic rendering. And never a time-based `revalidate` on a layout fetch: Next takes the **lowest** revalidate in a route segment, so a `60` here would floor every page on the site to 60-second re-renders. That exact landmine — a 60s default inside `wpFetch` — caused the June Vercel bill spike.
- The JSX (`:166+`) is your `<AppContainer>` from the brief, as real code: `<html>` → `<head>` with `ThemeScript` + `AdGateScript` (blocking inline scripts that run before paint — chapter 04) → `<body>` → `<Providers>` (client contexts) → `<TopLeaderboard/>`, `<Header/>`, `{children}`, `<Footer/>`, `<BeanLauncher/>`, `<FreestarSDKLoader/>`.

> **Sidebar — server vs client components:** everything in `src/app/**` is a *server* component unless a file opens with `"use client"`. Server components run only on the server; their output is HTML plus a compact payload. Client components also render on the server once (for the initial HTML!) but then *hydrate* — their JS ships to the browser and React attaches interactivity. The rule of thumb in this repo: pages and layouts are server; anything with `useState`/`useEffect`/cookies is client.

### 4. The page renders — one fetch, seven sections

`src/app/page.jsx` fills the `{children}` slot for `/`:

- `HomePage` (`src/app/page.jsx:70`) awaits `getHomepageData()` — a **single** aggregated API call instead of seven separate ones.
- `generateMetadata` (`:59`) awaits the *same* call to build the `<title>`/OG tags. Two awaits, one request — Next dedupes identical fetches within a render.
- The rest of the file is assembling `Hero`, `LiveFeedUpdates`, `MoreStories`, `SeasonStats` etc. (imported at `:6-14`) plus a JSON-LD `@graph` (`:90+`) for SEO. Note `deriveSeason()` (`:25`) — the season number for the H1 is *derived from the data*, so a new season updates the homepage title with zero code changes.

### 5. The data call — where requests leave the building

`getHomepageData()` (`src/lib/api/home.js:20`) calls `bbjdFetch("/homepage?v=2", { tags: [...], revalidate: false })`. Peel the wrapper open:

- `bbjdFetch` → `wpFetch` (`src/lib/api/wordpress.js:20`) → a plain `fetch()` to `https://wp.bigbrotherjunkies.com/wp-json/bbjd/v1/homepage`.
- The magic is the `next:` option (`:28-31`): `tags: ["hero-post", "posts", "feed-updates", ...]` and `revalidate: false`. Translation to Next: *"cache this response forever, but remember these tag names — someone may invalidate them later."* This is the entire ISR strategy in one object literal.
- Server-side WP answers it. The plugin's `HomeRoutes.php` (WP repo, `src/Api/`) does the heavy MySQL lifting once; Vercel then holds the JSON until a tag purge.
- `home.js:6-15` keeps a `DEFAULTS` block so a WP hiccup renders an empty-but-alive homepage instead of a 500.

> **Sidebar — the `fetch` cache is Next's, not the browser's:** this `fetch` runs on Vercel's servers. Its cache is Vercel's Data Cache, keyed by URL. That's also why `?v=2` exists (`wordpress.js:18`) — bumping the version string changes the key, abandoning a poisoned upstream cache entry we couldn't purge.

### 6. Freshness: the webhook punch-out

You publish a post in WP. The plugin fires a webhook at `src/app/api/revalidate/route.js` (a **route handler** — an API endpoint living inside the app). It checks a shared secret, then `revalidateTag("posts")` etc. (`route.js:30,55-65`), and calls `purgeCloudflare([...])` for the affected URLs. Vercel's tagged entries die instantly; Cloudflare's copies of the changed page + homepage are purged; the next reader triggers exactly ONE re-render, which then serves thousands.

That's the answer to the opening question: the feed update from three minutes ago is there because its publish *pushed* the caches out — not because anything polls or re-renders on a timer.

### 7. Meanwhile, in the browser

The reader has HTML in ~30ms. Then the client layer wakes: `ThemeScript`/`AdGateScript` already ran before paint (dark mode, supporter ad gate), React hydrates the `"use client"` islands, `AuthContext` reads cookies and flips the header from "Login" to the avatar, ad slots fill (or don't). All personal, all browser-side, all AFTER the cached HTML painted. Chapters 02 and 04 live here.

## Why it's built this way

Short version: **the architecture is a scar.** At near-zero off-season traffic the site cost $4+/day because pages re-rendered constantly (the `wpFetch` 60-second default revalidate, layout fetches flooring route segments, bots crawling 17.5K pages through ISR). The fix wasn't a cheaper host — it was making render-work proportional to *edits* instead of *traffic*: CF in front of everything, `revalidate: false` everywhere, webhook purge-on-edit, middleware kept off public pages. The k6 load test (2,000 concurrent users, 100% cache hit, ~$0.05) was the proof, and a 103K-view day on ~$4 was the payoff.

## Poke at it

1. **See the cache layers.** `curl -sI https://bigbrotherjunkies.com/ | grep -iE "cf-cache-status|age"` — run twice. `HIT` + a rising `Age` is Cloudflare doing your job for you. Then try a random old post and see `Age` in the hundreds of thousands of seconds.
2. **Watch the island wake up.** Load the homepage logged in, DevTools → Network → filter `wp-json`. The HTML request contains zero personal data; then you'll see the browser itself call auth/permission endpoints. That waterfall IS the server/client boundary.
3. **Break the layout (locally!).** In your own `npm run dev`, add `import { cookies } from "next/headers"; cookies();` to `RootLayout`, load any page, and read the error/warnings — feel the dynamic-rendering trap fire. Revert.

*Glossary terms added: server component, client component, hydration, revalidateTag, route handler, middleware matcher, Data Cache, cache tag, `wpFetch`/`bbjdFetch`, dynamic rendering.*
