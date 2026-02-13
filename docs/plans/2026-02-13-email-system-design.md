# BBJ Email System Design

**Date:** February 13, 2026
**Status:** Approved
**Replaces:** MailPoet ($21.25/month)
**Provider:** Resend (Free tier off-season, $20/month Pro in-season)

---

## Overview

Custom email system built into the WordPress plugin (`bigbrotherjunkies-data`) with Resend as the delivery provider. WordPress handles all email logic, subscriber management, and admin UI. Next.js provides the subscribe widget, unsubscribe page, and settings integration.

### Scope for V1

- Post notification emails (auto-send on publish)
- Public subscribe widget with double opt-in
- Subscriber management with lists
- Resend webhook tracking (opens, clicks, bounces)
- Admin dashboard: Lists, Stats, Emails, Settings
- MailPoet import + re-confirmation campaign tool
- Engagement scoring with cleanup recommendations

### Deferred

- Daily feed update digest (architecture supports it, build later)
- Custom newsletter blasts (future)
- Drag-and-drop template builder (not needed — simple auto-template)

---

## Architecture

```
Next.js (Frontend)                    WordPress Plugin (Backend)
┌──────────────────────┐              ┌──────────────────────────────┐
│ Subscribe Widget     │──POST───────>│ EmailRoutes.php              │
│ Unsubscribe Page     │──GET────────>│   /bbjd/v1/email/*           │
│ Settings Toggles     │──PUT────────>│                              │
└──────────────────────┘              │ EmailService.php             │
                                      │   subscribe, confirm,        │
                                      │   unsubscribe, stats         │
                                      │                              │
                                      │ EmailSender.php              │
                                      │   post notifications,        │
                                      │   reconfirmation campaigns   │
                                      │                              │
                                      │ ResendClient.php             │
                                      │   send, sendBatch            │
                                      └──────────┬───────────────────┘
                                                 │
                                                 ▼
                                      ┌──────────────────────┐
                                      │ Resend API           │
                                      │   Delivery, webhooks │
                                      └──────────────────────┘
```

---

## Database Tables

### `bbj_email_subscribers`

The master subscriber list.

| Column          | Type                                                      | Notes                                              |
| --------------- | --------------------------------------------------------- | -------------------------------------------------- |
| id              | BIGINT PK AUTO_INCREMENT                                  |                                                    |
| user_id         | BIGINT nullable                                           | Links to WP user if registered, NULL for anonymous |
| email           | VARCHAR(255) UNIQUE                                       |                                                    |
| status          | ENUM('subscribed','unconfirmed','unsubscribed','bounced') | Default: unconfirmed                               |
| confirm_token   | VARCHAR(64) nullable                                      | For double opt-in confirmation links               |
| source          | VARCHAR(50)                                               | `registration`, `widget`, `import`, `admin`        |
| subscribed_at   | DATETIME nullable                                         |                                                    |
| confirmed_at    | DATETIME nullable                                         |                                                    |
| unsubscribed_at | DATETIME nullable                                         |                                                    |
| created_at      | DATETIME                                                  |                                                    |

### `bbj_email_lists`

Supports multiple lists. V1 ships with `post-notifications` only.

| Column      | Type                     | Notes                                         |
| ----------- | ------------------------ | --------------------------------------------- |
| id          | BIGINT PK AUTO_INCREMENT |                                               |
| slug        | VARCHAR(50) UNIQUE       | `post-notifications`, `daily-digest` (future) |
| name        | VARCHAR(100)             | Display name                                  |
| description | TEXT                     |                                               |
| is_active   | TINYINT(1)               | Default: 1                                    |
| created_at  | DATETIME                 |                                               |

### `bbj_email_list_subscribers`

Many-to-many pivot between subscribers and lists.

| Column        | Type                     | Notes                               |
| ------------- | ------------------------ | ----------------------------------- |
| subscriber_id | BIGINT FK                | References bbj_email_subscribers.id |
| list_id       | BIGINT FK                | References bbj_email_lists.id       |
| subscribed_at | DATETIME                 |                                     |
| PRIMARY KEY   | (subscriber_id, list_id) | Composite                           |

### `bbj_email_sends`

