# 00 — Orientation: The Mental Map

_Verified against commit `de29d15` (2026-08-15)_

Before any chapter traces a specific flow, you need the big shape in your head. This is two pages. Read it twice; everything else in this series hangs off it.

## The four boxes

```
 reader's browser
       │
       ▼
 ┌─────────────┐    cache HIT (most requests stop here)
 │ CLOUDFLARE   │──────────────────────────────► HTML back in ~30ms
 │ (edge cache) │
 └──────┬──────┘
        │ cache MISS
        ▼
 ┌─────────────┐    Vercel's own cache may also answer here
 │ VERCEL       │
 │ (Next.js)    │──── server components render the page
 └──────┬──────┘
        │ needs data
        ▼
 ┌─────────────┐
 │ WORDPRESS    │    wp.bigbrotherjunkies.com — a pure JSON API.
 │ (headless)   │    Renders NOTHING. It's the database + admin + REST routes.
 └──────┬──────┘
        ▼
   MySQL + Redis (Cloudways box, 104.236.65.203)
```

- **Cloudflare** owns the domain's DNS and sits in front of the apex. Content pages are edge-cached for **30 days**; the homepage and `/live-feed-updates/*` for **10 minutes**. Most readers never touch Vercel at all. This is the entire cost architecture — the site survived a 103K-view day on ~$4 of hosting because of this box.
- **Vercel** runs the Next.js app (project name: `bbj-next`, repo: `bbj-app`). It renders pages with **React Server Components** and caches the results itself (ISR). It only works on a Cloudflare miss.
- **WordPress** lives on `wp.bigbrotherjunkies.com` — a subdomain Cloudflare does NOT proxy. You write posts there; the custom plugin (`bigbrotherjunkies-data`) exposes everything as REST endpoints under `/wp-json/bbjd/v1/*`. No theme renders anything for visitors.
- **Staging** mirrors this: `staging.bigbrotherjunkies.com` (Vercel preview, built from the `staging` branch) → `stg-wp.bigbrotherjunkies.com` (second WP app, same server).

## The one load-bearing idea

> **The HTML is identical for every visitor. Everything personal happens in the browser afterward.**

If you internalize a single sentence from this whole series, make it that one. Consequences:

1. **Caching works at all.** Cloudflare can hand the same homepage to 24,000 people because the server never bakes "Welcome, Steve" into it. The moment a server-rendered page reads a cookie, it becomes uncacheable — that's why `RootLayout` has a shouting comment forbidding `cookies()` (`src/app/layout.jsx:134`).
2. **Login, ads, comments, DMs are "client islands."** Components marked `"use client"` boot in the browser, read cookies there, and fetch personal data with the reader's own credentials. The server never knows who's reading.
3. **Every "why does X flash on load?" bug lives at this boundary.** The anonymous-looking HTML paints first; the personal layer catches up milliseconds later. When the catch-up loses a race, a paying supporter sees ads (chapter 04's case study — a real bug we shipped a fix for on 2026-08-13).

## Freshness without re-rendering

Pages cache "forever" (`revalidate: false`), so how does new content appear? **Purge-on-edit:** when you save a post in WP, a webhook calls `/api/revalidate` on the Next app, which invalidates the right cache _tags_ on Vercel and targeted-purges the affected URLs on Cloudflare. Fresh content in seconds, zero background re-render churn. Chapter 01 traces it.

## Where things live

| Thing               | Place                                                                                            |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| Pages & routing     | `src/app/**` (App Router — folder = URL)                                                         |
| Reusable UI         | `src/components/**`                                                                              |
| Data clients        | `src/lib/api/**` (`wpFetch` family for server; `adminFetch` etc. for client)                     |
| React contexts      | `src/context/` (Auth, Ad, AuthModal)                                                             |
| Hooks               | `src/hooks/`                                                                                     |
| Edge middleware     | `src/middleware.js` (admin/editor routes ONLY — on purpose)                                      |
| WP plugin (the API) | `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\` — routes in `src/Api/*.php` |

## Your index-page question, answered

You asked if the index is shaped like `<AppContainer><Header/><Page/><Footer/></AppContainer>`. Close — App Router does it with **nested files instead of one wrapper component**: `src/app/layout.jsx` renders `<html><body><Providers><Header/>{children}<Footer/></Providers></body></html>`, and whatever `page.jsx` matches the URL becomes `{children}`. The layout renders ONCE and persists across client-side navigation; only the page slot swaps. Chapter 01 walks the real file.

_Glossary terms added: headless, App Router, edge cache, ISR, purge-on-edit, client island._
