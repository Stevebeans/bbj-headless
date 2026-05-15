# Mailing List Detail + Cleanup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-list detail page to the Next.js admin with per-subscriber engagement metrics, problem-email flagging, and bulk cleanup actions, so Steve can protect sender reputation by removing bounced/dormant/never-opened subscribers.

**Architecture:** Two new Next.js pages under `/admin/mailing/lists/*`, fed by three new/extended REST endpoints on the `bigbrotherjunkies-data` WordPress plugin. Problem-flag thresholds live as class constants in PHP `EmailService`. Bulk actions go through a new `/subscribers/bulk-action` endpoint. Approved spec at `.claude/projects/mailing/2026-05-15-list-detail-design.md`.

**Tech Stack:** PHP 8.2 (WordPress plugin), Next.js 15 App Router (client components), Tailwind CSS, JWT-authenticated REST.

**Testing approach:** This codebase has no automated test suite. Verification is via (a) `curl` against the deployed staging endpoints with expected JSON shapes, and (b) browser smoke checks on `localhost:3001`. Each task ends with a concrete verification command and a commit.

**Deployment notes:**
- WordPress plugin edits land in `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\` (NOT in `bbj-app/wp-plugin/`).
- After backend changes, deploy to staging via `bash .claude/scripts/deploy-plugin.sh --staging` before verifying with curl against `stg-wp.bigbrotherjunkies.com`.
- Frontend changes auto-reload on `localhost:3001` via the running `npm run dev` background process (`bash_id: byrwsvux9`).
- Memory bug to remember: rotating Resend keys requires `wp cache flush` afterward, otherwise stale option cache is served. Not directly relevant here but mentioned because we'll touch `bbjd_email_settings` reads.

---

## Task 1: Extend EmailService::getSubscribers with engagement aggregation + flag computation

**Files:**
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Email\EmailService.php`

- [ ] **Step 1: Add threshold constants at the top of the class**

In `EmailService.php`, immediately after `class EmailService\n{`, add:

```php
public const NEVER_OPENED_MIN_SENDS = 5;
public const SOFT_BOUNCE_LIMIT = 3;
public const DORMANT_DAYS = 90;
```

- [ ] **Step 2: Rewrite the getSubscribers method to include engagement + flags**

Replace the entire body of `public function getSubscribers(string $listSlug, array $filters = []): array` (currently lines ~182-240) with:

```php
public function getSubscribers(string $listSlug, array $filters = []): array
{
    global $wpdb;

    $page = max(1, (int) ($filters['page'] ?? 1));
    $perPage = max(1, min(100, (int) ($filters['per_page'] ?? 20)));
    $offset = ($page - 1) * $perPage;
    $timeframe = $filters['timeframe'] ?? 'all';
    $flag = $filters['flag'] ?? '';

    $subTable = EmailSchema::table(EmailSchema::TABLE_SUBSCRIBERS);
    $lsTable = EmailSchema::table(EmailSchema::TABLE_LIST_SUBSCRIBERS);
    $listTable = EmailSchema::table(EmailSchema::TABLE_LISTS);
    $sendsTable = EmailSchema::table(EmailSchema::TABLE_SENDS);

    // Timeframe cutoff for engagement columns (sends/opens/clicks within range)
    $cutoffMap = ['7d' => '-7 days', '30d' => '-30 days', '90d' => '-90 days'];
    $timeframeJoinSql = '';
    $timeframeParams = [];
    if (isset($cutoffMap[$timeframe])) {
        $timeframeJoinSql = ' AND se.sent_at >= %s';
        $timeframeParams[] = gmdate('Y-m-d H:i:s', strtotime($cutoffMap[$timeframe]));
    }

    $where = ['l.slug = %s'];
    $params = [$listSlug];

    if (!empty($filters['status'])) {
        $where[] = 's.status = %s';
        $params[] = $filters['status'];
    }
    if (!empty($filters['search'])) {
        $where[] = 's.email LIKE %s';
        $params[] = '%' . $wpdb->esc_like($filters['search']) . '%';
    }
    $whereClause = implode(' AND ', $where);

    // Build the data query. Two LEFT JOINs:
    //   eng_tf  : aggregates within timeframe (sends/opens/clicks)
    //   eng_all : all-time aggregates (bounces, last_open, for flag math)
    $dataSql = "
        SELECT s.id, s.email, s.user_id, s.status, s.source,
               s.subscribed_at, s.confirmed_at, s.unsubscribed_at, s.created_at,
               COALESCE(eng_tf.total_sends, 0)   AS total_sends,
               COALESCE(eng_tf.total_opens, 0)   AS total_opens,
               eng_tf.last_open_at,
               COALESCE(eng_tf.total_clicks, 0)  AS total_clicks,
               eng_tf.last_click_at,
               COALESCE(eng_all.total_bounces, 0) AS total_bounces,
               COALESCE(eng_all.soft_bounces, 0)  AS soft_bounces,
               COALESCE(eng_all.hard_bounces, 0)  AS hard_bounces,
               eng_all.last_open_at_all          AS last_open_at_all,
               eng_all.total_sends_all           AS total_sends_all
        FROM {$subTable} s
        INNER JOIN {$lsTable} ls ON ls.subscriber_id = s.id
        INNER JOIN {$listTable} l ON l.id = ls.list_id
        LEFT JOIN (
            SELECT subscriber_id,
                   COUNT(*) AS total_sends,
                   SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) AS total_opens,
                   MAX(opened_at) AS last_open_at,
                   SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) AS total_clicks,
                   MAX(clicked_at) AS last_click_at
            FROM {$sendsTable} se
            WHERE 1=1 {$timeframeJoinSql}
            GROUP BY subscriber_id
        ) eng_tf ON eng_tf.subscriber_id = s.id
        LEFT JOIN (
            SELECT subscriber_id,
                   COUNT(*) AS total_sends_all,
                   MAX(opened_at) AS last_open_at_all,
                   SUM(CASE WHEN bounced_at IS NOT NULL THEN 1 ELSE 0 END) AS total_bounces,
                   SUM(CASE WHEN bounce_type = 'soft' THEN 1 ELSE 0 END) AS soft_bounces,
                   SUM(CASE WHEN bounce_type = 'hard' THEN 1 ELSE 0 END) AS hard_bounces
            FROM {$sendsTable}
            GROUP BY subscriber_id
        ) eng_all ON eng_all.subscriber_id = s.id
        WHERE {$whereClause}
        ORDER BY s.created_at DESC
    ";

    $countSql = "
        SELECT COUNT(*)
        FROM {$subTable} s
        INNER JOIN {$lsTable} ls ON ls.subscriber_id = s.id
        INNER JOIN {$listTable} l ON l.id = ls.list_id
        WHERE {$whereClause}
    ";

    // Order of binding: timeframe params (for eng_tf JOIN) first, then where params.
    $dataParams = array_merge($timeframeParams, $params, [$perPage, $offset]);
    $countParams = $params;

    $total = (int) $wpdb->get_var($wpdb->prepare($countSql, ...$countParams));
    $rows = $wpdb->get_results(
        $wpdb->prepare($dataSql . ' LIMIT %d OFFSET %d', ...$dataParams),
        ARRAY_A
    );

    // Compute problem_flags (all-time) and optionally filter by flag.
    $now = time();
    $dormantCutoff = $now - (self::DORMANT_DAYS * 86400);
    $enriched = [];
    foreach ($rows ?: [] as $row) {
        $totalSendsAll = (int) ($row['total_sends_all'] ?? 0);
        $lastOpenAll = $row['last_open_at_all'] ? strtotime($row['last_open_at_all']) : null;
        $hardBounces = (int) $row['hard_bounces'];
        $softBounces = (int) $row['soft_bounces'];

        $flags = [];
        if ($hardBounces > 0 && $row['status'] === 'unsubscribed') {
            $flags[] = 'hard_bounced';
        }
        if ($softBounces >= self::SOFT_BOUNCE_LIMIT) {
            $flags[] = 'soft_bouncing';
        }
        if ($totalSendsAll >= self::NEVER_OPENED_MIN_SENDS && $lastOpenAll === null) {
            $flags[] = 'never_opened';
        }
        if ($totalSendsAll > 0 && $lastOpenAll !== null && $lastOpenAll < $dormantCutoff) {
            $flags[] = 'dormant';
        }

        if ($flag && !in_array($flag, $flags, true)) {
            continue;
        }

        // Strip internal-only columns from the response
        unset($row['last_open_at_all'], $row['total_sends_all']);
        $row['total_sends'] = (int) $row['total_sends'];
        $row['total_opens'] = (int) $row['total_opens'];
        $row['total_clicks'] = (int) $row['total_clicks'];
        $row['total_bounces'] = (int) $row['total_bounces'];
        $row['soft_bounces'] = $softBounces;
        $row['hard_bounces'] = $hardBounces;
        $row['problem_flags'] = $flags;
        $enriched[] = $row;
    }

    return [
        'subscribers' => $enriched,
        'total' => $total,
        'page' => $page,
        'per_page' => $perPage,
        'total_pages' => (int) ceil($total / $perPage),
    ];
}
```

