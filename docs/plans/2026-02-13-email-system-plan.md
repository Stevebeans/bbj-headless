# BBJ Email System Implementation Plan

**Goal:** Replace MailPoet with a custom email system using Resend as the delivery provider.

**Architecture:** WordPress plugin handles all email logic (subscribers, lists, sending, webhooks). Next.js provides subscribe widget, unsubscribe page, and wires existing settings toggles. Resend REST API for delivery.

**Tech Stack:** PHP 8.1+ (WP plugin), Resend REST API (cURL), Next.js React components, WordPress `dbDelta` migrations.

**Design Doc:** `docs/plans/2026-02-13-email-system-design.md`

**Plugin Path:** `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\`

---

## Task 1: Database Schema & Migration

**Files:**
- Create: `src/Email/EmailSchema.php`
- Create: `src/Email/EmailMigrator.php`
- Modify: `src/Plugin.php` (add migration call)

**Step 1: Create EmailSchema.php**

Follow the existing `Database\Schema` pattern. Four tables: `bbj_email_subscribers`, `bbj_email_lists`, `bbj_email_list_subscribers`, `bbj_email_sends`.

```php
<?php
namespace BigBrotherJunkies\Data\Email;

class EmailSchema
{
    public const TABLE_SUBSCRIBERS = 'bbj_email_subscribers';
    public const TABLE_LISTS = 'bbj_email_lists';
    public const TABLE_LIST_SUBSCRIBERS = 'bbj_email_list_subscribers';
    public const TABLE_SENDS = 'bbj_email_sends';

    public static function table(string $name): string
    {
        global $wpdb;
        return $wpdb->prefix . $name;
    }

    public static function getSubscribersTableSchema(): string
    {
        $table = self::table(self::TABLE_SUBSCRIBERS);
        $charset = self::getCharset();

        return "CREATE TABLE {$table} (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            user_id BIGINT(20) UNSIGNED DEFAULT NULL,
            email VARCHAR(255) NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'unconfirmed',
            confirm_token VARCHAR(64) DEFAULT NULL,
            source VARCHAR(50) NOT NULL DEFAULT 'widget',
            subscribed_at DATETIME DEFAULT NULL,
            confirmed_at DATETIME DEFAULT NULL,
            unsubscribed_at DATETIME DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY email (email),
            KEY user_id (user_id),
            KEY status (status),
            KEY confirm_token (confirm_token)
        ) {$charset};";
    }

    public static function getListsTableSchema(): string
    {
        $table = self::table(self::TABLE_LISTS);
        $charset = self::getCharset();

        return "CREATE TABLE {$table} (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            slug VARCHAR(50) NOT NULL,
            name VARCHAR(100) NOT NULL,
            description TEXT DEFAULT NULL,
            is_active TINYINT(1) NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY slug (slug)
        ) {$charset};";
    }

    public static function getListSubscribersTableSchema(): string
    {
        $table = self::table(self::TABLE_LIST_SUBSCRIBERS);
        $charset = self::getCharset();

        return "CREATE TABLE {$table} (
            subscriber_id BIGINT(20) UNSIGNED NOT NULL,
            list_id BIGINT(20) UNSIGNED NOT NULL,
            subscribed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (subscriber_id, list_id),
            KEY list_id (list_id)
        ) {$charset};";
    }

    public static function getSendsTableSchema(): string
    {
        $table = self::table(self::TABLE_SENDS);
        $charset = self::getCharset();

        return "CREATE TABLE {$table} (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            subscriber_id BIGINT(20) UNSIGNED NOT NULL,
            list_id BIGINT(20) UNSIGNED DEFAULT NULL,
            subject VARCHAR(255) NOT NULL,
            resend_id VARCHAR(100) DEFAULT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'sent',
            sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            delivered_at DATETIME DEFAULT NULL,
            opened_at DATETIME DEFAULT NULL,
            clicked_at DATETIME DEFAULT NULL,
            bounced_at DATETIME DEFAULT NULL,
            bounce_type VARCHAR(20) DEFAULT NULL,
            PRIMARY KEY (id),
            KEY subscriber_id (subscriber_id),
            KEY resend_id (resend_id),
            KEY status (status),
            KEY list_id (list_id)
        ) {$charset};";
    }

    public static function getAllSchemas(): array
    {
        return [
            self::TABLE_SUBSCRIBERS => self::getSubscribersTableSchema(),
            self::TABLE_LISTS => self::getListsTableSchema(),
            self::TABLE_LIST_SUBSCRIBERS => self::getListSubscribersTableSchema(),
            self::TABLE_SENDS => self::getSendsTableSchema(),
        ];
    }

    private static function getCharset(): string
    {
        global $wpdb;
        return $wpdb->get_charset_collate();
    }
}
```

**Step 2: Create EmailMigrator.php**

```php
<?php
namespace BigBrotherJunkies\Data\Email;

class EmailMigrator
{
    public const DB_VERSION_OPTION = 'bbj_email_db_version';
    public const CURRENT_VERSION = '1.0.0';

    public static function migrate(): array
    {
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        $results = [];
        foreach (EmailSchema::getAllSchemas() as $tableName => $schema) {
            dbDelta($schema);
            $results[$tableName] = self::tableExists($tableName);
        }

        // Seed default list if it doesn't exist
        self::seedDefaultLists();

        update_option(self::DB_VERSION_OPTION, self::CURRENT_VERSION);
        return $results;
    }

    public static function needsMigration(): bool
    {
        return get_option(self::DB_VERSION_OPTION) !== self::CURRENT_VERSION;
    }

    public static function tableExists(string $tableName): bool
    {
        global $wpdb;
        $fullTableName = EmailSchema::table($tableName);
        $result = $wpdb->get_var(
            $wpdb->prepare("SHOW TABLES LIKE %s", $fullTableName)
        );
        return $result === $fullTableName;
    }

    private static function seedDefaultLists(): void
    {
        global $wpdb;
        $table = EmailSchema::table(EmailSchema::TABLE_LISTS);

        $exists = $wpdb->get_var(
            $wpdb->prepare("SELECT id FROM {$table} WHERE slug = %s", 'post-notifications')
        );

        if (!$exists) {
            $wpdb->insert($table, [
                'slug' => 'post-notifications',
                'name' => 'Post Notifications',
                'description' => 'Get notified when new blog posts are published.',
                'is_active' => 1,
            ]);
        }
    }
}
```

**Step 3: Register migration in Plugin.php**

In the `init()` method, add after existing init calls:

```php
$this->initEmail();
```

Add the method:

```php
private function initEmail(): void
{
    // Run migration if needed
    if (\BigBrotherJunkies\Data\Email\EmailMigrator::needsMigration()) {
        \BigBrotherJunkies\Data\Email\EmailMigrator::migrate();
    }
}
```

**Step 4: Verify**

Load any WP admin page. Check that the 4 tables exist by visiting WP Admin or running SQL:
```sql
SHOW TABLES LIKE '%bbj_email%';
```
Should see: `wp_bbj_email_subscribers`, `wp_bbj_email_lists`, `wp_bbj_email_list_subscribers`, `wp_bbj_email_sends`. Also verify `post-notifications` list was seeded in `wp_bbj_email_lists`.

**Step 5: Commit**

```
feat(email): add database schema and migration for email system
```

---

## Task 2: ResendClient

**Files:**
- Create: `src/Email/ResendClient.php`

**Step 1: Create ResendClient.php**

Thin wrapper around Resend's REST API using `wp_remote_post`.

```php
<?php
namespace BigBrotherJunkies\Data\Email;

