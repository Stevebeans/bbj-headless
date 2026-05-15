# Mailing List Detail + Cleanup — Design

**Date:** 2026-05-15
**Status:** Approved (Steve, 2026-05-15)
**Builds on:** `mail-system.md` (overall mailing vision), `memory/project_newsletter_direction.md` (Resend activation state)

## Goal

Add a per-list detail view to the Next.js admin so Steve can see per-subscriber engagement, identify "problem" subscribers, and clean the list to protect sender reputation.

## Background

The newsletter system was activated 2026-05-14 with the BB28 blast (574 sends, post 73683) on 2026-05-15. The existing `/admin/mailing` shows aggregate stats only. There is no UI for:

- Viewing the subscribers in a list with per-row engagement
- Spotting subscribers who hurt sender reputation (bounces, never-openers, dormant)
- Bulk cleanup actions

The user cares about reputation specifically because low open rates and bounces directly impact deliverability authority.

## Problem-flag definitions

| Flag | Condition (all-time) | Default action |
|---|---|---|
| `hard_bounced` | `hard_bounces > 0` (any hard bounce on record — usually already unsubbed by webhook, but flag regardless to catch cases where the webhook update didn't fire) | Delete (row is dead weight) |
| `soft_bouncing` | `soft_bounces >= 3` | Unsubscribe |
| `never_opened` | `total_sends >= 5` AND `total_opens = 0` | Unsubscribe |
| `dormant` | `total_sends > 0` AND `last_open_at < NOW() - 90 days` | Unsubscribe |

Thresholds live as class constants in `EmailService` (`NEVER_OPENED_MIN_SENDS = 5`, `SOFT_BOUNCE_LIMIT = 3`, `DORMANT_DAYS = 90`). Tuning requires a code edit + deploy — no admin UI for now. If/when the user wants to adjust them frequently, surface them in `EmailSettingsPage`. (Note: the existing `bbjd_email_settings.dormant_threshold_days` option drives the bulk-reconfirmation campaign feature, NOT this flag — they happen to share the value 90 today but are independent.)

Problem-flag computation always uses **all-time** data, regardless of any timeframe filter chosen for the engagement-column display. Reason: a dormancy flag must not disappear simply because the user zooms in on the last 7 days.

## Architecture

Two new pages in `/admin/mailing/`, fed by extended REST endpoints in the `bigbrotherjunkies-data` plugin. Problem-flag logic is centralized in PHP (`EmailService`) — the frontend never recomputes thresholds locally.

```
Browser                          Vercel (Next.js)               WP (Cloudways)
─────────                        ─────────────────              ──────────────
/admin/mailing/lists       ──▶   page.jsx, useEffect       ──▶  GET /bbjd/v1/email/lists
                                                                 (existing)
/admin/mailing/lists/[s]   ──▶   [slug]/page.jsx           ──▶  GET /bbjd/v1/email/subscribers
                                                                 ?list=X&timeframe=Y&flag=Z
                                                            ──▶  GET /bbjd/v1/email/lists/{slug}/problems
                                                                 (NEW)
   bulk action click       ──▶   confirm + fetch          ──▶  POST /bbjd/v1/email/subscribers/bulk-action
                                                                 (NEW)
```

## Backend changes (`bigbrotherjunkies-data` plugin)

### `EmailService::getSubscribers()` — extend

Add LEFT JOIN with an aggregated subquery against `wp_bbj_email_sends`. Returned per-row fields gain:

- `total_sends` (within timeframe)
- `total_opens` (within timeframe)
- `last_open_at` (within timeframe — null if no opens in range)
- `total_clicks`, `last_click_at` (within timeframe)
- `total_bounces`, `soft_bounces`, `hard_bounces` (all-time, used for flag math)
- `problem_flags` — array of strings: any subset of `["hard_bounced", "soft_bouncing", "never_opened", "dormant"]`

New optional params:

- `timeframe`: one of `"7d" | "30d" | "90d" | "all"` (default `"all"`). Maps to a `sent_at >=` filter on the inner subquery for the within-timeframe metrics.
- `flag`: one of the four problem flags. Filters rows to those carrying that flag.

The query uses one subquery for within-timeframe metrics (`opens`, `clicks`, `sends`) and another for all-time bounce counts so flag math stays stable. Performance: indexed on `(subscriber_id, sent_at)` already; for 574 rows this is sub-100ms.

### New endpoint: `GET /bbjd/v1/email/lists/{slug}/problems`

Permission: `requireAdmin`.

Response:
```json
{
  "success": true,
  "list": { "slug": "post-notifications", "name": "Post Notifications" },
  "summary": {
    "hard_bounced": 0,
    "soft_bouncing": 2,
    "never_opened": 14,
    "dormant": 0,
    "total_flagged": 16
  },
  "by_category": {
    "hard_bounced": [],
    "soft_bouncing": [123, 456],
    "never_opened": [789, 790, ...],
    "dormant": []
  }
}
```

`by_category.*` returns subscriber IDs only (the frontend already has the subscriber rows via `/subscribers` and looks them up locally). Caps each category at 500 IDs (further pagination via the table view).

### New endpoint: `POST /bbjd/v1/email/subscribers/bulk-action`

Permission: `requireAdmin`.

Request:
```json
{ "action": "unsubscribe" | "delete", "subscriber_ids": [1, 2, 3] }
```

Behavior:
- `unsubscribe`: sets `status='unsubscribed'`, sets `unsubscribed_at=NOW()`. Does NOT delete the row or the list-subscriber junctions.
- `delete`: deletes from `wp_bbj_email_list_subscribers` (all lists for this subscriber) and `wp_bbj_email_subscribers`. Send-history rows in `wp_bbj_email_sends` are preserved (FK is not enforced; subscriber_id becomes orphan, which is fine for historical reporting).

Hard cap: 500 IDs per call. Frontend chunks larger selections.

Response:
```json
{ "success": true, "processed": 14, "errors": [] }
```

## Frontend changes (`bbj-app`)

### Files

```
src/app/admin/mailing/
  layout.jsx                       (NEW)  — sub-nav strip: Stats | Lists
  page.jsx                         (existing — Stats dashboard, no change)
  lists/
    page.jsx                       (NEW)  — Lists overview
    [slug]/
      page.jsx                     (NEW)  — List detail with hygiene + table

src/components/mailing/            (NEW dir)
  ProblemCallout.jsx               — top-of-page hygiene box
  SubscribersTable.jsx             — paginated engagement table
  BulkActionBar.jsx                — sticky-bottom select-and-act bar
  FlagPill.jsx                     — colored badge for a problem flag

src/lib/api/mailing.js             — add getListProblems, bulkSubscriberAction; extend getListSubscribers with timeframe + flag params
```

### `/admin/mailing/lists` — Lists overview

Compact table (one row today, designed for future lists). Columns:

| Name | Slug | Subscribers | Last Campaign | Open Rate (30d) | Status |
|---|---|---|---|---|---|

Row click → `/admin/mailing/lists/[slug]`. Uses existing `getMailingLists()`.

### `/admin/mailing/lists/[slug]` — List detail

Top-to-bottom layout:

1. **Header strip** — back link to `/admin/mailing/lists`, list name, total subs, last campaign date, refresh button.
2. **`<ProblemCallout>`** — see below.
3. **Filter bar** — Timeframe dropdown (`7d/30d/90d/All`), Status dropdown, Flag dropdown, Search input.
4. **`<SubscribersTable>`** — paginated table with engagement columns (sends/opens/last open/clicks/bounces — within timeframe), Flags column, Status badge, per-row Unsub/Delete actions.
5. **`<BulkActionBar>`** — appears sticky at bottom when ≥1 checkbox is selected.

### `<ProblemCallout>`

- Renders summary from `GET /lists/{slug}/problems`.
- If `total_flagged === 0`: green box, "List is clean ✓".
- Otherwise: amber-bordered card with a row per non-empty category. Each row has:
  - Category name (e.g. "Never opened (after 5+ sends)") + count
  - One-line explanation
  - Two buttons: **"Review"** (sets the Flag filter on the table below to this category, scrolls) and **"Unsubscribe all (N)"** (or "Delete all (N)" for hard-bounced category — see flag-default mapping in problem-flag table above).
- Bulk-from-callout actions show a `window.confirm` dialog before firing `/bulk-action`.

### `<SubscribersTable>`

Columns: `☐ | Email | Status | Flags | Sends | Opens | Last Open | Clicks | Bounces | Subscribed | Actions`

- Checkbox in header selects all rows on current page (cap at page size; doesn't cross-pagination).
- Flags column renders zero or more `<FlagPill>` components.
- Engagement columns reflect the selected timeframe.
- Status column = colored badge (`subscribed` green, `unconfirmed` amber, `unsubscribed` grey, `complained` red).
- Actions: per-row `Unsub` and `Delete` buttons, each behind a `window.confirm`.
- Pagination: standard prev/page-of/next plus a page-size dropdown (20/50/100).

### `<BulkActionBar>`

- Appears sticky at the bottom of the viewport when the table has selected rows.
- Shows count: "14 subscribers selected".
- Buttons: `[Unsubscribe Selected]` `[Delete Selected]` `[Clear]`.
- Each action confirms with the count, fires `/bulk-action`, then refreshes the table + the problem callout.
- During the API call, buttons disable + show a spinner. Result toasts: "✓ 14 subscribers unsubscribed" or "✗ Failed: ...".

### `<FlagPill>`

- Small rounded badge with a colored dot + label.
- Tooltip on hover describes the threshold.
- Colors: `hard_bounced` red, `soft_bouncing` amber, `never_opened` orange, `dormant` slate.

### Sub-nav (`src/app/admin/mailing/layout.jsx`)

Two-tab strip rendered above any child page in `/admin/mailing/*`:

```
[ Stats ]  [ Lists ]
```

Active tab is matched against `pathname`. Bold + underlined when active. Sits inside the existing admin layout's main content card.

## API client (`src/lib/api/mailing.js`)

Add:

```js
export async function getListProblems(listSlug) { ... }
export async function bulkSubscriberAction(action, subscriberIds) { ... }
```

Extend `getListSubscribers` to accept `timeframe` and `flag`.

## Error handling

- All API calls go through `adminFetch` — JWT errors auto-redirect to `/login`.
- Bulk-action returns `{success, processed, errors}` — show error toast with details if `errors.length > 0`.
- Bulk size hard cap at 500: client chunks larger selections into sequential 500-row calls and accumulates results.
- Loading: skeleton rows for the table; spinner for the problem callout.
- Empty state: "No subscribers match these filters" with a "Clear filters" button.

## Edge cases / decisions

- **Subscriber in multiple lists.** Bulk `delete` removes ALL list memberships, not just the current list. This matches the user's intent: they want this person gone for sender-reputation reasons, not just off one list. Surface this in the confirmation dialog wording.
- **Bulk action on huge selections.** Cap at 500/call; frontend chunks. Practical because flagged categories are typically small (sub-hundred).
- **Pagination interaction with bulk select.** Selections do NOT persist across page changes (checkbox state resets). This is the lower-risk UX — prevents acting on rows the user can no longer see.
- **`status='unsubscribed'` rows showing up in problem flags.** Yes, intentional, especially for `hard_bounced` (where the webhook already changed status). The user can choose to delete them outright for DB hygiene.
- **Timeframe column display when no events in range.** `Last Open` shows `—` if `last_open_at` is null within the timeframe. `Opens`/`Clicks`/`Sends` show `0`.
- **Problem flags use all-time data; engagement columns use timeframe.** Documented in the FlagPill tooltip and in the timeframe dropdown helper text.

## Out of scope (intentionally)

- Re-confirmation campaigns triggered from this page (the existing bulk re-confirmation button in WP admin remains the path until later).
- Creating/editing/deleting lists (the schema supports it; the UI doesn't need it until the next list — `live-feed-recap` — is being introduced).
- A "preview email" view for individual subscribers' send history (could be a follow-up if useful).
- Server-side automated cleanup (e.g., a daily cron that auto-unsubscribes anyone meeting a flag) — explicitly opt-in via UI for now.

## Permission model

All new endpoints use `requireAdmin` (matches existing `EmailRoutes` permission callback). Frontend tab gated to `admin_settings` permission, same as the existing `/admin/mailing` page.

## Implementation order (high-level)

1. Backend: extend `EmailService::getSubscribers()` with engagement + problem flags + timeframe + flag params.
2. Backend: add `getListProblems()` method and `/lists/{slug}/problems` route.
3. Backend: add `bulkAction()` method and `/subscribers/bulk-action` route.
4. Frontend: `lib/api/mailing.js` additions.
5. Frontend: `admin/mailing/layout.jsx` (sub-nav).
6. Frontend: `admin/mailing/lists/page.jsx` (overview).
7. Frontend: shared components (`<FlagPill>`, `<SubscribersTable>`, `<ProblemCallout>`, `<BulkActionBar>`).
8. Frontend: `admin/mailing/lists/[slug]/page.jsx` (detail) composing the components.
9. Manual QA: hit `/admin/mailing/lists` and the BB28 list detail; verify engagement columns reflect BB28 send data; verify bulk action against a single test subscriber row.

Detailed implementation plan to follow via the writing-plans skill.