Every email sent, updated by Resend webhooks.

| Column        | Type                                                               | Notes                                    |
| ------------- | ------------------------------------------------------------------ | ---------------------------------------- |
| id            | BIGINT PK AUTO_INCREMENT                                           |                                          |
| subscriber_id | BIGINT FK                                                          |                                          |
| list_id       | BIGINT FK nullable                                                 |                                          |
| subject       | VARCHAR(255)                                                       |                                          |
| resend_id     | VARCHAR(100)                                                       | Resend's message ID for webhook matching |
| status        | ENUM('sent','delivered','opened','clicked','bounced','complained') |                                          |
| sent_at       | DATETIME                                                           |                                          |
| delivered_at  | DATETIME nullable                                                  |                                          |
| opened_at     | DATETIME nullable                                                  |                                          |
| clicked_at    | DATETIME nullable                                                  |                                          |
| bounced_at    | DATETIME nullable                                                  |                                          |
| bounce_type   | VARCHAR(20) nullable                                               | `hard` or `soft`                         |

---

## Backend Services (WP Plugin)

All under `src/Email/` namespace `BigBrotherJunkies\Data\Email`.

### ResendClient.php

Thin wrapper around Resend's REST API (`https://api.resend.com`).

- `send(string $to, string $subject, string $html): ?string` — Returns Resend message ID
- `sendBatch(array $emails): array` — Up to 100 per call. At 576 subs = 6 calls
- API key from `bbjd_api_settings` option

### EmailService.php

Core business logic.

- `subscribe(string $email, string $source, array $listSlugs)` — Create subscriber + confirm token + send confirmation email
- `confirm(string $token)` — Validate token, set status to subscribed
- `unsubscribe(string $email, string $token)` — Set status, record timestamp
- `getSubscribers(string $listSlug, array $filters)` — Paginated with status filters
- `getStats()` — Aggregates: total subs, open rate, click rate, bounce rate
- `getEngagementScoring()` — Active (opened in 30d), Inactive (30-90d), Dormant (90d+)
- `flagInactiveSubscribers(int $days)` — Marks dormant subscribers
- `cleanupBounced()` — Auto-unsubscribe hard bounces, flag soft bounces after 3 attempts
- `importFromCsv(array $rows, string $listSlug)` — MailPoet migration import

### EmailSender.php

Send orchestration, hooks into WordPress.

- `sendPostNotification(int $postId)` — Query post-notifications list, build template, batch send
- `sendReconfirmation(array $subscriberIds)` — "Still want to hear from us?" campaign
- `sendConfirmation(int $subscriberId)` — Double opt-in confirmation email
- Hooks: `transition_post_status` → on publish, calls `sendPostNotification()`

### EmailRoutes.php

REST API endpoints under `/bbjd/v1/email/`.

| Endpoint              | Method  | Auth              | Purpose                                      |
| --------------------- | ------- | ----------------- | -------------------------------------------- |
| `/subscribe`          | POST    | Public            | Widget subscribe (email + list)              |
| `/confirm/{token}`    | GET     | Public            | Confirm opt-in                               |
| `/unsubscribe`        | GET     | Public            | One-click unsubscribe (email + token in URL) |
| `/preferences`        | GET/PUT | Auth (user)       | Registered user manages list memberships     |
| `/webhook/resend`     | POST    | Webhook signature | Resend delivery/open/click/bounce events     |
| `/stats`              | GET     | Admin             | Stats for admin dashboard                    |
| `/subscribers`        | GET     | Admin             | Paginated subscriber list with filters       |
| `/subscribers/import` | POST    | Admin             | Import from MailPoet CSV                     |
| `/reconfirm`          | POST    | Admin             | Trigger re-confirmation campaign             |

---

## WP Admin UI — "BBJ Mailing" Menu

Four pages, Tailwind-prefixed (`bbjd-`) styling matching existing admin pages.

### Lists Page

- Table: all lists with slug, name, subscriber count, active status
- Click into list → subscriber table with status badges
- Search/filter by status or email
- Manual add/remove subscribers
- `post-notifications` list created on plugin activation

### Stats Page