use BigBrotherJunkies\Data\Admin\Pages\ApiSettingsPage;

class ResendClient
{
    private const API_BASE = 'https://api.resend.com';

    private string $apiKey;
    private string $fromName;
    private string $fromEmail;

    public function __construct()
    {
        $settings = $this->getEmailSettings();
        $this->apiKey = $settings['resend_api_key'] ?? '';
        $this->fromName = $settings['email_from_name'] ?? 'Big Brother Junkies';
        $this->fromEmail = $settings['email_from_address'] ?? 'noreply@bigbrotherjunkies.com';
    }

    /**
     * Send a single email. Returns Resend message ID or null on failure.
     */
    public function send(string $to, string $subject, string $html, array $tags = []): ?string
    {
        $body = [
            'from' => "{$this->fromName} <{$this->fromEmail}>",
            'to' => [$to],
            'subject' => $subject,
            'html' => $html,
        ];

        if (!empty($tags)) {
            $body['tags'] = $tags;
        }

        $response = $this->request('POST', '/emails', $body);

        return $response['id'] ?? null;
    }

    /**
     * Send batch emails (up to 100 per call). Returns array of Resend IDs.
     */
    public function sendBatch(array $emails): array
    {
        $results = [];
        $chunks = array_chunk($emails, 100);

        foreach ($chunks as $chunk) {
            $batch = [];
            foreach ($chunk as $email) {
                $batch[] = [
                    'from' => "{$this->fromName} <{$this->fromEmail}>",
                    'to' => [$email['to']],
                    'subject' => $email['subject'],
                    'html' => $email['html'],
                    'tags' => $email['tags'] ?? [],
                ];
            }

            $response = $this->request('POST', '/emails/batch', $batch);

            if (isset($response['data'])) {
                foreach ($response['data'] as $item) {
                    $results[] = $item['id'] ?? null;
                }
            }
        }

        return $results;
    }

    /**
     * Check if the client is configured with an API key.
     */
    public function isConfigured(): bool
    {
        return !empty($this->apiKey);
    }

    public function getFromAddress(): string
    {
        return $this->fromEmail;
    }

    public function getFromName(): string
    {
        return $this->fromName;
    }

    private function request(string $method, string $endpoint, $body = null): ?array
    {
        if (empty($this->apiKey)) {
            error_log('[BBJ Email] Resend API key not configured');
            return null;
        }

        $args = [
            'method' => $method,
            'headers' => [
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ],
            'timeout' => 30,
        ];

        if ($body !== null) {
            $args['body'] = wp_json_encode($body);
        }

        $response = wp_remote_request(self::API_BASE . $endpoint, $args);

        if (is_wp_error($response)) {
            error_log('[BBJ Email] Resend API error: ' . $response->get_error_message());
            return null;
        }

        $code = wp_remote_retrieve_response_code($response);
        $responseBody = json_decode(wp_remote_retrieve_body($response), true);

        if ($code >= 400) {
            error_log('[BBJ Email] Resend API HTTP ' . $code . ': ' . wp_json_encode($responseBody));
            return null;
        }

        return $responseBody;
    }

    private function getEmailSettings(): array
    {
        return get_option('bbjd_email_settings', []);
    }
}
```

**Step 2: Commit**

```
feat(email): add ResendClient wrapper for Resend REST API
```

---

## Task 3: EmailService — Core Business Logic

**Files:**
- Create: `src/Email/EmailService.php`

**Step 1: Create EmailService.php**

Handles subscribe, confirm, unsubscribe, stats, engagement scoring.

```php
<?php
namespace BigBrotherJunkies\Data\Email;

class EmailService
{
    private ResendClient $resend;

    public function __construct()
    {
        $this->resend = new ResendClient();
    }

