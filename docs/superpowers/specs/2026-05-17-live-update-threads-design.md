# Live Update Threads — Design

**Date:** 2026-05-17
**Status:** Approved, pending implementation plan
**Mockups:** `.superpowers/brainstorm/1211-1779065713/content/` (editor-sidebar.html, live-indicators.html, post-page.html)

---

## Problem

Feed updates are the steady drumbeat of BBJ during a season, but they currently only surface in two places: the `/live-feed-updates` archive hub and, for posts that opt in, as a basic embed at the bottom of a daily ramblings article. The embed is styled poorly and the feature isn't promoted anywhere on the site.

For major events (eviction night, finale, comp marathons, premiere), the user wants Al Jazeera-style live-blog coverage: a single post that anchors the event, accepts a continuous stream of timestamped updates, gets surfaced site-wide while active, and becomes a permanent archive once the event ends.

## Goals

- Let the user flip any post into a "live thread" via an editor checkbox, with start/end window controls
- Stream feed updates posted in that window into the thread, rendered as a chronological timeline
- Promote the active live thread site-wide (top strip, homepage banner)
- Preserve the closed thread as a permanent archive of that event
- Differentiate the live-update experience for premium supporters (auto-refresh polling)
- Respect the caching-first architecture — free path stays 100% ISR-cached

## Non-goals (v1)

- AI-generated closing recap (field exists, no auto-population)
- Editor UI to flag individual feed updates as BREAKING (render support only; flag set via DB)
- Push notifications when a thread opens or a BREAKING update lands
- Per-segment grouping on the `/live-feed-updates` hub
- Auto-extending a thread past its `live_end` based on activity

---

## Architecture

### State machine

A post has one of three live-update states. State is **derived**, not stored:

| State | Derivation |
|---|---|
| Not live | `_bbjd_live_updates` meta is `0` or unset |
| Live | `_bbjd_live_updates = 1`, `_bbjd_closed_at` is empty, current time within `[live_start, live_end]` (or `live_end = 0` for continuous), AND post ID matches `bbjd_active_live_thread` global option |
| Closed | `_bbjd_live_updates = 1` AND NOT Live (any of: `_bbjd_closed_at` set, past `live_end`, or no longer matches the global option) |

This three-way check is deliberately defensive — if any single signal drifts (cron miss, race during take-over, manual DB edit), the post is treated as closed rather than ending up in an undefined state.

A shared PHP helper `getLiveState(WP_Post $post): 'none'|'live'|'closed'` is the single source of truth, used by both the API response builder and any server-side rendering.

### Global active-thread invariant

Exactly one (or zero) live threads exist site-wide. Enforced by the WP option `bbjd_active_live_thread` (post ID or null). All mutations to this option go through atomic helpers — never raw `update_option` from request handlers.

Transitions:
- Open: option goes from null → post_id
- Close (manual or end_time elapsed): option goes from post_id → null, `_bbjd_closed_at = now()` stamped on the post
- Take-over (editor enables live on a new post while option is set): option goes from old_id → new_id, `_bbjd_closed_at` stamped on the old post, all in a single transaction

### Data model

**Global WP option:**
- `bbjd_active_live_thread` → int post ID or null

**Per-post meta (on the post that is or was a live thread):**
- `_bbjd_live_updates` → `1` / `0`
- `_bbjd_live_start` → unix timestamp
- `_bbjd_live_end` → unix timestamp; `0` means "continuous until displaced"
- `_bbjd_closed_at` → unix timestamp set when displaced or end_time passes; absence = still live
- `_bbjd_closing_summary` → string, empty for now (AI fills later)

**Per-feed-update meta (new):**
- `_bbjd_breaking` → `1` / `0`; renders the BREAKING tag in the timeline. v1 ships render-only support — the flag is settable via the WP admin / direct DB until the feed-update editor UI lands (Phase 2).

---

## Editor UX (custom editor at `/editor/new` and `/editor/{id}`)

New sidebar block, inserted between the existing "Post Type" and "Featured Image" sections. Yellow border when active, no border when idle. Visual reference: `editor-sidebar.html`.

### Controls

- **Checkbox: "Live Updates"** — toggles `_bbjd_live_updates`
- **Start input** (visible when checkbox checked):
  - Default value: `"On publish (default)"` — resolves to publish timestamp on save
  - `🕛 Day` button: sets to today's midnight (local TZ)
  - `📅` button: opens custom date/time picker