**Note:** when `flag` is set, the `total` count still reflects unfiltered count (filter happens post-query). That's acceptable for MVP. If/when it matters, add a flag-aware count subquery.

- [ ] **Step 3: Deploy to staging**

```bash
bash .claude/scripts/deploy-plugin.sh --staging
```

Expected: "Deployment complete" with no error output.

- [ ] **Step 4: Verify via curl against staging**

Get a JWT for an admin user first (skip if you have one in `.claude/private/` already), then:

```bash
curl -s -H "Authorization: Bearer $JWT" \
  "https://stg-wp.bigbrotherjunkies.com/wp-json/bbjd/v1/email/subscribers?list=post-notifications&per_page=2" \
  | python3 -m json.tool
```

Expected output shape (first row should have engagement fields and a `problem_flags` array):
```json
{
  "success": true,
  "subscribers": [
    { "id": 121, "email": "...", "status": "...", "total_sends": 1, "total_opens": 0, "last_open_at": null, "total_clicks": 0, "total_bounces": 0, "problem_flags": [] }
  ],
  "total": 575,
  "page": 1,
  "per_page": 2,
  "total_pages": 288
}
```

- [ ] **Step 5: Verify timeframe filter**

```bash
curl -s -H "Authorization: Bearer $JWT" \
  "https://stg-wp.bigbrotherjunkies.com/wp-json/bbjd/v1/email/subscribers?list=post-notifications&per_page=2&timeframe=7d" \
  | python3 -m json.tool
```

Expected: same shape; `total_sends` etc. reflect only sends within last 7 days (currently 574 since the blast was today, so should still be 1 for active sub rows).

- [ ] **Step 6: Commit**

```bash
cd /c/xampp/htdocs/bbj
git add wp-content/plugins/bigbrotherjunkies-data/src/Email/EmailService.php
git commit -m "feat(email): add engagement aggregation + problem flags to getSubscribers"
```

---

## Task 2: Add getListProblems method + REST route

**Files:**
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Email\EmailService.php`
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\EmailRoutes.php`

- [ ] **Step 1: Add getListProblems to EmailService**

Append to `EmailService.php`, before the closing `}` of the class:

```php
/**
 * Compute problem-flag summary for a list.
 *
 * @param string $listSlug List slug (e.g. 'post-notifications')
 * @return array {
 *   list: {slug, name},
 *   summary: {hard_bounced, soft_bouncing, never_opened, dormant, total_flagged},
 *   by_category: {hard_bounced: [int], soft_bouncing: [int], never_opened: [int], dormant: [int]}
 * }
 */
public function getListProblems(string $listSlug): array
{
    global $wpdb;

    $subTable = EmailSchema::table(EmailSchema::TABLE_SUBSCRIBERS);
    $lsTable = EmailSchema::table(EmailSchema::TABLE_LIST_SUBSCRIBERS);
    $listTable = EmailSchema::table(EmailSchema::TABLE_LISTS);
    $sendsTable = EmailSchema::table(EmailSchema::TABLE_SENDS);

    $list = $wpdb->get_row($wpdb->prepare(
        "SELECT slug, name FROM {$listTable} WHERE slug = %s AND is_active = 1",
        $listSlug
    ), ARRAY_A);

    if (!$list) {
        return [
            'list' => null,
            'summary' => ['hard_bounced' => 0, 'soft_bouncing' => 0, 'never_opened' => 0, 'dormant' => 0, 'total_flagged' => 0],
            'by_category' => ['hard_bounced' => [], 'soft_bouncing' => [], 'never_opened' => [], 'dormant' => []],
        ];
    }

    $dormantCutoffSql = "DATE_SUB(NOW(), INTERVAL " . self::DORMANT_DAYS . " DAY)";
    $softLimit = self::SOFT_BOUNCE_LIMIT;
    $neverMin = self::NEVER_OPENED_MIN_SENDS;

    // Pull all subscribers in this list plus their all-time engagement.
    $rows = $wpdb->get_results($wpdb->prepare(
        "SELECT s.id, s.status,
                COALESCE(eng.total_sends, 0) AS total_sends,
                eng.last_open_at,
                COALESCE(eng.soft_bounces, 0) AS soft_bounces,
                COALESCE(eng.hard_bounces, 0) AS hard_bounces
         FROM {$subTable} s
         INNER JOIN {$lsTable} ls ON ls.subscriber_id = s.id
         INNER JOIN {$listTable} l ON l.id = ls.list_id
         LEFT JOIN (
             SELECT subscriber_id,
                    COUNT(*) AS total_sends,
                    MAX(opened_at) AS last_open_at,
                    SUM(CASE WHEN bounce_type = 'soft' THEN 1 ELSE 0 END) AS soft_bounces,
                    SUM(CASE WHEN bounce_type = 'hard' THEN 1 ELSE 0 END) AS hard_bounces
             FROM {$sendsTable}
             GROUP BY subscriber_id
         ) eng ON eng.subscriber_id = s.id
         WHERE l.slug = %s",
        $listSlug
    ), ARRAY_A);

    $categories = [
        'hard_bounced' => [],
        'soft_bouncing' => [],
        'never_opened' => [],
        'dormant' => [],
    ];
    $dormantCutoff = time() - (self::DORMANT_DAYS * 86400);

    foreach ($rows ?: [] as $r) {
        $id = (int) $r['id'];
        $totalSends = (int) $r['total_sends'];
        $lastOpen = $r['last_open_at'] ? strtotime($r['last_open_at']) : null;

        if ((int) $r['hard_bounces'] > 0 && $r['status'] === 'unsubscribed') {
            $categories['hard_bounced'][] = $id;
        }
        if ((int) $r['soft_bounces'] >= $softLimit) {
            $categories['soft_bouncing'][] = $id;
        }
        if ($totalSends >= $neverMin && $lastOpen === null) {
            $categories['never_opened'][] = $id;
        }
        if ($totalSends > 0 && $lastOpen !== null && $lastOpen < $dormantCutoff) {
            $categories['dormant'][] = $id;
        }
    }

    // Cap each category at 500 IDs (UI paginates via the table for the rest)
    foreach ($categories as $k => $ids) {
        $categories[$k] = array_slice($ids, 0, 500);
    }

    $summary = [
        'hard_bounced' => count($categories['hard_bounced']),
        'soft_bouncing' => count($categories['soft_bouncing']),
        'never_opened' => count($categories['never_opened']),
        'dormant' => count($categories['dormant']),
    ];
    // total_flagged counts unique subscribers across categories
    $unique = array_unique(array_merge(
        $categories['hard_bounced'],
        $categories['soft_bouncing'],
        $categories['never_opened'],
        $categories['dormant']
    ));
    $summary['total_flagged'] = count($unique);

    return [
        'list' => $list,
        'summary' => $summary,
        'by_category' => $categories,
    ];
}
```

- [ ] **Step 2: Register the route in EmailRoutes**

In `EmailRoutes.php`, inside `registerRoutes()`, add (after the existing `/email/lists` route registration, near line ~200):

```php
register_rest_route(self::NAMESPACE, '/email/lists/(?P<slug>[a-z0-9-]+)/problems', [
    'methods' => 'GET',
    'callback' => [$this, 'getListProblems'],
    'permission_callback' => [$this, 'requireAdmin'],
    'args' => [
        'slug' => [
            'required' => true,
            'type' => 'string',
            'sanitize_callback' => 'sanitize_title',
        ],
    ],
]);
```

- [ ] **Step 3: Add the handler method in EmailRoutes**

Append the method to `EmailRoutes.php`, before the closing `}` of the class:

```php
public function getListProblems(WP_REST_Request $request): WP_REST_Response
{
    $slug = $request->get_param('slug');
    $service = new EmailService();

    return new WP_REST_Response([
        'success' => true,
        ...$service->getListProblems($slug),
    ], 200);
}
```

- [ ] **Step 4: Deploy to staging**

```bash
bash .claude/scripts/deploy-plugin.sh --staging
```

- [ ] **Step 5: Verify via curl**

```bash
curl -s -H "Authorization: Bearer $JWT" \
  "https://stg-wp.bigbrotherjunkies.com/wp-json/bbjd/v1/email/lists/post-notifications/problems" \
  | python3 -m json.tool
```

Expected shape (counts will be small or 0 since BB28 just sent and everyone has 1 send):
```json
{
  "success": true,
  "list": { "slug": "post-notifications", "name": "Post Notifications" },
  "summary": { "hard_bounced": 0, "soft_bouncing": 0, "never_opened": 0, "dormant": 0, "total_flagged": 0 },
  "by_category": { "hard_bounced": [], "soft_bouncing": [], "never_opened": [], "dormant": [] }
}
```

- [ ] **Step 6: Commit**

```bash
cd /c/xampp/htdocs/bbj
git add wp-content/plugins/bigbrotherjunkies-data/src/Email/EmailService.php wp-content/plugins/bigbrotherjunkies-data/src/Api/EmailRoutes.php
git commit -m "feat(email): add /lists/{slug}/problems endpoint for hygiene callout"
```

---

## Task 3: Add bulk-action method + REST route

**Files:**
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Email\EmailService.php`
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\EmailRoutes.php`

- [ ] **Step 1: Add bulkAction to EmailService**

Append to `EmailService.php`, before the closing `}`:

```php
/**
 * Perform a bulk action on subscriber IDs.
 *
 * Actions:
 *   - 'unsubscribe': sets status='unsubscribed', unsubscribed_at=NOW(). Row + list memberships preserved.
 *   - 'delete': removes from list_subscribers (all lists) and subscribers table. Send-history rows in
 *               wp_bbj_email_sends are preserved (orphan subscriber_id is acceptable for historical reporting).
 *
 * @param string $action 'unsubscribe' or 'delete'
 * @param array $subscriberIds Subscriber IDs (capped at 500 in the route).
 * @return array {processed: int, errors: string[]}
 */
public function bulkAction(string $action, array $subscriberIds): array
{
    global $wpdb;

    if (!in_array($action, ['unsubscribe', 'delete'], true)) {
        return ['processed' => 0, 'errors' => ['Invalid action']];
    }
    if (empty($subscriberIds)) {
        return ['processed' => 0, 'errors' => []];
    }

    $subscriberIds = array_values(array_filter(array_map('intval', $subscriberIds)));
    $placeholders = implode(',', array_fill(0, count($subscriberIds), '%d'));

    $subTable = EmailSchema::table(EmailSchema::TABLE_SUBSCRIBERS);
    $lsTable = EmailSchema::table(EmailSchema::TABLE_LIST_SUBSCRIBERS);

    if ($action === 'unsubscribe') {
        $now = current_time('mysql');
        $sql = $wpdb->prepare(
            "UPDATE {$subTable}
             SET status = 'unsubscribed', unsubscribed_at = %s
             WHERE id IN ({$placeholders})",
            ...array_merge([$now], $subscriberIds)
        );
        $result = $wpdb->query($sql);
        return ['processed' => (int) $result, 'errors' => []];
    }

    // action === 'delete'
    $wpdb->query($wpdb->prepare(
        "DELETE FROM {$lsTable} WHERE subscriber_id IN ({$placeholders})",
        ...$subscriberIds
    ));
    $result = $wpdb->query($wpdb->prepare(
        "DELETE FROM {$subTable} WHERE id IN ({$placeholders})",
        ...$subscriberIds
    ));
    return ['processed' => (int) $result, 'errors' => []];
}
```

- [ ] **Step 2: Register the route in EmailRoutes**

In `EmailRoutes.php`, inside `registerRoutes()`, add (after the existing `/email/subscribers/import` route registration, near line ~166):

```php
register_rest_route(self::NAMESPACE, '/email/subscribers/bulk-action', [
    'methods' => 'POST',
    'callback' => [$this, 'bulkSubscriberAction'],
    'permission_callback' => [$this, 'requireAdmin'],
    'args' => [
        'action' => [
            'required' => true,
            'type' => 'string',
            'enum' => ['unsubscribe', 'delete'],
            'sanitize_callback' => 'sanitize_text_field',
        ],
        'subscriber_ids' => [
            'required' => true,
            'type' => 'array',
        ],
    ],
]);
```

- [ ] **Step 3: Add the handler method in EmailRoutes**

Append to `EmailRoutes.php`, before the closing `}` of the class:

```php
public function bulkSubscriberAction(WP_REST_Request $request): WP_REST_Response
{
    $params = $request->get_json_params();
    $action = sanitize_text_field($params['action'] ?? '');
    $ids = $params['subscriber_ids'] ?? [];

    if (!is_array($ids)) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'subscriber_ids must be an array.',
        ], 400);
    }
    if (count($ids) > 500) {
        return new WP_REST_Response([
            'success' => false,
            'message' => 'Maximum 500 subscriber IDs per call. Chunk client-side.',
        ], 400);
    }

    $service = new EmailService();
    $result = $service->bulkAction($action, $ids);

    return new WP_REST_Response([
        'success' => true,
        ...$result,
    ], 200);
}
```

- [ ] **Step 4: Deploy to staging**

```bash
bash .claude/scripts/deploy-plugin.sh --staging
```

- [ ] **Step 5: Verify via curl with a dry-run-style test**

First check the current state of a known test subscriber (use ID 121 — stevebeans on prod, or pick one on staging):

```bash
curl -s -H "Authorization: Bearer $JWT" \
  "https://stg-wp.bigbrotherjunkies.com/wp-json/bbjd/v1/email/subscribers?list=post-notifications&search=stevebeans&per_page=2" \
  | python3 -m json.tool
```

Then call bulk-action with action=unsubscribe on a NON-IMPORTANT test subscriber (use a real-ish ID from staging — NOT your own admin row):

```bash
curl -s -X POST -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
  -d '{"action":"unsubscribe","subscriber_ids":[<TEST_ID>]}' \
  "https://stg-wp.bigbrotherjunkies.com/wp-json/bbjd/v1/email/subscribers/bulk-action" \
  | python3 -m json.tool
```

Expected: `{"success": true, "processed": 1, "errors": []}`. Re-query to confirm `status` flipped to `unsubscribed`.