    /**
     * Subscribe an email to one or more lists.
     * For anonymous users: creates unconfirmed subscriber + sends confirmation.
     * For logged-in users: creates confirmed subscriber immediately.
     */
    public function subscribe(string $email, string $source, array $listSlugs, ?int $userId = null): array
    {
        global $wpdb;
        $subTable = EmailSchema::table(EmailSchema::TABLE_SUBSCRIBERS);
        $listSubTable = EmailSchema::table(EmailSchema::TABLE_LIST_SUBSCRIBERS);
        $listTable = EmailSchema::table(EmailSchema::TABLE_LISTS);

        // Check if already exists
        $existing = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$subTable} WHERE email = %s", $email)
        );

        if ($existing && $existing->status === 'subscribed') {
            // Already subscribed — just add to any new lists
            $this->addToLists($existing->id, $listSlugs);
            return ['status' => 'already_subscribed', 'subscriber_id' => $existing->id];
        }

        if ($existing && $existing->status === 'unsubscribed') {
            // Re-subscribing — need fresh confirmation
            $token = $this->generateToken();
            $wpdb->update($subTable, [
                'status' => 'unconfirmed',
                'confirm_token' => $token,
                'source' => $source,
                'unsubscribed_at' => null,
            ], ['id' => $existing->id]);

            $this->addToLists($existing->id, $listSlugs);
            $this->sendConfirmationEmail($email, $token);
            return ['status' => 'resubscribed_pending', 'subscriber_id' => $existing->id];
        }

        // New subscriber
        $isLoggedIn = $userId !== null;
        $token = $isLoggedIn ? null : $this->generateToken();
        $status = $isLoggedIn ? 'subscribed' : 'unconfirmed';
        $now = current_time('mysql');

        $wpdb->insert($subTable, [
            'user_id' => $userId,
            'email' => $email,
            'status' => $status,
            'confirm_token' => $token,
            'source' => $source,
            'subscribed_at' => $isLoggedIn ? $now : null,
            'confirmed_at' => $isLoggedIn ? $now : null,
            'created_at' => $now,
        ]);

        $subscriberId = $wpdb->insert_id;
        $this->addToLists($subscriberId, $listSlugs);

        if (!$isLoggedIn) {
            $this->sendConfirmationEmail($email, $token);
        }

        return [
            'status' => $isLoggedIn ? 'subscribed' : 'pending_confirmation',
            'subscriber_id' => $subscriberId,
        ];
    }

    /**
     * Confirm a subscriber via token (double opt-in).
     */
    public function confirm(string $token): bool
    {
        global $wpdb;
        $table = EmailSchema::table(EmailSchema::TABLE_SUBSCRIBERS);

        $subscriber = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$table} WHERE confirm_token = %s AND status = 'unconfirmed'", $token)
        );

        if (!$subscriber) {
            return false;
        }

        $now = current_time('mysql');
        $wpdb->update($table, [
            'status' => 'subscribed',
            'confirm_token' => null,
            'subscribed_at' => $now,
            'confirmed_at' => $now,
        ], ['id' => $subscriber->id]);

        return true;
    }

    /**
     * Unsubscribe by email + token (from email footer link).
     */
    public function unsubscribe(string $email, string $token): bool
    {
        global $wpdb;
        $table = EmailSchema::table(EmailSchema::TABLE_SUBSCRIBERS);

        // Token is a hash of email + secret for verification
        if (!$this->verifyUnsubscribeToken($email, $token)) {
            return false;
        }

        $wpdb->update($table, [
            'status' => 'unsubscribed',
            'unsubscribed_at' => current_time('mysql'),
        ], ['email' => $email]);

        return true;
    }

    /**
     * Get subscribers for a list, paginated.
     */
    public function getSubscribers(string $listSlug, array $filters = []): array
    {
        global $wpdb;
        $subTable = EmailSchema::table(EmailSchema::TABLE_SUBSCRIBERS);
        $listSubTable = EmailSchema::table(EmailSchema::TABLE_LIST_SUBSCRIBERS);
        $listTable = EmailSchema::table(EmailSchema::TABLE_LISTS);

        $page = intval($filters['page'] ?? 1);
        $perPage = intval($filters['per_page'] ?? 25);
        $offset = ($page - 1) * $perPage;
        $status = $filters['status'] ?? null;
        $search = $filters['search'] ?? null;

        $where = ["l.slug = %s"];
        $params = [$listSlug];

        if ($status) {
            $where[] = "s.status = %s";
            $params[] = $status;
        }

        if ($search) {
            $where[] = "s.email LIKE %s";
            $params[] = '%' . $wpdb->esc_like($search) . '%';
        }

        $whereClause = implode(' AND ', $where);

        $total = $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$subTable} s
             JOIN {$listSubTable} ls ON s.id = ls.subscriber_id
             JOIN {$listTable} l ON ls.list_id = l.id
             WHERE {$whereClause}",
            ...$params
        ));

        $params[] = $perPage;
        $params[] = $offset;

        $subscribers = $wpdb->get_results($wpdb->prepare(
            "SELECT s.*, ls.subscribed_at as list_subscribed_at FROM {$subTable} s
             JOIN {$listSubTable} ls ON s.id = ls.subscriber_id
             JOIN {$listTable} l ON ls.list_id = l.id
             WHERE {$whereClause}
             ORDER BY s.created_at DESC
             LIMIT %d OFFSET %d",
            ...$params
        ));

        return [
            'subscribers' => $subscribers,
            'total' => intval($total),
            'page' => $page,
            'per_page' => $perPage,
            'total_pages' => ceil($total / $perPage),
        ];
    }

    /**
     * Get confirmed subscriber emails for a list (for sending).
     */
    public function getActiveSubscriberEmails(string $listSlug): array
    {
        global $wpdb;
        $subTable = EmailSchema::table(EmailSchema::TABLE_SUBSCRIBERS);
        $listSubTable = EmailSchema::table(EmailSchema::TABLE_LIST_SUBSCRIBERS);
        $listTable = EmailSchema::table(EmailSchema::TABLE_LISTS);

        return $wpdb->get_results($wpdb->prepare(
            "SELECT s.id, s.email FROM {$subTable} s
             JOIN {$listSubTable} ls ON s.id = ls.subscriber_id
             JOIN {$listTable} l ON ls.list_id = l.id
             WHERE l.slug = %s AND s.status = 'subscribed' AND l.is_active = 1",
            $listSlug
        ));
    }

    /**
     * Get aggregate stats for admin dashboard.
     */
    public function getStats(): array
    {
        global $wpdb;
        $subTable = EmailSchema::table(EmailSchema::TABLE_SUBSCRIBERS);
        $sendsTable = EmailSchema::table(EmailSchema::TABLE_SENDS);

        $subscriberCounts = $wpdb->get_results(
            "SELECT status, COUNT(*) as count FROM {$subTable} GROUP BY status"
        );

        $counts = [];
        foreach ($subscriberCounts as $row) {
            $counts[$row->status] = intval($row->count);
        }

        // Send stats (last 90 days)
        $sendStats = $wpdb->get_row(
            "SELECT
                COUNT(*) as total_sent,
                SUM(CASE WHEN delivered_at IS NOT NULL THEN 1 ELSE 0 END) as delivered,
                SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) as opened,
                SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) as clicked,
                SUM(CASE WHEN bounced_at IS NOT NULL THEN 1 ELSE 0 END) as bounced
             FROM {$sendsTable}
             WHERE sent_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)"
        );

        $totalSent = intval($sendStats->total_sent ?? 0);

        return [
            'subscribers' => $counts,
            'total_subscribed' => $counts['subscribed'] ?? 0,
            'sends' => [
                'total' => $totalSent,
                'delivered' => intval($sendStats->delivered ?? 0),
                'open_rate' => $totalSent > 0 ? round(($sendStats->opened / $totalSent) * 100, 1) : 0,
                'click_rate' => $totalSent > 0 ? round(($sendStats->clicked / $totalSent) * 100, 1) : 0,
                'bounce_rate' => $totalSent > 0 ? round(($sendStats->bounced / $totalSent) * 100, 1) : 0,
            ],
        ];
    }

    /**
     * Engagement scoring: group subscribers by last open activity.
     */
    public function getEngagementScoring(): array
    {
        global $wpdb;
        $subTable = EmailSchema::table(EmailSchema::TABLE_SUBSCRIBERS);
        $sendsTable = EmailSchema::table(EmailSchema::TABLE_SENDS);

        // Get last open date per subscriber
        $scoring = $wpdb->get_results(
            "SELECT
                CASE
                    WHEN last_open >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 'active'
                    WHEN last_open >= DATE_SUB(NOW(), INTERVAL 90 DAY) THEN 'inactive'
                    WHEN last_open IS NOT NULL THEN 'dormant'
                    ELSE 'never_opened'
                END as engagement,
                COUNT(*) as count
             FROM (
                SELECT s.id, MAX(se.opened_at) as last_open
                FROM {$subTable} s
                LEFT JOIN {$sendsTable} se ON s.id = se.subscriber_id
                WHERE s.status = 'subscribed'
                GROUP BY s.id
             ) sub
             GROUP BY engagement"
        );

        $result = ['active' => 0, 'inactive' => 0, 'dormant' => 0, 'never_opened' => 0];
        foreach ($scoring as $row) {
            $result[$row->engagement] = intval($row->count);
        }

        return $result;
    }

    /**
     * Get recent sends for admin table.
     */
    public function getRecentSends(int $limit = 20): array
    {
        global $wpdb;
        $sendsTable = EmailSchema::table(EmailSchema::TABLE_SENDS);

        // Group by subject + sent_at (rounded to minute) to show per-blast stats
        return $wpdb->get_results($wpdb->prepare(
            "SELECT
                subject,
                MIN(sent_at) as sent_at,
                COUNT(*) as total,
                SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) as opens,
                SUM(CASE WHEN clicked_at IS NOT NULL THEN 1 ELSE 0 END) as clicks,
                SUM(CASE WHEN bounced_at IS NOT NULL THEN 1 ELSE 0 END) as bounces
             FROM {$sendsTable}
             GROUP BY subject, DATE(sent_at)
             ORDER BY sent_at DESC
             LIMIT %d",
            $limit
        ));
    }

    /**
     * Generate unsubscribe token for an email (deterministic, verifiable).
     */
    public function generateUnsubscribeToken(string $email): string
    {
        $secret = $this->getEmailSettings()['unsubscribe_secret'] ?? wp_salt('auth');
        return hash_hmac('sha256', $email, $secret);
    }

    // --- Private helpers ---

    private function addToLists(int $subscriberId, array $listSlugs): void
    {
        global $wpdb;
        $listTable = EmailSchema::table(EmailSchema::TABLE_LISTS);
        $listSubTable = EmailSchema::table(EmailSchema::TABLE_LIST_SUBSCRIBERS);

        foreach ($listSlugs as $slug) {
            $listId = $wpdb->get_var(
                $wpdb->prepare("SELECT id FROM {$listTable} WHERE slug = %s", $slug)
            );

            if ($listId) {
                $wpdb->replace($listSubTable, [
                    'subscriber_id' => $subscriberId,
                    'list_id' => $listId,
                    'subscribed_at' => current_time('mysql'),
                ]);
            }
        }
    }

    private function sendConfirmationEmail(string $email, string $token): void
    {
        $settings = $this->getEmailSettings();
        $siteUrl = get_option('siteurl');
        $confirmUrl = rtrim($settings['frontend_url'] ?? 'https://bigbrotherjunkies.com', '/')
            . '/email/confirm?token=' . urlencode($token);

        $subject = $settings['confirmation_subject'] ?? 'Confirm your subscription to Big Brother Junkies';

        $html = $this->buildConfirmationTemplate($confirmUrl);
        $this->resend->send($email, $subject, $html, [
            ['name' => 'category', 'value' => 'confirmation'],
        ]);
    }

    private function buildConfirmationTemplate(string $confirmUrl): string
    {
        return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
        <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:#35546e;padding:24px;text-align:center;">
            <span style="color:#ffffff;font-size:24px;font-weight:bold;">Big Brother Junkies</span>
        </td></tr>
        <tr><td style="padding:32px 24px;">
            <h1 style="margin:0 0 16px;font-size:22px;color:#1e293b;">Confirm Your Subscription</h1>
            <p style="margin:0 0 24px;font-size:16px;color:#475569;line-height:1.6;">
                Thanks for subscribing! Click the button below to confirm your email and start receiving updates.
            </p>
            <table cellpadding="0" cellspacing="0"><tr><td style="background:#35546e;border-radius:6px;">
                <a href="' . esc_url($confirmUrl) . '" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;">
                    Confirm Subscription
                </a>
            </td></tr></table>
            <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">
                If you didn\'t request this, just ignore this email.
            </p>
        </td></tr>
        </table>
        </td></tr></table></body></html>';
    }

    private function verifyUnsubscribeToken(string $email, string $token): bool
    {
        return hash_equals($this->generateUnsubscribeToken($email), $token);
    }

    private function generateToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    private function getEmailSettings(): array
    {
        return get_option('bbjd_email_settings', []);
    }
}
```

**Step 2: Commit**

```
feat(email): add EmailService with subscribe, confirm, unsubscribe, and stats
```

---

## Task 4: EmailSender — Post Notification Orchestration

**Files:**
- Create: `src/Email/EmailSender.php`

**Step 1: Create EmailSender.php**

Handles building the post notification template and batch sending. Hooks into WordPress `transition_post_status`.

```php
<?php
namespace BigBrotherJunkies\Data\Email;