- **End dropdown** (visible when checkbox checked):
  - `End of day (11:59pm)` (default) — resolves to today's 23:59 local TZ
  - `Custom time…` — reveals an inline date/time picker
  - `Continuous (until displaced)` — sets `live_end = 0`
- **LIVE chip** — shown in the block header when state would be "live" on save

### Conflict modal

When the checkbox is toggled on, the editor pings `GET /bbjd/v1/live-thread/current`. If a thread is already active:

> "A live thread is already active: **[Other Post Title]**. Close it and start this thread instead?"
> [Cancel] [Close other thread and start this one]

On confirm, the editor calls `POST /bbjd/v1/live-thread/take-over { new_post_id }`, which atomically closes the old thread and primes the new post to become active on publish. The checkbox stays checked. On cancel, the checkbox flips back off.

### On publish / save

- `_bbjd_live_updates`, `_bbjd_live_start`, `_bbjd_live_end` written to post meta
- If state would be "live" and post is published, `bbjd_active_live_thread` is set to this post ID
- Webhook fires to Next.js: `live-thread-active` tag (top strip needs to update)

---

## Reader-facing rendering

### 1. Top strip (in shared header — `src/components/layout/Header.jsx`)

Currently shows "Watch Feeds | LIVE" linking to Paramount+. Modified:

- Server fetches `getActiveLiveThread()` (cached helper, tagged `live-thread-active`)
- If null: renders existing "Watch Feeds | LIVE" link
- If set: renders "🔴 LIVE: [Thread Title] →" linking to `/{slug}` of the active thread
- No `cookies()`, `headers()`, or per-request fetch — the cache tag does all the work

### 2. Homepage banner (new component)

- `<LiveThreadBanner />` rendered above `<Hero />` in `src/app/page.jsx`
- Server component, reuses the same `getActiveLiveThread()` call
- Returns `null` when no active thread (renders nothing)
- When active: renders a wide promo card with LIVE chip, thread title, latest-update snippet, CTA button

### 3. Post page (`src/app/[slug]/page.jsx`)

Existing post page; only the embedded feed-updates section changes:

- If `content.liveUpdates === true`, render `<LiveUpdateTimeline />` in place of the current `<FeedUpdates />`
- All other post-page concerns (PostHeader, PostHero, body, related posts, comments) unchanged

### 4. `<LiveUpdateTimeline />` component (new)

Visual reference: `post-page.html`.

**Header row:**
- LIVE chip (state=live) or "Closed at [time]" banner (state=closed)
- "Live Updates" title + update count
- Right side: sort toggle (`↑ Oldest first` / `↓ Newest first`, cycles), auto-update toggle (premium-gated with ⭐ icon)

**Timeline body:**
- Vertical line on the left, circular dot per update
- Updates rendered chronologically (or reversed via sort toggle)
- Each update: timestamp + relative time, optional BREAKING tag (when `_bbjd_breaking = 1`), optional title, body content, optional thumbnail
- Newest update (state=live only): pulsing red dot + soft red background tint
- BREAKING update: red dot instead of grey, BREAKING tag rendered above timestamp

**Floating "↓ Latest update" pill:**
- Client component watching scroll position
- Visible only when state=live AND newer updates exist below the viewport
- Clicking scrolls smoothly to the bottom-most update

**Closed-state delta:**
- LIVE chip replaced with closed banner
- Sort toggle and auto-update toggle hidden
- Floating pill hidden
- Otherwise identical rendering — the timeline becomes the permanent archive

### 5. Per-user sort preference