- Top row: 4 stat cards (Total Subscribers, Open Rate, Click Rate, Bounce Rate)
- Recent sends table: subject, list, sent count, open %, click %, date
- Engagement groups: Active / Inactive / Dormant with counts and %
- Recommendations panel: "X subscribers dormant 90+ days — Run re-confirmation?" with action button
- Bounce summary: hard vs soft counts, auto-cleanup status

### Emails Page

- Table of email types: Post Notification (auto), Re-confirmation (manual)
- Post Notification: last sent date, subscriber count, template preview
- "Send Test Email" button → sends to admin email for preview
- Re-confirmation: select dormant subscribers by inactivity period, preview, send
- Status indicator: post notification trigger active/paused

### Settings Page

- Resend API key input
- From name, from email, reply-to email
- Confirmation email subject/message
- Unsubscribe redirect URL
- Auto-cleanup rules: hard bounce removal, soft bounce retry limit, dormant threshold
- "Pause all sending" master toggle

---

## Frontend (Next.js)

### Subscribe Widget

- Email input + "Subscribe" button
- For sidebar and/or footer placement
- `POST /bbjd/v1/email/subscribe` with email + list slug
- Success: "Check your inbox to confirm!"
- Logged-in users: auto-fill email, skip confirmation (already verified via WP account)

### Unsubscribe Page (`/unsubscribe`)

- Email + token in query params (from email footer link)
- Calls unsubscribe endpoint on load
- Shows "You've been unsubscribed" confirmation
- "Was this a mistake? Re-subscribe" button
- Optional feedback: "Too many emails / Not relevant / Other"

### Settings Integration (`/settings?tab=notifications`)

- Wire existing "Email Newsletter" toggle to real `/email/preferences` endpoint
- Toggle maps to `post-notifications` list membership
- Future: additional toggles for digest list when built
- No new UI components needed — just wire existing toggles

---

## Email Template (Auto-Generated)

Single branded HTML template, auto-populates on send:

```
┌─────────────────────────────────┐
│ [BBJ Logo]                      │
│                                 │
│ New on Big Brother Junkies      │
├─────────────────────────────────┤
│                                 │
│ [Featured Image]                │
│                                 │
│ Post Title                      │
│ Post excerpt (first 2-3        │
│ sentences)...                   │
│                                 │
│ [Read More →]                   │
│                                 │
├─────────────────────────────────┤
│ BBJ • Unsubscribe • Preferences│
└─────────────────────────────────┘
```

- Inline CSS for email client compatibility
- Dark-on-light, clean, mobile-responsive
- BBJ brand colors (primary blue header)
- Unsubscribe link in footer (required by CAN-SPAM)
- Preferences link for registered users

---

## Migration Plan (MailPoet → New System)

Triggered manually from admin when ready (around BB season start):

1. Export MailPoet subscribers via CSV (576 active)
2. Import via `/subscribers/import` endpoint → status: `unconfirmed`
3. Send re-confirmation campaign: "BB28 is coming! Confirm to stay on our list"
4. Periodic reminders (2-3 over 1-2 months) to non-responders
5. After deadline, run cleanup script to remove unconfirmed imports
6. Deactivate MailPoet plugin

---

## Resend Configuration

- **API Key:** Stored in `bbjd_api_settings` (same as Stripe/PayPal)
- **Webhooks:** Configure in Resend dashboard to POST to `/bbjd/v1/email/webhook/resend`
- **Domain verification:** Add DKIM/SPF records for bigbrotherjunkies.com in Cloudways DNS
- **Webhook signature verification:** Validate `svix-signature` header on incoming webhooks

---

## Cost Projection

| Period               | Volume        | Plan                     | Cost         |
| -------------------- | ------------- | ------------------------ | ------------ |
| Off-season (Sep-Jun) | ~2-5K/month   | Free (3K) or Pro ($20)   | $0-20/month  |
| In-season (Jul-Sep)  | ~50-85K/month | Pro ($20) or Scale ($90) | $20-90/month |
| Current MailPoet     | Any           | Business 1500            | $21.25/month |

Worst case in-season: $90/month for 3 months = $270/year vs MailPoet's $255/year, but with 10x the capacity and no CPU impact on the server.