class EmailSender
{
    private EmailService $service;
    private ResendClient $resend;

    public function __construct()
    {
        $this->service = new EmailService();
        $this->resend = new ResendClient();
    }

    /**
     * Register WordPress hooks.
     */
    public function init(): void
    {
        add_action('transition_post_status', [$this, 'onPostStatusChange'], 10, 3);
    }

    /**
     * Fires when a post transitions to 'publish' status.
     */
    public function onPostStatusChange(string $newStatus, string $oldStatus, \WP_Post $post): void
    {
        // Only trigger on new publishes (not updates)
        if ($newStatus !== 'publish' || $oldStatus === 'publish') {
            return;
        }

        // Only for blog posts
        if ($post->post_type !== 'post') {
            return;
        }

        // Check if sending is paused
        $settings = get_option('bbjd_email_settings', []);
        if (!empty($settings['pause_sending'])) {
            return;
        }

        // Send asynchronously via WP cron to avoid blocking publish
        wp_schedule_single_event(time(), 'bbj_send_post_notification', [$post->ID]);
    }

    /**
     * Send post notification to all subscribers on the post-notifications list.
     */
    public function sendPostNotification(int $postId): void
    {
        $post = get_post($postId);
        if (!$post) {
            return;
        }

        if (!$this->resend->isConfigured()) {
            error_log('[BBJ Email] Cannot send post notification - Resend not configured');
            return;
        }

        $subscribers = $this->service->getActiveSubscriberEmails('post-notifications');
        if (empty($subscribers)) {
            return;
        }

        $subject = 'New on BBJ: ' . html_entity_decode($post->post_title, ENT_QUOTES, 'UTF-8');
        $html = $this->buildPostNotificationTemplate($post);

        // Build batch
        $emails = [];
        foreach ($subscribers as $sub) {
            $unsubToken = $this->service->generateUnsubscribeToken($sub->email);
            $emailHtml = $this->injectUnsubscribeLink($html, $sub->email, $unsubToken);

            $emails[] = [
                'to' => $sub->email,
                'subject' => $subject,
                'html' => $emailHtml,
                'tags' => [
                    ['name' => 'category', 'value' => 'post_notification'],
                    ['name' => 'post_id', 'value' => (string) $postId],
                ],
            ];
        }

        $resendIds = $this->resend->sendBatch($emails);

        // Record sends
        $this->recordSends($subscribers, $resendIds, $subject);
    }

    /**
     * Send re-confirmation campaign to dormant subscribers.
     */
    public function sendReconfirmation(array $subscriberIds): int
    {
        global $wpdb;
        $subTable = EmailSchema::table(EmailSchema::TABLE_SUBSCRIBERS);

        if (empty($subscriberIds)) {
            return 0;
        }

        $placeholders = implode(',', array_fill(0, count($subscriberIds), '%d'));
        $subscribers = $wpdb->get_results($wpdb->prepare(
            "SELECT id, email FROM {$subTable} WHERE id IN ({$placeholders}) AND status = 'subscribed'",
            ...$subscriberIds
        ));

        if (empty($subscribers)) {
            return 0;
        }

        $settings = get_option('bbjd_email_settings', []);
        $frontendUrl = rtrim($settings['frontend_url'] ?? 'https://bigbrotherjunkies.com', '/');
        $subject = 'BB Season is Coming — Still want updates from BBJ?';

        $emails = [];
        foreach ($subscribers as $sub) {
            // Generate a fresh confirm token for re-confirmation
            $token = bin2hex(random_bytes(32));
            $wpdb->update($subTable, [
                'status' => 'unconfirmed',
                'confirm_token' => $token,
            ], ['id' => $sub->id]);

            $confirmUrl = $frontendUrl . '/email/confirm?token=' . urlencode($token);
            $html = $this->buildReconfirmationTemplate($confirmUrl);

            $emails[] = [
                'to' => $sub->email,
                'subject' => $subject,
                'html' => $html,
                'tags' => [
                    ['name' => 'category', 'value' => 'reconfirmation'],
                ],
            ];
        }

        $this->resend->sendBatch($emails);

        return count($subscribers);
    }