- Sort toggle writes to `localStorage` key `bbjd_live_sort` → `"oldest"` / `"newest"`
- Default: `"oldest"` (chronological top-to-bottom — matches the user's storytelling voice)
- Toggle reverses the rendered array client-side; no server fetch

---

## Premium polling (the live-feel feature)

### Endpoint
`GET /bbjd/v1/live-thread/{post_id}/updates-since?ts={unix}`

- Returns feed-updates whose `update.time > ts` AND that fall in this thread's `[live_start, live_end]` window
- Same item shape as existing `/bbjd/v1/feed-update` response (so the timeline renders them with the same component)
- Auth: Bearer JWT required; handler checks `user.isSupporter` and returns 403 otherwise (anti-abuse — don't let non-supporters bypass via curl)
- **Not edge-cached.** Justified: only premium users hit it, and the whole purpose is freshness. Send `Cache-Control: no-store`.

### Client component: `<LiveUpdatePoller />`

- Initializes only when `state === "live"` AND `user.isSupporter === true`
- Polls `/bbjd/v1/live-thread/{post_id}/updates-since?ts={lastSeen}` every 30 seconds (constant — no backoff in v1; tune after launch if needed)
- `lastSeen` initializes to the timestamp of the newest update server-rendered into the timeline; advances after each successful poll
- Appends new updates to the local timeline state, animates them in
- Auto-update toggle (visible in the timeline header) controls polling on/off — defaults to ON for supporters
- Free users see the toggle but it's disabled with an upsell tooltip ("Premium feature — supporters get auto-updates")
- Stops polling automatically when state transitions to "closed" (detected via the response payload including the current state)

### What free users see
- ISR-cached page with whatever updates existed at last revalidation
- WP fires `live-thread-{post_id}` webhook tag when a new update lands → next page load reflects it
- No client polling, no extra API hits

---

## Caching strategy

Strict adherence to the project's caching-first rule.

### Cache tags

| Tag | Fires when | Invalidates |
|---|---|---|
| `live-thread-active` | Thread opens, closes, or is taken-over | Layout-level `getActiveLiveThread()` cache — every page (intentional, rare events) |
| `live-thread-{post_id}` | New feed-update lands in this thread's window, or thread state changes, or attached update is edited | This post page only |

### Webhook integration

Extends the existing `/api/revalidate` endpoint to accept the new tags. WordPress hooks:

- `transition_post_status` on a post with `_bbjd_live_updates = 1` → fire `live-thread-active`
- `bbjd_active_live_thread` option mutation → fire `live-thread-active`
- New feed-update saved → check if it falls in any live thread's window → if so, fire `live-thread-{post_id}`
- `_bbjd_closed_at` stamped → fire both tags

### Critical caching invariants

- No `cookies()`, `headers()`, or `draftMode()` introduced in `layout.jsx`, `Header.jsx`, or any shared route segment
- The new `getActiveLiveThread()` helper is a plain cached fetch — no request-bound APIs
- Premium polling is the *only* uncached path; free path remains fully ISR
- Cache tags stay narrow (`live-thread-{post_id}` is per-thread, never widened to per-type)

---

## API surfaces (WordPress plugin `bigbrotherjunkies-data`)

### New routes (under `src/Api/`)

| Method + Path | Purpose | Auth |
|---|---|---|
| `GET /bbjd/v1/live-thread/current` | Returns `{ post_id, title, slug, started_at }` or `null` | Public |
| `POST /bbjd/v1/live-thread/take-over` | Atomic close-old + open-new for editor conflict modal | `bbj_admin_permissions` |
| `POST /bbjd/v1/live-thread/{id}/close` | Manually close a thread (no waiting for end_time) | `bbj_admin_permissions` |
| `GET /bbjd/v1/live-thread/{id}/updates-since?ts={unix}` | Premium polling endpoint — filters by `update.time > ts` AND in window | Bearer JWT; handler enforces `user.isSupporter` (403 otherwise) |

### Existing routes — modifications

- `GET /bbjd/v1/feed-update` (create/edit) — on save, identify which (if any) live thread's window the update falls into, attach metadata, fire revalidation tag
- Post fetch endpoint that supplies `/[slug]` data — include `liveUpdates`, `liveState`, `liveStart`, `liveEnd`, `closedAt`, `closingSummary` in response

### Helper

`getLiveState(WP_Post $post): string` — derives state from meta + global option + current time. Used by API response builder, never duplicated.

---

## Frontend file inventory (Next.js — `src/`)

### Modified
- `src/app/[slug]/page.jsx` — conditionally render `<LiveUpdateTimeline />` instead of `<FeedUpdates />` when `content.liveUpdates`
- `src/app/page.jsx` — add `<LiveThreadBanner />` above the hero
- `src/components/layout/Header.jsx` — conditionally render the live-thread strip vs. Watch Feeds strip
- `src/lib/api/wordpress.js` — add `getActiveLiveThread()` cached helper, tagged `live-thread-active`
- `src/lib/api/posts.js` — surface new live-thread fields in the post payload

### New
- `src/components/posts/LiveUpdateTimeline.jsx` — the timeline component
- `src/components/posts/LiveUpdatePoller.jsx` — client-side polling (premium only)
- `src/components/home/LiveThreadBanner.jsx` — homepage banner
- `src/lib/api/liveThread.js` — client/server helpers for the new endpoints

### Removed / superseded
- `src/components/posts/FeedUpdates.jsx` — fully superseded by `<LiveUpdateTimeline />`. Existing posts with the legacy `liveFeedThread` flag get a one-time migration (see Migration below) and render through the new component thereafter.

### Migration (one-time)
- WP plugin activation hook: for any post where the legacy `liveFeedThread` flag is `1`, write `_bbjd_live_updates = 1`, `_bbjd_live_start = strtotime(post_date . ' 00:00')`, `_bbjd_live_end = strtotime(post_date . ' 23:59')`, `_bbjd_closed_at = now()`. Result: each becomes a closed archive matching its calendar day. No global option mutation — old posts are all closed by definition.
- The legacy `liveFeedThread` field can stay as historical metadata; it's no longer read by the frontend after migration.

---

## Lifecycle examples

### Eviction night (premiere case)
1. 4:30pm PT — user creates a post "BB28 Eviction Night Thread", checks Live Updates, start = "On publish (default)", end = "End of day (11:59pm)"
2. No existing active thread — no modal
3. Publish → state becomes "live", top strip site-wide flips to "LIVE: BB28 Eviction Night Thread →", homepage banner appears
4. User posts feed-updates from 5pm onward — each one triggers `live-thread-{post_id}` revalidation, page rebuilds
5. Premium users on the page see updates appended live via polling; free users see them on next reload
6. 11:59pm — `live_end` passes, `_bbjd_closed_at` stamped (via WP cron or first-fetch check), `bbjd_active_live_thread` cleared
7. Top strip falls back to "Watch Feeds | LIVE", homepage banner disappears
8. Post page enters closed state — banner replaces LIVE chip, polling stops, timeline becomes the permanent archive

### Take-over (long-running daily thread interrupted by a breaking event)
1. A "Daily Ramblings — Aug 8" thread is live (continuous)
2. User creates a new "BB28 Surprise Eviction" post, checks Live Updates
3. Editor pings current → finds the daily thread is active → modal opens
4. User confirms "Close other thread and start this one"
5. `take-over` endpoint runs atomically: stamps `_bbjd_closed_at` on daily thread, primes new post
6. User publishes new thread → `bbjd_active_live_thread` flips, both threads' pages get the right tags fired
7. Daily thread becomes a closed archive at the moment of take-over

---

## Out-of-scope (deferred to roadmap)

- **AI-generated closing recap** — `_bbjd_closing_summary` slot exists in v1, AI writer is a separate feature
- **BREAKING tag editor UI** — render-only in v1; flag set via admin/DB. Phase 2 adds a UI on the feed-update editor.
- **Push notifications** — when a thread opens or a BREAKING update lands, notify subscribed users. Separate feature, would tie into existing PWA push notification work on the roadmap.
- **Per-segment grouping on `/live-feed-updates` hub** — user mentioned this offhand as "cross that bridge"; not part of this feature.
- **Auto-extend on activity** — endurance HoH case is already handled via "Continuous" mode; auto-extending a fixed-end thread is out of scope.
- **Multiple concurrent live threads** — deliberately rejected (the global flag IS the design). Don't reintroduce.

---

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Layout-dynamic landmine (top strip in shared header) | Cached helper with narrow tag — no per-request APIs in shared segments. Audited in Section 3. |
| ISR cascade (over-broad cache tag, May 2026 incident) | `live-thread-{post_id}` is per-thread, never widened. `live-thread-active` is intentionally site-wide but invalidates rarely (open/close only). |
| Premium polling cost | Endpoint is uncached but only premium users initialize the poller. ~30s interval. Can rate-limit per IP at the WP layer if needed. |
| Two threads briefly active during take-over | All transitions go through atomic helpers — single DB transaction. Frontend doesn't render until the new state is committed. |
| `live_end` cron miss (auto-close fails to fire) | Defense-in-depth: state derivation also checks current time. A "live" post past its `live_end` will be treated as closed on the next fetch even if the cron didn't stamp `_bbjd_closed_at`. The webhook tag then fires lazily. |
| User forgets to close a "Continuous" thread before starting a new one | The take-over modal handles this — they can't accidentally have two. |

---

## Success criteria

- User can flip a post into a live thread via the editor checkbox without leaving the editor
- Active live thread is visible on every page (top strip) and prominently on the homepage (banner)
- Feed updates posted in the thread's window appear in the timeline chronologically
- The page hits Vercel's ISR cache for anonymous traffic — no per-request server work for free users
- Premium supporters see new updates appear without reloading, within 30 seconds of publication
- When a thread closes, its post page becomes a clean, paginated-as-one permanent archive page
- No regressions to existing post pages that don't use live updates
- No widening of cache tags; no new dynamic-rendering surfaces in shared layouts
