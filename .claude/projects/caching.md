# Cloudflare Cache Rule — bigbrotherjunkies.com

Reference doc for the Cache Rule expression. Copy from this file (not from chat) so line breaks don't get pasted into the expression editor.

## Rule name

```
Cache HTML pages
```

## Expression (copy this whole line — it's intentionally on one line)

```
(not starts_with(http.request.uri.path, "/api/")) and (not starts_with(http.request.uri.path, "/admin")) and (not starts_with(http.request.uri.path, "/editor")) and (not starts_with(http.request.uri.path, "/login")) and (not starts_with(http.request.uri.path, "/settings")) and (not starts_with(http.request.uri.path, "/notifications")) and (not starts_with(http.request.uri.path, "/checkout")) and (not starts_with(http.request.uri.path, "/feed")) and (not starts_with(http.request.uri.path, "/preview"))
```

## Action settings

| Setting | Value |
|---|---|
| Cache eligibility | Eligible for cache |
| Edge TTL | Ignore cache-control header and use this TTL → **4 hours** |
| Browser TTL | Respect origin TTL (default) |

## Excluded paths (will NOT be cached)

- `/api/*` — API routes (revalidate webhook, AI generators, admin proxy)
- `/admin*` — admin dashboard
- `/editor*` — editor pages
- `/login*` — login page
- `/settings*` — user settings
- `/notifications*` — notifications
- `/checkout*` — checkout flow (Stripe/PayPal)
- `/feed*` — RSS feed (auth-sensitive content)
- `/preview*` — draft preview routes

## Why "Ignore cache-control header"

Next.js sends `Cache-Control: private, no-cache` on HTML responses by default. We need Cloudflare to ignore that and cache anyway, otherwise the rule does nothing.

## Verify

1. Open incognito → visit a post URL
2. DevTools → Network → click page request → Response Headers
3. Refresh once
4. Look for `cf-cache-status: HIT` on second load