    /**
     * Send a test email to the admin.
     */
    public function sendTestEmail(string $toEmail): bool
    {
        // Build a fake post notification using the latest post
        $latestPost = get_posts(['numberposts' => 1, 'post_status' => 'publish']);
        if (empty($latestPost)) {
            return false;
        }

        $post = $latestPost[0];
        $subject = '[TEST] New on BBJ: ' . html_entity_decode($post->post_title, ENT_QUOTES, 'UTF-8');
        $html = $this->buildPostNotificationTemplate($post);
        $html = $this->injectUnsubscribeLink($html, $toEmail, 'test-token');

        return $this->resend->send($toEmail, $subject, $html) !== null;
    }

    // --- Private helpers ---

    private function buildPostNotificationTemplate(\WP_Post $post): string
    {
        $title = html_entity_decode($post->post_title, ENT_QUOTES, 'UTF-8');
        $excerpt = wp_trim_words(wp_strip_all_tags($post->post_content), 40);
        $permalink = get_permalink($post);
        $thumbnail = get_the_post_thumbnail_url($post, 'medium_large');

        $imageBlock = '';
        if ($thumbnail) {
            $imageBlock = '<tr><td style="padding:0;">
                <a href="' . esc_url($permalink) . '">
                    <img src="' . esc_url($thumbnail) . '" alt="" style="width:100%;height:auto;display:block;border-radius:4px 4px 0 0;" />
                </a>
            </td></tr>';
        }

        return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
        <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:#35546e;padding:20px 24px;text-align:center;">
            <span style="color:#ffffff;font-size:22px;font-weight:bold;">Big Brother Junkies</span>
        </td></tr>
        ' . $imageBlock . '
        <tr><td style="padding:24px;">
            <h1 style="margin:0 0 12px;font-size:22px;color:#1e293b;">
                <a href="' . esc_url($permalink) . '" style="color:#35546e;text-decoration:none;">' . esc_html($title) . '</a>
            </h1>
            <p style="margin:0 0 20px;font-size:15px;color:#475569;line-height:1.6;">' . esc_html($excerpt) . '</p>
            <table cellpadding="0" cellspacing="0"><tr><td style="background:#35546e;border-radius:6px;">
                <a href="' . esc_url($permalink) . '" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;">
                    Read More &rarr;
                </a>
            </td></tr></table>
        </td></tr>
        <tr><td style="padding:16px 24px;border-top:1px solid #e2e8f0;text-align:center;font-size:12px;color:#94a3b8;">
            Big Brother Junkies &bull; {{UNSUBSCRIBE_LINK}}
        </td></tr>
        </table>
        </td></tr></table></body></html>';
    }

    private function buildReconfirmationTemplate(string $confirmUrl): string
    {
        return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
        <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">
        <tr><td style="background:#35546e;padding:24px;text-align:center;">
            <span style="color:#ffffff;font-size:24px;font-weight:bold;">Big Brother Junkies</span>
        </td></tr>
        <tr><td style="padding:32px 24px;">
            <h1 style="margin:0 0 16px;font-size:22px;color:#1e293b;">BB Season is Almost Here!</h1>
            <p style="margin:0 0 24px;font-size:16px;color:#475569;line-height:1.6;">
                We\'re cleaning up our mailing list for the new season. If you still want to receive post notifications from Big Brother Junkies, click below to stay on our list.
            </p>
            <table cellpadding="0" cellspacing="0"><tr><td style="background:#35546e;border-radius:6px;">
                <a href="' . esc_url($confirmUrl) . '" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:16px;font-weight:bold;">
                    Keep Me Subscribed
                </a>
            </td></tr></table>
            <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;">
                No action needed if you want to unsubscribe — we\'ll remove you automatically.
            </p>
        </td></tr>
        </table>
        </td></tr></table></body></html>';
    }

    private function injectUnsubscribeLink(string $html, string $email, string $token): string
    {
        $settings = get_option('bbjd_email_settings', []);
        $frontendUrl = rtrim($settings['frontend_url'] ?? 'https://bigbrotherjunkies.com', '/');
        $unsubUrl = $frontendUrl . '/unsubscribe?email=' . urlencode($email) . '&token=' . urlencode($token);

        $link = '<a href="' . esc_url($unsubUrl) . '" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a>';
        return str_replace('{{UNSUBSCRIBE_LINK}}', $link, $html);
    }

    private function recordSends(array $subscribers, array $resendIds, string $subject): void
    {
        global $wpdb;
        $sendsTable = EmailSchema::table(EmailSchema::TABLE_SENDS);
        $listTable = EmailSchema::table(EmailSchema::TABLE_LISTS);

        $listId = $wpdb->get_var(
            $wpdb->prepare("SELECT id FROM {$listTable} WHERE slug = %s", 'post-notifications')
        );

        foreach ($subscribers as $i => $sub) {
            $wpdb->insert($sendsTable, [
                'subscriber_id' => $sub->id,
                'list_id' => $listId,
                'subject' => $subject,
                'resend_id' => $resendIds[$i] ?? null,
                'status' => 'sent',
                'sent_at' => current_time('mysql'),
            ]);
        }
    }
}
```

**Step 2: Register in Plugin.php**

In the `initEmail()` method, add after migration:

```php
private function initEmail(): void
{
    if (\BigBrotherJunkies\Data\Email\EmailMigrator::needsMigration()) {
        \BigBrotherJunkies\Data\Email\EmailMigrator::migrate();
    }

    $emailSender = new \BigBrotherJunkies\Data\Email\EmailSender();
    $emailSender->init();

    // WP Cron hook for async post notifications
    add_action('bbj_send_post_notification', function (int $postId) {
        $sender = new \BigBrotherJunkies\Data\Email\EmailSender();
        $sender->sendPostNotification($postId);
    });

    // Email API routes
    $emailRoutes = new \BigBrotherJunkies\Data\Api\EmailRoutes();
    $emailRoutes->init();
}
```

**Step 3: Commit**

```
feat(email): add EmailSender with post notification templates and WP hooks
```

---

## Task 5: EmailRoutes — REST API

**Files:**
- Create: `src/Api/EmailRoutes.php`

**Step 1: Create EmailRoutes.php**

All REST endpoints for the email system.

```php
<?php
namespace BigBrotherJunkies\Data\Api;

use BigBrotherJunkies\Data\Email\EmailService;
use BigBrotherJunkies\Data\Email\EmailSender;
use WP_REST_Request;
use WP_REST_Response;

class EmailRoutes
{
    private const NAMESPACE = 'bbjd/v1';

    public function init(): void
    {
        add_action('rest_api_init', [$this, 'registerRoutes']);
    }