Then re-subscribe the test row via direct SQL (so the test data isn't left disturbed):

```bash
ssh bbj-staging "wp db query 'UPDATE wp_bbj_email_subscribers SET status=\"subscribed\", unsubscribed_at=NULL WHERE id=<TEST_ID>'"
```

- [ ] **Step 6: Commit**

```bash
cd /c/xampp/htdocs/bbj
git add wp-content/plugins/bigbrotherjunkies-data/src/Email/EmailService.php wp-content/plugins/bigbrotherjunkies-data/src/Api/EmailRoutes.php
git commit -m "feat(email): add bulk-action endpoint for hygiene cleanup"
```

---

## Task 4: Frontend — extend lib/api/mailing.js

**Files:**
- Modify: `C:\xampp\htdocs\bbj-app\src\lib\api\mailing.js`

- [ ] **Step 1: Extend getListSubscribers and add the new helpers**

Replace the existing `getListSubscribers` and append two new exports. Final state of `mailing.js`:

```javascript
/**
 * Mailing API functions (Resend-backed newsletter system)
 * All endpoints require authentication via adminFetch.
 */

import { adminFetch } from "./admin";

export async function getMailingStats() {
  return adminFetch("/email/stats");
}

export async function getMailingLists() {
  return adminFetch("/email/lists");
}

export async function getListSubscribers(
  listSlug = "post-notifications",
  { page = 1, perPage = 20, status = "", search = "", timeframe = "all", flag = "" } = {}
) {
  const params = new URLSearchParams({
    list: listSlug,
    page: String(page),
    per_page: String(perPage),
    timeframe,
  });
  if (status) params.set("status", status);
  if (search) params.set("search", search);
  if (flag) params.set("flag", flag);
  return adminFetch(`/email/subscribers?${params.toString()}`);
}

export async function getListProblems(listSlug) {
  return adminFetch(`/email/lists/${encodeURIComponent(listSlug)}/problems`);
}

export async function bulkSubscriberAction(action, subscriberIds) {
  // Chunks > 500 IDs into 500-row calls to respect the server cap.
  const chunkSize = 500;
  let processed = 0;
  const errors = [];
  for (let i = 0; i < subscriberIds.length; i += chunkSize) {
    const chunk = subscriberIds.slice(i, i + chunkSize);
    const res = await adminFetch("/email/subscribers/bulk-action", {
      method: "POST",
      body: JSON.stringify({ action, subscriber_ids: chunk }),
    });
    processed += res.processed || 0;
    if (res.errors?.length) errors.push(...res.errors);
  }
  return { success: true, processed, errors };
}

export async function sendTestMailingEmail(email = "") {
  return adminFetch("/email/test", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function sendReconfirmation(subscriberIds) {
  return adminFetch("/email/reconfirm", {
    method: "POST",
    body: JSON.stringify({ subscriber_ids: subscriberIds }),
  });
}
```

- [ ] **Step 2: Verify the dev server reloads cleanly**

The dev server (`bash_id: byrwsvux9`) should hot-reload. Check its output file at `/c/Users/sbeli/AppData/Local/Temp/claude/C--xampp-htdocs-bbj-app/bf1711df-bce5-48b3-972c-5ad5a085bf87/tasks/byrwsvux9.output` — should see "Compiled in Xms" with no errors.

- [ ] **Step 3: Commit**

```bash
cd /c/xampp/htdocs/bbj-app
git add src/lib/api/mailing.js
git commit -m "feat(admin): extend mailing API client with problems + bulk-action + timeframe/flag params"
```

---

## Task 5: Sub-nav layout for /admin/mailing/*

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\app\admin\mailing\layout.jsx`

- [ ] **Step 1: Write the layout file**

```jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SUBNAV = [
  { href: "/admin/mailing", label: "Stats", match: (p) => p === "/admin/mailing" },
  { href: "/admin/mailing/lists", label: "Lists", match: (p) => p.startsWith("/admin/mailing/lists") },
];

export default function MailingLayout({ children }) {
  const pathname = usePathname();

  return (
    <div>
      <nav className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 mb-6 -mx-2 px-2" aria-label="Mailing sections">
        {SUBNAV.map((item) => {
          const active = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:3001/admin/mailing — should show "Stats | Lists" tab strip at the top with "Stats" active. Click "Lists" — page will 404 (next task fixes that) but the tab strip should highlight "Lists" as active.

- [ ] **Step 3: Commit**

```bash
cd /c/xampp/htdocs/bbj-app
git add src/app/admin/mailing/layout.jsx
git commit -m "feat(admin): add Stats/Lists sub-nav to mailing section"
```

---

## Task 6: FlagPill component

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\components\mailing\FlagPill.jsx`

- [ ] **Step 1: Write the component**

```jsx
const FLAG_META = {
  hard_bounced: {
    label: "Hard bounced",
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20",
    tip: "Permanent delivery failure. Already auto-unsubscribed by the bounce webhook.",
  },
  soft_bouncing: {
    label: "Soft bouncing",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    tip: "3+ temporary delivery failures. Mailbox is likely abandoned.",
  },
  never_opened: {
    label: "Never opened",
    dot: "bg-orange-500",
    text: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    tip: "Received 5+ emails but never opened. Dead address or aggressive spam filter.",
  },
  dormant: {
    label: "Dormant",
    dot: "bg-slate-500",
    text: "text-slate-700 dark:text-slate-300",
    bg: "bg-slate-100 dark:bg-slate-800",
    tip: "Has not opened any email in 90+ days. Engagement lapsed.",
  },
};

export default function FlagPill({ flag }) {
  const meta = FLAG_META[flag];
  if (!meta) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${meta.bg} ${meta.text}`}
      title={meta.tip}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export { FLAG_META };
```

- [ ] **Step 2: Commit**

```bash
cd /c/xampp/htdocs/bbj-app
git add src/components/mailing/FlagPill.jsx
git commit -m "feat(admin): add FlagPill component for mailing hygiene flags"
```

---

## Task 7: BulkActionBar component

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\components\mailing\BulkActionBar.jsx`

- [ ] **Step 1: Write the component**

```jsx
"use client";

import { useState } from "react";
import { bulkSubscriberAction } from "@/lib/api/mailing";

export default function BulkActionBar({ selectedIds, onClearSelection, onActionComplete }) {
  const [loading, setLoading] = useState(null); // 'unsubscribe' | 'delete' | null
  const [error, setError] = useState(null);

  if (selectedIds.length === 0) return null;

  const run = async (action) => {
    const verb = action === "unsubscribe" ? "Unsubscribe" : "Delete";
    const msg =
      action === "delete"
        ? `Delete ${selectedIds.length} subscriber${selectedIds.length === 1 ? "" : "s"}? This removes them from ALL lists and cannot be undone via the UI.`
        : `Unsubscribe ${selectedIds.length} subscriber${selectedIds.length === 1 ? "" : "s"}? They will stop receiving emails.`;
    if (!confirm(msg)) return;

    setLoading(action);
    setError(null);
    try {
      const res = await bulkSubscriberAction(action, selectedIds);
      onActionComplete?.({ action, processed: res.processed, errors: res.errors });
      onClearSelection?.();
    } catch (err) {
      setError(err.message || `${verb} failed`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="sticky bottom-2 z-30 mt-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 shadow-lg rounded-lg px-4 py-3 flex items-center gap-3">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {selectedIds.length} subscriber{selectedIds.length === 1 ? "" : "s"} selected
        </span>
        <div className="flex-1" />
        {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => run("unsubscribe")}
          className="px-3 py-1.5 text-sm font-medium bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-md transition-colors"
        >
          {loading === "unsubscribe" ? "Unsubscribing…" : "Unsubscribe Selected"}
        </button>
        <button
          type="button"
          disabled={loading !== null}
          onClick={() => run("delete")}
          className="px-3 py-1.5 text-sm font-medium bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-md transition-colors"
        >
          {loading === "delete" ? "Deleting…" : "Delete Selected"}
        </button>
        <button
          type="button"
          onClick={onClearSelection}
          disabled={loading !== null}
          className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/xampp/htdocs/bbj-app
git add src/components/mailing/BulkActionBar.jsx
git commit -m "feat(admin): add BulkActionBar for selected-subscriber cleanup"
```

---

## Task 8: SubscribersTable component

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\components\mailing\SubscribersTable.jsx`

- [ ] **Step 1: Write the component**

```jsx
"use client";

import { useState } from "react";
import FlagPill from "./FlagPill";
import { bulkSubscriberAction } from "@/lib/api/mailing";

const STATUS_STYLES = {
  subscribed: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  unconfirmed: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400",
  unsubscribed: "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300",
  complained: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
};

function fmtDate(s) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" });
}

export default function SubscribersTable({
  subscribers,
  loading,
  selectedIds,
  onToggleId,
  onTogglePage,
  onRowActionComplete,
}) {
  const [rowLoading, setRowLoading] = useState(null);

  const handleRowAction = async (subscriberId, action) => {
    const verb = action === "unsubscribe" ? "Unsubscribe" : "Delete";
    if (!confirm(`${verb} this subscriber?${action === "delete" ? " This removes them from ALL lists and cannot be undone." : ""}`)) return;
    setRowLoading(`${subscriberId}-${action}`);
    try {
      await bulkSubscriberAction(action, [subscriberId]);
      onRowActionComplete?.();
    } catch (err) {
      alert(`Failed: ${err.message || "unknown error"}`);
    } finally {
      setRowLoading(null);
    }
  };

  const pageIds = subscribers.map((s) => s.id);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded" />
        ))}
      </div>
    );
  }

  if (subscribers.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500 dark:text-slate-400 text-sm">
        No subscribers match these filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
            <th className="px-2 py-2 w-8">
              <input
                type="checkbox"
                checked={allOnPageSelected}
                onChange={() => onTogglePage(pageIds, !allOnPageSelected)}
                aria-label="Select all on this page"
              />
            </th>
            <th className="px-2 py-2 font-medium">Email</th>
            <th className="px-2 py-2 font-medium">Status</th>
            <th className="px-2 py-2 font-medium">Flags</th>
            <th className="px-2 py-2 font-medium text-right">Sends</th>
            <th className="px-2 py-2 font-medium text-right">Opens</th>
            <th className="px-2 py-2 font-medium">Last Open</th>
            <th className="px-2 py-2 font-medium text-right">Clicks</th>
            <th className="px-2 py-2 font-medium text-right">Bounces</th>
            <th className="px-2 py-2 font-medium">Subscribed</th>
            <th className="px-2 py-2 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {subscribers.map((s) => {
            const checked = selectedIds.includes(s.id);
            const statusClass = STATUS_STYLES[s.status] || STATUS_STYLES.unsubscribed;
            return (
              <tr key={s.id} className="text-slate-700 dark:text-slate-300">
                <td className="px-2 py-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleId(s.id)}
                    aria-label={`Select ${s.email}`}
                  />
                </td>
                <td className="px-2 py-2 max-w-xs truncate" title={s.email}>{s.email}</td>
                <td className="px-2 py-2">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusClass}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-2 py-2">
                  {s.problem_flags?.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {s.problem_flags.map((f) => <FlagPill key={f} flag={f} />)}
                    </div>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-2 py-2 text-right font-mono">{s.total_sends ?? 0}</td>
                <td className="px-2 py-2 text-right font-mono">{s.total_opens ?? 0}</td>
                <td className="px-2 py-2">{fmtDate(s.last_open_at)}</td>
                <td className="px-2 py-2 text-right font-mono">{s.total_clicks ?? 0}</td>
                <td className="px-2 py-2 text-right font-mono">{s.total_bounces ?? 0}</td>
                <td className="px-2 py-2">{fmtDate(s.subscribed_at || s.created_at)}</td>
                <td className="px-2 py-2 text-right whitespace-nowrap">
                  {s.status !== "unsubscribed" && (
                    <button
                      type="button"
                      onClick={() => handleRowAction(s.id, "unsubscribe")}
                      disabled={rowLoading === `${s.id}-unsubscribe`}
                      className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 hover:underline disabled:opacity-50 mr-3"
                    >
                      {rowLoading === `${s.id}-unsubscribe` ? "…" : "Unsub"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRowAction(s.id, "delete")}
                    disabled={rowLoading === `${s.id}-delete`}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:underline disabled:opacity-50"
                  >
                    {rowLoading === `${s.id}-delete` ? "…" : "Delete"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/xampp/htdocs/bbj-app
git add src/components/mailing/SubscribersTable.jsx
git commit -m "feat(admin): add SubscribersTable with engagement columns + per-row actions"
```

---

## Task 9: ProblemCallout component

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\components\mailing\ProblemCallout.jsx`

- [ ] **Step 1: Write the component**

```jsx
"use client";

import { useState } from "react";
import { bulkSubscriberAction } from "@/lib/api/mailing";
import { FLAG_META } from "./FlagPill";

const CATEGORIES = [
  { key: "hard_bounced", explanation: "Auto-unsubscribed by the webhook — safe to delete to clean up the DB.", defaultAction: "delete" },
  { key: "soft_bouncing", explanation: "3+ temporary delivery failures. Likely abandoned mailboxes.", defaultAction: "unsubscribe" },
  { key: "never_opened", explanation: "5+ emails sent, never opened. Hurts open rate and reputation.", defaultAction: "unsubscribe" },
  { key: "dormant", explanation: "Opened in the past, but nothing in the last 90 days. Engagement lapsed.", defaultAction: "unsubscribe" },
];

export default function ProblemCallout({ summary, byCategory, onActionComplete, onFilterByFlag }) {
  const [busy, setBusy] = useState(null);

  if (!summary) return null;

  if (summary.total_flagged === 0) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 flex items-center gap-3">
        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <div>
          <p className="font-medium text-green-800 dark:text-green-300">List is clean</p>
          <p className="text-sm text-green-700 dark:text-green-400">No subscribers flagged for cleanup right now.</p>
        </div>
      </div>
    );
  }

  const handleBulk = async (categoryKey, action) => {
    const ids = byCategory?.[categoryKey] || [];
    if (ids.length === 0) return;
    const verb = action === "unsubscribe" ? "Unsubscribe" : "Delete";
    const consequence = action === "delete" ? " This removes them from ALL lists and cannot be undone via the UI." : " They will stop receiving emails.";
    if (!confirm(`${verb} ${ids.length} ${FLAG_META[categoryKey]?.label || categoryKey} subscribers?${consequence}`)) return;
    setBusy(`${categoryKey}-${action}`);
    try {
      const res = await bulkSubscriberAction(action, ids);
      onActionComplete?.({ category: categoryKey, action, processed: res.processed });
    } catch (err) {
      alert(`Failed: ${err.message || "unknown"}`);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-300 dark:border-amber-800 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <h2 className="text-base font-osw font-bold text-amber-800 dark:text-amber-200">
          List Hygiene — {summary.total_flagged} subscriber{summary.total_flagged === 1 ? "" : "s"} flagged
        </h2>
      </div>
      <div className="space-y-2">
        {CATEGORIES.map((cat) => {
          const count = summary[cat.key] || 0;
          if (count === 0) return null;
          const meta = FLAG_META[cat.key];
          const busyKey = `${cat.key}-${cat.defaultAction}`;
          const actionLabel = cat.defaultAction === "delete" ? "Delete all" : "Unsubscribe all";
          return (
            <div
              key={cat.key}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white dark:bg-slate-900/50 rounded-md p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 dark:text-white text-sm">
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${meta.dot}`} />
                  {meta.label} <span className="text-slate-500 dark:text-slate-400 font-normal">({count})</span>
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{cat.explanation}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onFilterByFlag?.(cat.key)}
                  className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Review
                </button>
                <button
                  type="button"
                  onClick={() => handleBulk(cat.key, cat.defaultAction)}
                  disabled={busy === busyKey}
                  className={`px-2.5 py-1 text-xs font-medium text-white rounded transition-colors disabled:opacity-60 ${
                    cat.defaultAction === "delete"
                      ? "bg-red-500 hover:bg-red-600"
                      : "bg-amber-500 hover:bg-amber-600"
                  }`}
                >
                  {busy === busyKey ? `${actionLabel}…` : `${actionLabel} (${count})`}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/xampp/htdocs/bbj-app
git add src/components/mailing/ProblemCallout.jsx
git commit -m "feat(admin): add ProblemCallout for list hygiene + bulk cleanup actions"
```

---

## Task 10: Lists overview page

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\app\admin\mailing\lists\page.jsx`

- [ ] **Step 1: Write the page**

```jsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMailingLists } from "@/lib/api/mailing";

function fmtNum(n) {
  return new Intl.NumberFormat().format(n || 0);
}

export default function MailingListsPage() {
  const [lists, setLists] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMailingLists();
        setLists(res.lists || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        <div className="h-7 bg-slate-100 dark:bg-slate-800/50 rounded w-40 mb-6" />
        <div className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded" />
        <div className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-600 dark:text-red-400">
        Error loading lists: {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-osw font-bold text-slate-800 dark:text-white">Lists</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage subscriber lists. Click a list to see engagement details and clean up problem subscribers.
        </p>
      </div>

      {lists.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">No lists yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                <th className="px-2 py-2 font-medium">Name</th>
                <th className="px-2 py-2 font-medium">Slug</th>
                <th className="px-2 py-2 font-medium text-right">Subscribers</th>
                <th className="px-2 py-2 font-medium">Status</th>
                <th className="px-2 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {lists.map((list) => (
                <tr key={list.id} className="text-slate-700 dark:text-slate-300">
                  <td className="px-2 py-3 font-medium text-slate-800 dark:text-white">
                    <Link href={`/admin/mailing/lists/${list.slug}`} className="hover:text-primary-500">
                      {list.name}
                    </Link>
                  </td>
                  <td className="px-2 py-3 font-mono text-xs">{list.slug}</td>
                  <td className="px-2 py-3 text-right font-mono">{fmtNum(list.subscriber_count)}</td>
                  <td className="px-2 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                      list.is_active
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}>
                      {list.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-2 py-3 text-right">
                    <Link
                      href={`/admin/mailing/lists/${list.slug}`}
                      className="text-primary-500 hover:text-primary-600 font-medium"
                    >
                      Manage &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:3001/admin/mailing/lists — should show a table with one row: "Post Notifications · post-notifications · 574 · Active · Manage →"

- [ ] **Step 3: Commit**

```bash
cd /c/xampp/htdocs/bbj-app
git add src/app/admin/mailing/lists/page.jsx
git commit -m "feat(admin): add /admin/mailing/lists overview page"
```

---

## Task 11: List detail page (the main composition)

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\app\admin\mailing\lists\[slug]\page.jsx`

- [ ] **Step 1: Write the page**

```jsx
"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import { getListSubscribers, getListProblems } from "@/lib/api/mailing";
import ProblemCallout from "@/components/mailing/ProblemCallout";
import SubscribersTable from "@/components/mailing/SubscribersTable";
import BulkActionBar from "@/components/mailing/BulkActionBar";

const TIMEFRAMES = [
  { value: "all", label: "All time" },
  { value: "90d", label: "Last 90 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "7d", label: "Last 7 days" },
];

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "subscribed", label: "Subscribed" },
  { value: "unconfirmed", label: "Unconfirmed" },
  { value: "unsubscribed", label: "Unsubscribed" },
  { value: "complained", label: "Complained" },
];

const FLAGS = [
  { value: "", label: "Show all" },
  { value: "hard_bounced", label: "Hard bounced" },
  { value: "soft_bouncing", label: "Soft bouncing" },
  { value: "never_opened", label: "Never opened" },
  { value: "dormant", label: "Dormant" },
];

export default function ListDetailPage({ params }) {
  // Next.js 15: params is now a Promise; use `use()` to unwrap in client components.
  const { slug } = use(params);

  const [problemsData, setProblemsData] = useState(null);
  const [subsData, setSubsData] = useState(null);
  const [loadingSubs, setLoadingSubs] = useState(true);
  const [error, setError] = useState(null);

  const [timeframe, setTimeframe] = useState("all");
  const [statusFilter, setStatusFilter] = useState("");
  const [flagFilter, setFlagFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchProblems = useCallback(async () => {
    try {
      const res = await getListProblems(slug);
      setProblemsData(res);
    } catch (err) {
      setError(err.message);
    }
  }, [slug]);

  const fetchSubs = useCallback(async () => {
    setLoadingSubs(true);
    try {
      const res = await getListSubscribers(slug, {
        page,
        perPage,
        status: statusFilter,
        search,
        timeframe,
        flag: flagFilter,
      });
      setSubsData(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingSubs(false);
    }
  }, [slug, page, perPage, statusFilter, search, timeframe, flagFilter]);

  useEffect(() => { fetchProblems(); }, [fetchProblems]);
  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  const refreshAll = () => {
    fetchProblems();
    fetchSubs();
    setSelectedIds([]);
  };

  const toggleId = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const togglePage = (pageIds, select) => {
    setSelectedIds((prev) => {
      if (select) return Array.from(new Set([...prev, ...pageIds]));
      return prev.filter((id) => !pageIds.includes(id));
    });
  };

  const handleFilterByFlag = (flag) => {
    setFlagFilter(flag);
    setPage(1);
    setSelectedIds([]);
  };

  const subs = subsData?.subscribers || [];
  const total = subsData?.total || 0;
  const totalPages = subsData?.total_pages || 1;
  const list = problemsData?.list;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <Link href="/admin/mailing/lists" className="text-sm text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white">
            &larr; All lists
          </Link>
          <h1 className="text-2xl font-osw font-bold text-slate-800 dark:text-white mt-1">
            {list?.name || slug}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            <span className="font-mono">{slug}</span> · {new Intl.NumberFormat().format(total)} subscribers
          </p>
        </div>
        <button
          type="button"
          onClick={refreshAll}
          className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <ProblemCallout
        summary={problemsData?.summary}
        byCategory={problemsData?.by_category}
        onActionComplete={refreshAll}
        onFilterByFlag={handleFilterByFlag}
      />

      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <label className="flex flex-col text-xs">
          <span className="uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Timeframe</span>
          <select
            value={timeframe}
            onChange={(e) => { setTimeframe(e.target.value); setPage(1); }}
            className="px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
          >
            {TIMEFRAMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col text-xs">
          <span className="uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
          >
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col text-xs">
          <span className="uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Flag</span>
          <select
            value={flagFilter}
            onChange={(e) => { setFlagFilter(e.target.value); setPage(1); }}
            className="px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
          >
            {FLAGS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col text-xs">
          <span className="uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Search email</span>
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="part of an email…"
            className="px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-800 dark:text-white"
          />
        </label>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <SubscribersTable
        subscribers={subs}
        loading={loadingSubs}
        selectedIds={selectedIds}
        onToggleId={toggleId}
        onTogglePage={togglePage}
        onRowActionComplete={refreshAll}
      />

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 text-sm text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span>Page size</span>
          <select
            value={perPage}
            onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
            className="px-2 py-1 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800"
          >
            {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Prev
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            Next
          </button>
        </div>
      </div>

      <BulkActionBar
        selectedIds={selectedIds}
        onClearSelection={() => setSelectedIds([])}
        onActionComplete={refreshAll}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify in browser**

Open http://localhost:3001/admin/mailing/lists/post-notifications. Expected:
- Header shows "Post Notifications", 574 subscribers count
- Problem callout: "List is clean" green box (since opens just started rolling in)
- Filter bar with 4 dropdowns
- Subscribers table with 20 rows showing engagement columns
- Each row has Unsub / Delete buttons
- Pagination at the bottom shows Page 1 of 29 (574 / 20)
- Click a checkbox → BulkActionBar appears at the bottom

Test a per-row Unsub on a single STAGING-ONLY test subscriber (not yourself). Then re-subscribe via direct SQL after verifying.

- [ ] **Step 3: Commit**

```bash
cd /c/xampp/htdocs/bbj-app
git add "src/app/admin/mailing/lists/[slug]/page.jsx"
git commit -m "feat(admin): add list detail page with hygiene callout, filters, bulk cleanup"
```

---

## Task 12: Deploy plugin to production + final smoke test

- [ ] **Step 1: Deploy plugin to production**

```bash
bash .claude/scripts/deploy-plugin.sh
```

Expected: "Deployment complete" with no errors.

- [ ] **Step 2: Flush prod object cache** (defensive — in case any `bbjd_email_settings` reads return stale)

```bash
ssh bbj-prod "cd /home/1620468.cloudwaysapps.com/duesaptjae/public_html && wp cache flush --skip-themes --skip-plugins"
```

Expected: `Success: The cache was flushed.`

- [ ] **Step 3: Smoke test the prod endpoints via curl**

```bash
curl -s -H "Authorization: Bearer $PROD_JWT" \
  "https://wp.bigbrotherjunkies.com/wp-json/bbjd/v1/email/lists/post-notifications/problems" \
  | python3 -m json.tool
```

Expected: 200 OK with `success: true` and the problems summary.

```bash
curl -s -H "Authorization: Bearer $PROD_JWT" \
  "https://wp.bigbrotherjunkies.com/wp-json/bbjd/v1/email/subscribers?list=post-notifications&per_page=2&timeframe=all" \
  | python3 -m json.tool
```

Expected: 200 OK with subscribers carrying `total_sends`, `total_opens`, `problem_flags` etc.

- [ ] **Step 4: Frontend smoke test on prod data**

Set `NEXT_PUBLIC_WORDPRESS_API_URL` to prod temporarily (or use the prod frontend if already deployed). Browse to `/admin/mailing/lists/post-notifications` and verify:
- 574 subscribers shown
- BB28 opens/clicks reflected as they accumulate
- Problem callout either "List is clean" or some flagged categories (depending on timing)
- Bulk select + bulk unsub works on a single safe test ID

- [ ] **Step 5: Final cleanup commit**

If any frontend env config was touched (unlikely), revert it. Then optionally tag the build:

```bash
cd /c/xampp/htdocs/bbj-app
git log --oneline -15
```

Confirm all 12 task commits are present.

---

## Done criteria

- [ ] All three new/extended REST endpoints respond with the documented JSON shape on staging AND prod
- [ ] `/admin/mailing/lists` overview page renders (1 row for post-notifications)
- [ ] `/admin/mailing/lists/post-notifications` renders with: problem callout, filter bar, paginated table with engagement columns + flag pills, per-row Unsub/Delete, bulk select + BulkActionBar
- [ ] Timeframe filter changes engagement column values
- [ ] Flag filter narrows the table to only that flag category
- [ ] Bulk action on a single test subscriber works end-to-end (verified via DB re-query)
- [ ] No regressions in `/admin/mailing` (Stats page still works), `/admin` overview widget (still works)
- [ ] No console errors or compile warnings on `localhost:3001`