    public function registerRoutes(): void
    {
        // Public: subscribe
        register_rest_route(self::NAMESPACE, '/email/subscribe', [
            'methods' => 'POST',
            'callback' => [$this, 'subscribe'],
            'permission_callback' => '__return_true',
            'args' => [
                'email' => ['required' => true, 'type' => 'string', 'format' => 'email'],
                'list' => ['required' => false, 'type' => 'string', 'default' => 'post-notifications'],
            ],
        ]);

        // Public: confirm
        register_rest_route(self::NAMESPACE, '/email/confirm/(?P<token>[a-f0-9]+)', [
            'methods' => 'GET',
            'callback' => [$this, 'confirm'],
            'permission_callback' => '__return_true',
        ]);

        // Public: unsubscribe
        register_rest_route(self::NAMESPACE, '/email/unsubscribe', [
            'methods' => 'GET',
            'callback' => [$this, 'unsubscribe'],
            'permission_callback' => '__return_true',
            'args' => [
                'email' => ['required' => true, 'type' => 'string'],
                'token' => ['required' => true, 'type' => 'string'],
            ],
        ]);

        // Auth: preferences
        register_rest_route(self::NAMESPACE, '/email/preferences', [
            'methods' => ['GET', 'PUT'],
            'callback' => [$this, 'preferences'],
            'permission_callback' => function () {
                return is_user_logged_in();
            },
        ]);

        // Webhook: Resend events
        register_rest_route(self::NAMESPACE, '/email/webhook/resend', [
            'methods' => 'POST',
            'callback' => [$this, 'handleWebhook'],
            'permission_callback' => '__return_true',
        ]);

        // Admin: stats
        register_rest_route(self::NAMESPACE, '/email/stats', [
            'methods' => 'GET',
            'callback' => [$this, 'getStats'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
        ]);

        // Admin: subscribers list
        register_rest_route(self::NAMESPACE, '/email/subscribers', [
            'methods' => 'GET',
            'callback' => [$this, 'getSubscribers'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
        ]);

        // Admin: import
        register_rest_route(self::NAMESPACE, '/email/subscribers/import', [
            'methods' => 'POST',
            'callback' => [$this, 'importSubscribers'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
        ]);

        // Admin: re-confirmation campaign
        register_rest_route(self::NAMESPACE, '/email/reconfirm', [
            'methods' => 'POST',
            'callback' => [$this, 'sendReconfirmation'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
        ]);

        // Admin: send test email
        register_rest_route(self::NAMESPACE, '/email/test', [
            'methods' => 'POST',
            'callback' => [$this, 'sendTestEmail'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
        ]);

        // Admin: lists CRUD
        register_rest_route(self::NAMESPACE, '/email/lists', [
            'methods' => 'GET',
            'callback' => [$this, 'getLists'],
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
        ]);
    }

    public function subscribe(WP_REST_Request $request): WP_REST_Response
    {
        $email = sanitize_email($request->get_param('email'));
        $list = sanitize_text_field($request->get_param('list'));

        if (!is_email($email)) {
            return new WP_REST_Response(['error' => 'Invalid email address'], 400);
        }

        $service = new EmailService();
        $userId = is_user_logged_in() ? get_current_user_id() : null;
        $result = $service->subscribe($email, 'widget', [$list], $userId);

        return new WP_REST_Response($result, 200);
    }

    public function confirm(WP_REST_Request $request): WP_REST_Response
    {
        $token = $request->get_param('token');
        $service = new EmailService();
        $success = $service->confirm($token);

        return new WP_REST_Response([
            'success' => $success,
            'message' => $success ? 'Subscription confirmed!' : 'Invalid or expired token.',
        ], $success ? 200 : 400);
    }

    public function unsubscribe(WP_REST_Request $request): WP_REST_Response
    {
        $email = sanitize_email($request->get_param('email'));
        $token = sanitize_text_field($request->get_param('token'));

        $service = new EmailService();
        $success = $service->unsubscribe($email, $token);

        return new WP_REST_Response([
            'success' => $success,
            'message' => $success ? 'You have been unsubscribed.' : 'Invalid unsubscribe link.',
        ], $success ? 200 : 400);
    }

    public function preferences(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;
        $userId = get_current_user_id();
        $service = new EmailService();
        $subTable = \BigBrotherJunkies\Data\Email\EmailSchema::table(\BigBrotherJunkies\Data\Email\EmailSchema::TABLE_SUBSCRIBERS);
        $listSubTable = \BigBrotherJunkies\Data\Email\EmailSchema::table(\BigBrotherJunkies\Data\Email\EmailSchema::TABLE_LIST_SUBSCRIBERS);
        $listTable = \BigBrotherJunkies\Data\Email\EmailSchema::table(\BigBrotherJunkies\Data\Email\EmailSchema::TABLE_LISTS);

        if ($request->get_method() === 'GET') {
            // Get user's list memberships
            $subscriber = $wpdb->get_row(
                $wpdb->prepare("SELECT id FROM {$subTable} WHERE user_id = %d AND status = 'subscribed'", $userId)
            );

            if (!$subscriber) {
                return new WP_REST_Response(['lists' => []], 200);
            }

            $lists = $wpdb->get_results($wpdb->prepare(
                "SELECT l.slug, l.name FROM {$listTable} l
                 JOIN {$listSubTable} ls ON l.id = ls.list_id
                 WHERE ls.subscriber_id = %d AND l.is_active = 1",
                $subscriber->id
            ));

            return new WP_REST_Response(['lists' => $lists], 200);
        }

        // PUT — update preferences
        $enabledLists = $request->get_param('lists') ?? [];
        $user = wp_get_current_user();

        // Ensure subscriber exists
        $subscriber = $wpdb->get_row(
            $wpdb->prepare("SELECT id FROM {$subTable} WHERE user_id = %d", $userId)
        );

        if (!$subscriber) {
            // Create subscriber for this user
            $result = $service->subscribe($user->user_email, 'settings', $enabledLists, $userId);
            return new WP_REST_Response(['success' => true, 'result' => $result], 200);
        }

        // Remove from all lists, then add to selected
        $wpdb->delete($listSubTable, ['subscriber_id' => $subscriber->id]);

        if (!empty($enabledLists)) {
            foreach ($enabledLists as $slug) {
                $listId = $wpdb->get_var(
                    $wpdb->prepare("SELECT id FROM {$listTable} WHERE slug = %s", $slug)
                );
                if ($listId) {
                    $wpdb->insert($listSubTable, [
                        'subscriber_id' => $subscriber->id,
                        'list_id' => $listId,
                        'subscribed_at' => current_time('mysql'),
                    ]);
                }
            }
        }

        return new WP_REST_Response(['success' => true], 200);
    }

    public function handleWebhook(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;
        $sendsTable = \BigBrotherJunkies\Data\Email\EmailSchema::table(\BigBrotherJunkies\Data\Email\EmailSchema::TABLE_SENDS);
        $subTable = \BigBrotherJunkies\Data\Email\EmailSchema::table(\BigBrotherJunkies\Data\Email\EmailSchema::TABLE_SUBSCRIBERS);

        // Verify webhook signature (Resend uses Svix)
        $settings = get_option('bbjd_email_settings', []);
        $webhookSecret = $settings['resend_webhook_secret'] ?? '';

        if (!empty($webhookSecret)) {
            $svixId = $request->get_header('svix-id');
            $svixTimestamp = $request->get_header('svix-timestamp');
            $svixSignature = $request->get_header('svix-signature');

            if (!$svixId || !$svixTimestamp || !$svixSignature) {
                return new WP_REST_Response(['error' => 'Missing signature headers'], 401);
            }

            // Basic timestamp check (within 5 minutes)
            if (abs(time() - intval($svixTimestamp)) > 300) {
                return new WP_REST_Response(['error' => 'Timestamp too old'], 401);
            }

            $payload = $request->get_body();
            $toSign = "{$svixId}.{$svixTimestamp}.{$payload}";
            $secret = base64_decode(str_replace('whsec_', '', $webhookSecret));
            $expectedSignature = base64_encode(hash_hmac('sha256', $toSign, $secret, true));

            $signatures = explode(' ', $svixSignature);
            $valid = false;
            foreach ($signatures as $sig) {
                $sigPart = ltrim($sig, 'v1,');
                if (hash_equals($expectedSignature, $sigPart)) {
                    $valid = true;
                    break;
                }
            }

            if (!$valid) {
                return new WP_REST_Response(['error' => 'Invalid signature'], 401);
            }
        }

        $body = $request->get_json_params();
        $type = $body['type'] ?? '';
        $data = $body['data'] ?? [];
        $emailId = $data['email_id'] ?? '';

        if (empty($emailId)) {
            return new WP_REST_Response(['ok' => true], 200);
        }

        $now = current_time('mysql');

        switch ($type) {
            case 'email.delivered':
                $wpdb->update($sendsTable, [
                    'status' => 'delivered',
                    'delivered_at' => $now,
                ], ['resend_id' => $emailId]);
                break;

            case 'email.opened':
                $wpdb->update($sendsTable, [
                    'status' => 'opened',
                    'opened_at' => $now,
                ], ['resend_id' => $emailId]);
                break;

            case 'email.clicked':
                $wpdb->update($sendsTable, [
                    'status' => 'clicked',
                    'clicked_at' => $now,
                ], ['resend_id' => $emailId]);
                break;

            case 'email.bounced':
                $bounceType = ($data['bounce']['type'] ?? '') === 'Permanent' ? 'hard' : 'soft';
                $wpdb->update($sendsTable, [
                    'status' => 'bounced',
                    'bounced_at' => $now,
                    'bounce_type' => $bounceType,
                ], ['resend_id' => $emailId]);

                // Auto-unsubscribe on hard bounce
                if ($bounceType === 'hard') {
                    $send = $wpdb->get_row(
                        $wpdb->prepare("SELECT subscriber_id FROM {$sendsTable} WHERE resend_id = %s", $emailId)
                    );
                    if ($send) {
                        $wpdb->update($subTable, ['status' => 'bounced'], ['id' => $send->subscriber_id]);
                    }
                }
                break;

            case 'email.complained':
                $wpdb->update($sendsTable, ['status' => 'complained'], ['resend_id' => $emailId]);
                $send = $wpdb->get_row(
                    $wpdb->prepare("SELECT subscriber_id FROM {$sendsTable} WHERE resend_id = %s", $emailId)
                );
                if ($send) {
                    $wpdb->update($subTable, ['status' => 'unsubscribed', 'unsubscribed_at' => $now], ['id' => $send->subscriber_id]);
                }
                break;
        }

        return new WP_REST_Response(['ok' => true], 200);
    }

    public function getStats(WP_REST_Request $request): WP_REST_Response
    {
        $service = new EmailService();
        return new WP_REST_Response([
            'stats' => $service->getStats(),
            'engagement' => $service->getEngagementScoring(),
            'recent_sends' => $service->getRecentSends(),
        ], 200);
    }

    public function getSubscribers(WP_REST_Request $request): WP_REST_Response
    {
        $service = new EmailService();
        $result = $service->getSubscribers(
            $request->get_param('list') ?? 'post-notifications',
            [
                'page' => $request->get_param('page') ?? 1,
                'per_page' => $request->get_param('per_page') ?? 25,
                'status' => $request->get_param('status'),
                'search' => $request->get_param('search'),
            ]
        );
        return new WP_REST_Response($result, 200);
    }

    public function importSubscribers(WP_REST_Request $request): WP_REST_Response
    {
        $emails = $request->get_param('emails') ?? [];
        $list = $request->get_param('list') ?? 'post-notifications';
        $service = new EmailService();

        $imported = 0;
        $skipped = 0;

        foreach ($emails as $email) {
            $email = sanitize_email($email);
            if (!is_email($email)) {
                $skipped++;
                continue;
            }

            $result = $service->subscribe($email, 'import', [$list]);
            if ($result['status'] === 'already_subscribed') {
                $skipped++;
            } else {
                $imported++;
            }
        }

        return new WP_REST_Response([
            'imported' => $imported,
            'skipped' => $skipped,
            'total' => count($emails),
        ], 200);
    }

    public function sendReconfirmation(WP_REST_Request $request): WP_REST_Response
    {
        $subscriberIds = $request->get_param('subscriber_ids') ?? [];
        $sender = new EmailSender();
        $sent = $sender->sendReconfirmation($subscriberIds);

        return new WP_REST_Response(['sent' => $sent], 200);
    }

    public function sendTestEmail(WP_REST_Request $request): WP_REST_Response
    {
        $email = sanitize_email($request->get_param('email') ?? wp_get_current_user()->user_email);
        $sender = new EmailSender();
        $success = $sender->sendTestEmail($email);

        return new WP_REST_Response([
            'success' => $success,
            'message' => $success ? 'Test email sent!' : 'Failed to send test email. Check Resend API key.',
        ], 200);
    }

    public function getLists(WP_REST_Request $request): WP_REST_Response
    {
        global $wpdb;
        $listTable = \BigBrotherJunkies\Data\Email\EmailSchema::table(\BigBrotherJunkies\Data\Email\EmailSchema::TABLE_LISTS);
        $listSubTable = \BigBrotherJunkies\Data\Email\EmailSchema::table(\BigBrotherJunkies\Data\Email\EmailSchema::TABLE_LIST_SUBSCRIBERS);
        $subTable = \BigBrotherJunkies\Data\Email\EmailSchema::table(\BigBrotherJunkies\Data\Email\EmailSchema::TABLE_SUBSCRIBERS);

        $lists = $wpdb->get_results(
            "SELECT l.*,
                    COUNT(CASE WHEN s.status = 'subscribed' THEN 1 END) as subscriber_count
             FROM {$listTable} l
             LEFT JOIN {$listSubTable} ls ON l.id = ls.list_id
             LEFT JOIN {$subTable} s ON ls.subscriber_id = s.id
             GROUP BY l.id
             ORDER BY l.created_at ASC"
        );

        return new WP_REST_Response($lists, 200);
    }
}
```

**Step 2: Commit**

```
feat(email): add EmailRoutes with subscribe, webhook, and admin endpoints
```

---

## Task 6: WP Admin — Email Settings Page

**Files:**
- Create: `src/Admin/Pages/EmailSettingsPage.php`
- Modify: `src/Plugin.php` (register admin page)

This page stores Resend API key, from address, webhook secret, and pause toggle. Uses the existing `bbjd_email_settings` option.

**Step 1: Create EmailSettingsPage.php**

Follow the `SettingsPage.php` pattern: `handleActions()` for form save, `render()` for HTML. Fields: Resend API key, from name, from email, reply-to, webhook secret, confirmation subject, frontend URL, pause toggle, dormant threshold (days).

**Step 2: Register in Plugin.php admin menu**

Add to `initAdmin()` and `registerAdminMenus()`. Create a top-level "BBJ Mailing" menu with 4 subpages: Lists, Stats, Emails, Settings.

**Step 3: Verify**

Visit WP Admin → BBJ Mailing → Settings. Save a test API key and confirm it persists.

**Step 4: Commit**

```
feat(email): add WP admin email settings page
```

---

## Task 7: WP Admin — Lists, Stats, Emails Pages

**Files:**
- Create: `src/Admin/Pages/EmailListsPage.php`
- Create: `src/Admin/Pages/EmailStatsPage.php`
- Create: `src/Admin/Pages/EmailsPage.php`
- Modify: `src/Plugin.php` (register pages)

**Step 1: Create EmailListsPage.php**

Table showing all lists with subscriber counts. Click into a list shows paginated subscriber table with status badges, search, filter by status.

**Step 2: Create EmailStatsPage.php**

Fetches stats from `EmailService::getStats()` and `getEngagementScoring()`. Renders 4 stat cards, recent sends table, engagement groups, recommendations panel.

**Step 3: Create EmailsPage.php**

Shows email types (Post Notification), last sent info, "Send Test Email" button, re-confirmation section with dormant subscriber selector.

**Step 4: Register all pages in Plugin.php**

```php
add_menu_page(
    'BBJ Mailing',
    'BBJ Mailing',
    'manage_options',
    'bbjd-mailing',
    [$this->adminPages['email_lists'], 'render'],
    'dashicons-email-alt',
    30
);
// Subpages: Lists (default), Stats, Emails, Settings
```

**Step 5: Verify**

Visit each admin page, confirm they render with proper styling and data.

**Step 6: Commit**

```
feat(email): add WP admin pages for lists, stats, and emails
```

---

## Task 8: Frontend — Subscribe Widget

**Files:**
- Create: `src/components/email/SubscribeWidget.jsx`
- Modify: `src/components/layout/Sidebar.jsx` (add widget)

**Step 1: Create SubscribeWidget.jsx**

Client component. Email input + "Subscribe" button. Posts to `/bbjd/v1/email/subscribe`. States: idle, loading, success, error. If user is logged in (via `useAuth`), auto-fill email and pass user context.

```jsx
"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

export function SubscribeWidget() {
  const { user, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submitEmail = isAuthenticated ? user?.user_email : email;

    if (!submitEmail) return;

    setStatus("loading");
    try {
      const res = await fetch(`${API_URL}/bbjd/v1/email/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: submitEmail, list: "post-notifications" }),
      });
      const data = await res.json();

      if (data.status === "already_subscribed") {
        setStatus("success");
        setMessage("You're already subscribed!");
      } else if (data.status === "pending_confirmation") {
        setStatus("success");
        setMessage("Check your inbox to confirm!");
      } else {
        setStatus("success");
        setMessage("You're subscribed!");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="card p-4 text-center">
        <p className="text-green-600 dark:text-green-400 font-medium">{message}</p>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <h3 className="font-osw text-lg uppercase text-primary-500 dark:text-primary-400 mb-2">
        Get Notified
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        New post alerts straight to your inbox.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        {!isAuthenticated && (
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            required
            className="input flex-1 text-sm"
          />
        )}
        <button
          type="submit"
          disabled={status === "loading"}
          className="btn-primary text-sm whitespace-nowrap"
        >
          {status === "loading" ? "..." : isAuthenticated ? "Subscribe" : "Subscribe"}
        </button>
      </form>
      {status === "error" && (
        <p className="text-red-500 text-xs mt-2">{message}</p>
      )}
    </div>
  );
}
```

**Step 2: Add to Sidebar**

Import and render `<SubscribeWidget />` in the sidebar component.

**Step 3: Commit**

```
feat(email): add subscribe widget component for sidebar
```

---

## Task 9: Frontend — Confirm & Unsubscribe Pages

**Files:**
- Create: `src/app/email/confirm/page.jsx`
- Create: `src/app/unsubscribe/page.jsx`

**Step 1: Create confirm page**

Server component that reads `?token=` from URL. Calls the confirm API endpoint. Shows success or error message.

**Step 2: Create unsubscribe page**

Client component that reads `?email=` and `?token=` from URL. Calls unsubscribe API on load. Shows "You've been unsubscribed" with optional re-subscribe button and feedback radio (too many / not relevant / other).

**Step 3: Commit**

```
feat(email): add email confirmation and unsubscribe pages
```

---

## Task 10: Frontend — Wire Settings Notifications Tab

**Files:**
- Modify: `src/app/settings/page.jsx` (NotificationsTab section)

**Step 1: Wire the "Email Newsletter" toggle**

The toggle already saves to `bbj_notify_newsletter` usermeta. Change it to call `/bbjd/v1/email/preferences` PUT with `lists: ['post-notifications']` when enabled, or `lists: []` when disabled. On load, GET preferences to set initial toggle state.

**Step 2: Commit**

```
feat(email): wire settings notification toggle to email preferences API
```

---

## Task 11: Integration Testing & Deploy

**Step 1: Local verification**

1. Visit WP Admin → BBJ Mailing → Settings, enter Resend API key
2. Visit WP Admin → BBJ Mailing → Lists, confirm `post-notifications` list exists
3. Subscribe via the sidebar widget with a test email
4. Check DB — subscriber should be `unconfirmed`
5. Check email inbox — confirmation email should arrive
6. Click confirm link — subscriber status becomes `subscribed`
7. Publish a test blog post — check that notification email is sent
8. Click unsubscribe in email footer — verify unsubscribed
9. Check WP Admin → BBJ Mailing → Stats — verify send records appear
10. Send a test email from Emails page

**Step 2: Deploy plugin to staging**

```bash
bash scripts/deploy-plugin.sh --staging
```

**Step 3: Configure Resend webhook**

In Resend dashboard, add webhook URL:
```
https://stg-wp.bigbrotherjunkies.com/wp-json/bbjd/v1/email/webhook/resend
```
Events: `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`

**Step 4: Commit any fixes from testing**

```
fix(email): address issues found in integration testing
```

---

## Summary

| Task | What | Files |
|------|------|-------|
| 1 | Database schema + migration | `Email/EmailSchema.php`, `Email/EmailMigrator.php`, `Plugin.php` |
| 2 | Resend API client | `Email/ResendClient.php` |
| 3 | Core email service | `Email/EmailService.php` |
| 4 | Post notification sender + WP hooks | `Email/EmailSender.php`, `Plugin.php` |
| 5 | REST API endpoints | `Api/EmailRoutes.php` |
| 6 | WP Admin settings page | `Admin/Pages/EmailSettingsPage.php`, `Plugin.php` |
| 7 | WP Admin lists, stats, emails pages | `Admin/Pages/Email*.php`, `Plugin.php` |
| 8 | Subscribe widget | `components/email/SubscribeWidget.jsx`, `Sidebar.jsx` |
| 9 | Confirm + unsubscribe pages | `app/email/confirm/page.jsx`, `app/unsubscribe/page.jsx` |
| 10 | Wire settings toggles | `app/settings/page.jsx` |
| 11 | Integration testing + deploy | Manual testing + staging deploy |
