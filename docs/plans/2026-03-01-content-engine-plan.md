# Content Engine Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a unified content engine in the BBJ admin panel — image paste + AI caption, news aggregation, template generation, Facebook posting, and content scheduling.

**Architecture:** WordPress plugin routes handle all backend logic (AI proxy, Facebook API, RSS feeds, CRUD). Next.js admin panel provides the UI with sub-tabs. All content flows through a single `bbj_content_queue` table. AI calls proxy through WP to keep API keys server-side.

**Tech Stack:** WordPress REST API (PHP), Next.js App Router (JSX), Anthropic Claude API, Facebook Graph API, RSS/XML parsing

**Design Doc:** `docs/plans/2026-03-01-content-engine-design.md`

---

## Task 1: Database Tables + Migration

**Files:**
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Database\Schema.php`
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Database\Migrator.php`

**Step 1: Add table schemas to Schema.php**

Add two new schemas to `getAllSchemas()`:

```php
'bbj_content_queue' => "CREATE TABLE IF NOT EXISTS {$prefix}bbj_content_queue (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    status ENUM('draft','scheduled','posted','failed') DEFAULT 'draft',
    source ENUM('manual','image_paste','news_scan','template','on_this_day') DEFAULT 'manual',
    content_type ENUM('facebook_post','blog_post','both') DEFAULT 'facebook_post',
    title VARCHAR(255) DEFAULT NULL,
    body TEXT NOT NULL,
    image_url VARCHAR(500) DEFAULT NULL,
    image_data LONGBLOB DEFAULT NULL,
    target_page VARCHAR(50) DEFAULT NULL,
    target_page_name VARCHAR(100) DEFAULT NULL,
    wp_post_id BIGINT DEFAULT NULL,
    scheduled_at DATETIME DEFAULT NULL,
    posted_at DATETIME DEFAULT NULL,
    fb_post_id VARCHAR(100) DEFAULT NULL,
    template_type VARCHAR(50) DEFAULT NULL,
    source_url VARCHAR(500) DEFAULT NULL,
    ai_variations TEXT DEFAULT NULL,
    author_id BIGINT UNSIGNED DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_scheduled (status, scheduled_at),
    INDEX idx_source (source),
    INDEX idx_target_page (target_page)
) {$charset_collate};",

'bbj_news_feed' => "CREATE TABLE IF NOT EXISTS {$prefix}bbj_news_feed (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    url VARCHAR(500) NOT NULL,
    source_name VARCHAR(100) DEFAULT NULL,
    excerpt TEXT DEFAULT NULL,
    thumbnail VARCHAR(500) DEFAULT NULL,
    published_at DATETIME DEFAULT NULL,
    fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used TINYINT(1) DEFAULT 0,
    UNIQUE KEY idx_url (url(191)),
    INDEX idx_published (published_at),
    INDEX idx_used (used)
) {$charset_collate};",
```

**Step 2: Bump migration version in Migrator.php**

Increment `CURRENT_VERSION` constant so the migration runs on next admin load.

**Step 3: Verify by running migration**

Navigate to admin dashboard. Check that the migration runs and both tables exist.

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add content_queue and news_feed database tables"
```

---

## Task 2: Permission + Admin Tab Registration

**Files:**
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Permissions\PermissionChecker.php`
- Modify: `C:\xampp\htdocs\bbj-app\src\app\admin\layout.jsx`
- Create: `C:\xampp\htdocs\bbj-app\src\app\admin\content-engine\page.jsx`

**Step 1: Add permission to PermissionChecker.php**

Add to `DEFAULT_PERMISSIONS`:

```php
'content_engine' => [
    'label' => 'Content Engine',
    'description' => 'Create, schedule, and post content to Facebook and the site',
    'roles' => ['administrator', 'editor', 'second_in_command'],
],
```

**Step 2: Add tab to layout.jsx TABS array**

Add after the "announcements" tab entry:

```javascript
{ id: "content-engine", label: "Content", href: "/admin/content-engine", icon: PencilSquareIcon, permission: "content_engine" },
```

Import `PencilSquareIcon` from `@heroicons/react/24/outline` at the top.

**Step 3: Create placeholder page**

Create `src/app/admin/content-engine/page.jsx`:

```jsx
"use client";

import { useState } from "react";

const SUB_TABS = [
  { id: "create", label: "Create Post" },
  { id: "news", label: "News Feed" },
  { id: "generate", label: "Generate" },
  { id: "queue", label: "Queue" },
  { id: "log", label: "Post Log" },
  { id: "settings", label: "Settings" },
];

export default function ContentEnginePage() {
  const [activeTab, setActiveTab] = useState("create");

  return (
    <div>
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary-500 text-primary-500"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-slate-50 rounded-lg p-8 text-center">
        <p className="text-slate-500">
          {activeTab} view coming soon...
        </p>
      </div>
    </div>
  );
}
```

**Step 4: Verify**

- Login to admin panel
- Confirm "Content" tab appears
- Click it, confirm sub-tabs render and switch

**Step 5: Commit**

```bash
git add -A && git commit -m "feat: add content engine permission and admin tab with sub-navigation"
```

---

## Task 3: ContentEngineRoutes.php — CRUD Backend

**Files:**
- Create: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\ContentEngineRoutes.php`
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\Plugin.php`

**Step 1: Create ContentEngineRoutes.php**

Follow the exact pattern from AdminRoutes. Key endpoints:

```php
<?php

namespace Jejesmith\BigBrotherJunkiesData\Api;

use Jejesmith\BigBrotherJunkiesData\Permissions\PermissionChecker;

class ContentEngineRoutes
{
    public function register(): void
    {
        add_action('rest_api_init', [$this, 'registerRoutes']);
    }

    public function registerRoutes(): void
    {
        $namespace = 'bbjd/v1';

        // Drafts CRUD
        register_rest_route($namespace, '/content-engine/drafts', [
            'methods' => 'GET',
            'callback' => [$this, 'getDrafts'],
            'permission_callback' => [$this, 'checkAccess'],
            'args' => [
                'page' => ['default' => 1, 'type' => 'integer'],
                'per_page' => ['default' => 20, 'type' => 'integer'],
                'status' => ['default' => 'draft', 'type' => 'string'],
            ],
        ]);

        register_rest_route($namespace, '/content-engine/drafts', [
            'methods' => 'POST',
            'callback' => [$this, 'createDraft'],
            'permission_callback' => [$this, 'checkAccess'],
        ]);

        register_rest_route($namespace, '/content-engine/drafts/(?P<id>\d+)', [
            'methods' => 'PUT',
            'callback' => [$this, 'updateDraft'],
            'permission_callback' => [$this, 'checkAccess'],
        ]);

        register_rest_route($namespace, '/content-engine/drafts/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'deleteDraft'],
            'permission_callback' => [$this, 'checkAccess'],
        ]);

        // Queue
        register_rest_route($namespace, '/content-engine/queue', [
            'methods' => 'GET',
            'callback' => [$this, 'getQueue'],
            'permission_callback' => [$this, 'checkAccess'],
        ]);

        register_rest_route($namespace, '/content-engine/queue/(?P<id>\d+)/reschedule', [
            'methods' => 'POST',
            'callback' => [$this, 'reschedulePost'],
            'permission_callback' => [$this, 'checkAccess'],
        ]);

        // Post Log
        register_rest_route($namespace, '/content-engine/log', [
            'methods' => 'GET',
            'callback' => [$this, 'getPostLog'],
            'permission_callback' => [$this, 'checkAccess'],
        ]);

        // Settings
        register_rest_route($namespace, '/content-engine/settings', [
            'methods' => 'GET',
            'callback' => [$this, 'getSettings'],
            'permission_callback' => [$this, 'checkAccess'],
        ]);

        register_rest_route($namespace, '/content-engine/settings', [
            'methods' => 'POST',
            'callback' => [$this, 'updateSettings'],
            'permission_callback' => [$this, 'checkAccess'],
        ]);
    }

    public function checkAccess(): bool
    {
        return PermissionChecker::userCan('content_engine');
    }

    // --- Drafts ---

    public function getDrafts(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb;
        $table = $wpdb->prefix . 'bbj_content_queue';
        $page = (int) $request->get_param('page');
        $perPage = (int) $request->get_param('per_page');
        $status = sanitize_text_field($request->get_param('status'));
        $offset = ($page - 1) * $perPage;

        $where = $status ? $wpdb->prepare("WHERE status = %s", $status) : "";
        $total = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$table} {$where}");
        $items = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$table} {$where} ORDER BY created_at DESC LIMIT %d OFFSET %d",
            $perPage, $offset
        ));

        return new \WP_REST_Response([
            'items' => $items,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => ceil($total / $perPage),
            ],
        ]);
    }

    public function createDraft(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb;
        $table = $wpdb->prefix . 'bbj_content_queue';

        $data = [
            'status' => sanitize_text_field($request->get_param('status') ?? 'draft'),
            'source' => sanitize_text_field($request->get_param('source') ?? 'manual'),
            'content_type' => sanitize_text_field($request->get_param('content_type') ?? 'facebook_post'),
            'title' => sanitize_text_field($request->get_param('title') ?? ''),
            'body' => wp_kses_post($request->get_param('body') ?? ''),
            'image_url' => esc_url_raw($request->get_param('image_url') ?? ''),
            'target_page' => sanitize_text_field($request->get_param('target_page') ?? ''),
            'target_page_name' => sanitize_text_field($request->get_param('target_page_name') ?? ''),
            'scheduled_at' => $request->get_param('scheduled_at') ? sanitize_text_field($request->get_param('scheduled_at')) : null,
            'template_type' => sanitize_text_field($request->get_param('template_type') ?? ''),
            'source_url' => esc_url_raw($request->get_param('source_url') ?? ''),
            'ai_variations' => $request->get_param('ai_variations') ? wp_json_encode($request->get_param('ai_variations')) : null,
            'author_id' => get_current_user_id(),
        ];

        // Handle base64 image data
        $imageData = $request->get_param('image_data');
        if ($imageData) {
            $data['image_data'] = base64_decode($imageData);
        }

        if ($data['scheduled_at']) {
            $data['status'] = 'scheduled';
        }

        $wpdb->insert($table, $data);

        return new \WP_REST_Response([
            'success' => true,
            'id' => $wpdb->insert_id,
        ], 201);
    }

    public function updateDraft(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb;
        $table = $wpdb->prefix . 'bbj_content_queue';
        $id = (int) $request->get_param('id');

        $updates = [];
        $fields = ['status', 'title', 'body', 'image_url', 'target_page', 'target_page_name',
                    'content_type', 'scheduled_at', 'template_type', 'source_url'];

        foreach ($fields as $field) {
            $value = $request->get_param($field);
            if ($value !== null) {
                $updates[$field] = sanitize_text_field($value);
            }
        }

        if (isset($updates['body'])) {
            $updates['body'] = wp_kses_post($request->get_param('body'));
        }

        if (empty($updates)) {
            return new \WP_REST_Response(['error' => 'No fields to update'], 400);
        }

        $wpdb->update($table, $updates, ['id' => $id]);

        return new \WP_REST_Response(['success' => true]);
    }

    public function deleteDraft(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb;
        $table = $wpdb->prefix . 'bbj_content_queue';
        $id = (int) $request->get_param('id');

        $wpdb->delete($table, ['id' => $id]);

        return new \WP_REST_Response(['success' => true]);
    }

    // --- Queue ---

    public function getQueue(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb;
        $table = $wpdb->prefix . 'bbj_content_queue';

        $items = $wpdb->get_results(
            "SELECT * FROM {$table} WHERE status = 'scheduled' ORDER BY scheduled_at ASC"
        );

        return new \WP_REST_Response(['items' => $items]);
    }

    public function reschedulePost(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb;
        $table = $wpdb->prefix . 'bbj_content_queue';
        $id = (int) $request->get_param('id');
        $scheduledAt = sanitize_text_field($request->get_param('scheduled_at'));

        $wpdb->update($table, ['scheduled_at' => $scheduledAt], ['id' => $id]);

        return new \WP_REST_Response(['success' => true]);
    }

    // --- Post Log ---

    public function getPostLog(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb;
        $table = $wpdb->prefix . 'bbj_content_queue';
        $page = (int) ($request->get_param('page') ?? 1);
        $perPage = (int) ($request->get_param('per_page') ?? 20);
        $offset = ($page - 1) * $perPage;

        $total = (int) $wpdb->get_var(
            "SELECT COUNT(*) FROM {$table} WHERE status IN ('posted', 'failed')"
        );
        $items = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$table} WHERE status IN ('posted', 'failed') ORDER BY posted_at DESC LIMIT %d OFFSET %d",
            $perPage, $offset
        ));

        return new \WP_REST_Response([
            'items' => $items,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => ceil($total / $perPage),
            ],
        ]);
    }

    // --- Settings ---

    public function getSettings(\WP_REST_Request $request): \WP_REST_Response
    {
        $settings = get_option('bbjd_content_engine_settings', []);

        // Never expose full tokens to frontend — mask them
        if (!empty($settings['facebook_pages'])) {
            foreach ($settings['facebook_pages'] as &$page) {
                if (!empty($page['token'])) {
                    $page['token_preview'] = substr($page['token'], 0, 20) . '...';
                    $page['has_token'] = true;
                    unset($page['token']);
                }
            }
        }

        // Never expose Anthropic key to frontend
        $settings['has_anthropic_key'] = !empty($settings['anthropic_api_key']);
        unset($settings['anthropic_api_key']);

        return new \WP_REST_Response($settings);
    }

    public function updateSettings(\WP_REST_Request $request): \WP_REST_Response
    {
        $current = get_option('bbjd_content_engine_settings', []);
        $params = $request->get_json_params();

        // Merge — don't overwrite keys not sent
        if (isset($params['anthropic_api_key'])) {
            $current['anthropic_api_key'] = sanitize_text_field($params['anthropic_api_key']);
        }
        if (isset($params['facebook_pages'])) {
            $current['facebook_pages'] = $params['facebook_pages'];
        }
        if (isset($params['news_sources'])) {
            $current['news_sources'] = $params['news_sources'];
        }
        if (isset($params['default_posting_times'])) {
            $current['default_posting_times'] = $params['default_posting_times'];
        }
        if (isset($params['news_refresh_interval'])) {
            $current['news_refresh_interval'] = (int) $params['news_refresh_interval'];
        }

        update_option('bbjd_content_engine_settings', $current);

        return new \WP_REST_Response(['success' => true]);
    }
}
```

**Step 2: Register in Plugin.php**

In `initApiRoutes()`, add:

```php
$contentEngineRoutes = new ContentEngineRoutes();
$contentEngineRoutes->register();
```

Add the `use` statement at top of Plugin.php:

```php
use Jejesmith\BigBrotherJunkiesData\Api\ContentEngineRoutes;
```

**Step 3: Verify endpoints exist**

Test with curl or browser: `GET /wp-json/bbjd/v1/content-engine/settings` (should return empty settings or 401 if not logged in).

**Step 4: Commit**

```bash
git add -A && git commit -m "feat: add ContentEngineRoutes with CRUD, queue, log, and settings endpoints"
```

---

## Task 4: FacebookRoutes.php — Posting to Facebook

**Files:**
- Create: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\FacebookRoutes.php`
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\Plugin.php`

**Step 1: Create FacebookRoutes.php**

```php
<?php

namespace Jejesmith\BigBrotherJunkiesData\Api;

use Jejesmith\BigBrotherJunkiesData\Permissions\PermissionChecker;

class FacebookRoutes
{
    public function register(): void
    {
        add_action('rest_api_init', [$this, 'registerRoutes']);
    }

    public function registerRoutes(): void
    {
        $namespace = 'bbjd/v1';

        register_rest_route($namespace, '/facebook/pages', [
            'methods' => 'GET',
            'callback' => [$this, 'getPages'],
            'permission_callback' => [$this, 'checkAccess'],
        ]);

        register_rest_route($namespace, '/facebook/post', [
            'methods' => 'POST',
            'callback' => [$this, 'postToPage'],
            'permission_callback' => [$this, 'checkAccess'],
        ]);

        register_rest_route($namespace, '/facebook/post-photo', [
            'methods' => 'POST',
            'callback' => [$this, 'postPhotoToPage'],
            'permission_callback' => [$this, 'checkAccess'],
        ]);
    }

    public function checkAccess(): bool
    {
        return PermissionChecker::userCan('content_engine');
    }

    public function getPages(\WP_REST_Request $request): \WP_REST_Response
    {
        $settings = get_option('bbjd_content_engine_settings', []);
        $pages = $settings['facebook_pages'] ?? [];

        // Strip tokens, return only id + name + has_token
        $safe = array_map(function ($page) {
            return [
                'id' => $page['id'],
                'name' => $page['name'],
                'has_token' => !empty($page['token']),
            ];
        }, $pages);

        return new \WP_REST_Response(['pages' => $safe]);
    }

    public function postToPage(\WP_REST_Request $request): \WP_REST_Response
    {
        $pageId = sanitize_text_field($request->get_param('page_id'));
        $message = $request->get_param('message');
        $link = esc_url_raw($request->get_param('link') ?? '');
        $queueId = (int) $request->get_param('queue_id');

        $token = $this->getPageToken($pageId);
        if (!$token) {
            return new \WP_REST_Response(['error' => 'No token configured for this page'], 400);
        }

        $body = ['message' => $message, 'access_token' => $token];
        if ($link) {
            $body['link'] = $link;
        }

        $response = wp_remote_post("https://graph.facebook.com/v21.0/{$pageId}/feed", [
            'body' => $body,
            'timeout' => 30,
        ]);

        if (is_wp_error($response)) {
            $this->updateQueueStatus($queueId, 'failed');
            return new \WP_REST_Response(['error' => $response->get_error_message()], 500);
        }

        $result = json_decode(wp_remote_retrieve_body($response), true);

        if (isset($result['error'])) {
            $this->updateQueueStatus($queueId, 'failed');
            return new \WP_REST_Response(['error' => $result['error']['message']], 400);
        }

        $this->updateQueueStatus($queueId, 'posted', $result['id'] ?? null);

        return new \WP_REST_Response([
            'success' => true,
            'fb_post_id' => $result['id'] ?? null,
        ]);
    }

    public function postPhotoToPage(\WP_REST_Request $request): \WP_REST_Response
    {
        $pageId = sanitize_text_field($request->get_param('page_id'));
        $message = $request->get_param('message');
        $imageData = $request->get_param('image_data'); // base64
        $imageUrl = esc_url_raw($request->get_param('image_url') ?? '');
        $queueId = (int) $request->get_param('queue_id');

        $token = $this->getPageToken($pageId);
        if (!$token) {
            return new \WP_REST_Response(['error' => 'No token configured for this page'], 400);
        }

        // If we have base64 image data, upload as multipart
        if ($imageData) {
            $decoded = base64_decode($imageData);
            $boundary = wp_generate_password(24, false);

            $payload = '';
            $payload .= "--{$boundary}\r\n";
            $payload .= "Content-Disposition: form-data; name=\"message\"\r\n\r\n{$message}\r\n";
            $payload .= "--{$boundary}\r\n";
            $payload .= "Content-Disposition: form-data; name=\"access_token\"\r\n\r\n{$token}\r\n";
            $payload .= "--{$boundary}\r\n";
            $payload .= "Content-Disposition: form-data; name=\"source\"; filename=\"image.jpg\"\r\n";
            $payload .= "Content-Type: image/jpeg\r\n\r\n";
            $payload .= $decoded . "\r\n";
            $payload .= "--{$boundary}--\r\n";

            $response = wp_remote_post("https://graph.facebook.com/v21.0/{$pageId}/photos", [
                'headers' => ['Content-Type' => "multipart/form-data; boundary={$boundary}"],
                'body' => $payload,
                'timeout' => 60,
            ]);
        } elseif ($imageUrl) {
            // Post with image URL
            $response = wp_remote_post("https://graph.facebook.com/v21.0/{$pageId}/photos", [
                'body' => [
                    'message' => $message,
                    'url' => $imageUrl,
                    'access_token' => $token,
                ],
                'timeout' => 30,
            ]);
        } else {
            return new \WP_REST_Response(['error' => 'No image provided'], 400);
        }

        if (is_wp_error($response)) {
            $this->updateQueueStatus($queueId, 'failed');
            return new \WP_REST_Response(['error' => $response->get_error_message()], 500);
        }

        $result = json_decode(wp_remote_retrieve_body($response), true);

        if (isset($result['error'])) {
            $this->updateQueueStatus($queueId, 'failed');
            return new \WP_REST_Response(['error' => $result['error']['message']], 400);
        }

        $this->updateQueueStatus($queueId, 'posted', $result['id'] ?? $result['post_id'] ?? null);

        return new \WP_REST_Response([
            'success' => true,
            'fb_post_id' => $result['id'] ?? $result['post_id'] ?? null,
        ]);
    }

    private function getPageToken(string $pageId): ?string
    {
        $settings = get_option('bbjd_content_engine_settings', []);
        $pages = $settings['facebook_pages'] ?? [];

        foreach ($pages as $page) {
            if ($page['id'] === $pageId && !empty($page['token'])) {
                return $page['token'];
            }
        }
        return null;
    }

    private function updateQueueStatus(int $queueId, string $status, ?string $fbPostId = null): void
    {
        if (!$queueId) return;

        global $wpdb;
        $table = $wpdb->prefix . 'bbj_content_queue';
        $data = ['status' => $status, 'posted_at' => current_time('mysql')];
        if ($fbPostId) {
            $data['fb_post_id'] = $fbPostId;
        }
        $wpdb->update($table, $data, ['id' => $queueId]);
    }
}
```

**Step 2: Register in Plugin.php**

```php
$facebookRoutes = new FacebookRoutes();
$facebookRoutes->register();
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add FacebookRoutes for posting text and photos to Facebook pages"
```

---

## Task 5: AIRoutes.php — Anthropic API Proxy

**Files:**
- Create: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\AIRoutes.php`
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\Plugin.php`

**Step 1: Create AIRoutes.php**

Three endpoints: caption (image → 3 captions), rewrite (article → blog post), enhance (template → 3 variations). All proxy to Anthropic API using the stored API key.

```php
<?php

namespace Jejesmith\BigBrotherJunkiesData\Api;

use Jejesmith\BigBrotherJunkiesData\Permissions\PermissionChecker;

class AIRoutes
{
    private const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
    private const MODEL = 'claude-sonnet-4-20250514';

    public function register(): void
    {
        add_action('rest_api_init', [$this, 'registerRoutes']);
    }

    public function registerRoutes(): void
    {
        $namespace = 'bbjd/v1';

        register_rest_route($namespace, '/ai/caption', [
            'methods' => 'POST',
            'callback' => [$this, 'generateCaption'],
            'permission_callback' => [$this, 'checkAccess'],
        ]);

        register_rest_route($namespace, '/ai/rewrite', [
            'methods' => 'POST',
            'callback' => [$this, 'rewriteArticle'],
            'permission_callback' => [$this, 'checkAccess'],
        ]);

        register_rest_route($namespace, '/ai/enhance', [
            'methods' => 'POST',
            'callback' => [$this, 'enhanceTemplate'],
            'permission_callback' => [$this, 'checkAccess'],
        ]);
    }

    public function checkAccess(): bool
    {
        return PermissionChecker::userCan('content_engine');
    }

    public function generateCaption(\WP_REST_Request $request): \WP_REST_Response
    {
        $imageData = $request->get_param('image_data'); // base64
        $mediaType = sanitize_text_field($request->get_param('media_type') ?? 'image/jpeg');
        $context = sanitize_text_field($request->get_param('context') ?? '');

        if (!$imageData) {
            return new \WP_REST_Response(['error' => 'No image data provided'], 400);
        }

        $systemPrompt = "You are a social media manager for Big Brother Junkies, a fan page with 160k+ followers on Facebook. Analyze this image and generate 3 engaging Facebook caption options.\n\nRules:\n- Conversational, fan-to-fan tone\n- Ask a question or pose a debate to drive comments\n- Keep each caption under 280 characters for optimal engagement\n- Use emojis sparingly (1-2 max per caption)\n- Never use hashtags on Facebook (they hurt reach)\n- Return ONLY a JSON array of 3 strings, nothing else";

        if ($context) {
            $systemPrompt .= "\n\nAdditional context: {$context}";
        }

        $messages = [
            [
                'role' => 'user',
                'content' => [
                    [
                        'type' => 'image',
                        'source' => [
                            'type' => 'base64',
                            'media_type' => $mediaType,
                            'data' => $imageData,
                        ],
                    ],
                    [
                        'type' => 'text',
                        'text' => 'Generate 3 engaging Facebook captions for this image.',
                    ],
                ],
            ],
        ];

        $result = $this->callAnthropic($systemPrompt, $messages);

        if (isset($result['error'])) {
            return new \WP_REST_Response($result, 500);
        }

        // Parse the JSON array from the response
        $text = $result['content'][0]['text'] ?? '';
        $captions = json_decode($text, true);

        if (!is_array($captions)) {
            // If AI didn't return clean JSON, split by newlines
            $captions = array_filter(array_map('trim', explode("\n", $text)));
            $captions = array_values(array_slice($captions, 0, 3));
        }

        return new \WP_REST_Response(['captions' => $captions]);
    }

    public function rewriteArticle(\WP_REST_Request $request): \WP_REST_Response
    {
        $articleText = $request->get_param('article_text');
        $sourceUrl = esc_url_raw($request->get_param('source_url') ?? '');

        if (!$articleText) {
            return new \WP_REST_Response(['error' => 'No article text provided'], 400);
        }

        $systemPrompt = "You are writing for Big Brother Junkies. Rewrite this news article as a BBJ blog post.\n\nRules:\n- Add fan perspective and opinion\n- Reference relevant BB history/players when applicable\n- Keep the key facts but make it feel like a fan site, not a news wire\n- Include a discussion question at the end\n- 300-500 words\n- Return the rewritten article text only, no meta commentary";

        $messages = [
            [
                'role' => 'user',
                'content' => "Rewrite this article:\n\n{$articleText}",
            ],
        ];

        $result = $this->callAnthropic($systemPrompt, $messages);

        if (isset($result['error'])) {
            return new \WP_REST_Response($result, 500);
        }

        $rewritten = $result['content'][0]['text'] ?? '';

        return new \WP_REST_Response(['rewritten' => $rewritten]);
    }

    public function enhanceTemplate(\WP_REST_Request $request): \WP_REST_Response
    {
        $templateText = $request->get_param('template_text');

        if (!$templateText) {
            return new \WP_REST_Response(['error' => 'No template text provided'], 400);
        }

        $systemPrompt = "Enhance this social media post for maximum Facebook engagement. Keep the core concept but make it more natural and engaging. Return ONLY a JSON array of 3 variation strings, nothing else.\n\nContext: This is for a Big Brother fan page with 160k followers.";

        $messages = [
            [
                'role' => 'user',
                'content' => "Enhance this post:\n\n{$templateText}",
            ],
        ];

        $result = $this->callAnthropic($systemPrompt, $messages);

        if (isset($result['error'])) {
            return new \WP_REST_Response($result, 500);
        }

        $text = $result['content'][0]['text'] ?? '';
        $variations = json_decode($text, true);

        if (!is_array($variations)) {
            $variations = array_filter(array_map('trim', explode("\n", $text)));
            $variations = array_values(array_slice($variations, 0, 3));
        }

        return new \WP_REST_Response(['variations' => $variations]);
    }

    private function callAnthropic(string $systemPrompt, array $messages): array
    {
        $settings = get_option('bbjd_content_engine_settings', []);
        $apiKey = $settings['anthropic_api_key'] ?? '';

        if (!$apiKey) {
            return ['error' => 'Anthropic API key not configured'];
        }

        $response = wp_remote_post(self::ANTHROPIC_API_URL, [
            'headers' => [
                'Content-Type' => 'application/json',
                'x-api-key' => $apiKey,
                'anthropic-version' => '2023-06-01',
            ],
            'body' => wp_json_encode([
                'model' => self::MODEL,
                'max_tokens' => 1024,
                'system' => $systemPrompt,
                'messages' => $messages,
            ]),
            'timeout' => 60,
        ]);

        if (is_wp_error($response)) {
            return ['error' => $response->get_error_message()];
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);

        if (isset($body['error'])) {
            return ['error' => $body['error']['message'] ?? 'Anthropic API error'];
        }

        return $body;
    }
}
```

**Step 2: Register in Plugin.php**

```php
$aiRoutes = new AIRoutes();
$aiRoutes->register();
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add AIRoutes for caption generation, article rewrite, and template enhancement"
```

---

## Task 6: NewsAggregatorRoutes.php — RSS Feeds + Article Scanning

**Files:**
- Create: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\NewsAggregatorRoutes.php`
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\Plugin.php`

**Step 1: Create NewsAggregatorRoutes.php**

Endpoints: get cached feed, scan a specific article, force refresh, list sources. Uses WordPress's built-in `fetch_feed()` for RSS parsing and `wp_remote_get()` for article fetching.

```php
<?php

namespace Jejesmith\BigBrotherJunkiesData\Api;

use Jejesmith\BigBrotherJunkiesData\Permissions\PermissionChecker;

class NewsAggregatorRoutes
{
    public function register(): void
    {
        add_action('rest_api_init', [$this, 'registerRoutes']);
    }

    public function registerRoutes(): void
    {
        $namespace = 'bbjd/v1';

        register_rest_route($namespace, '/news/feed', [
            'methods' => 'GET',
            'callback' => [$this, 'getFeed'],
            'permission_callback' => [$this, 'checkAccess'],
        ]);

        register_rest_route($namespace, '/news/scan', [
            'methods' => 'POST',
            'callback' => [$this, 'scanArticle'],
            'permission_callback' => [$this, 'checkAccess'],
        ]);

        register_rest_route($namespace, '/news/refresh', [
            'methods' => 'POST',
            'callback' => [$this, 'refreshFeeds'],
            'permission_callback' => [$this, 'checkAccess'],
        ]);

        register_rest_route($namespace, '/news/sources', [
            'methods' => 'GET',
            'callback' => [$this, 'getSources'],
            'permission_callback' => [$this, 'checkAccess'],
        ]);
    }

    public function checkAccess(): bool
    {
        return PermissionChecker::userCan('content_engine');
    }

    public function getFeed(\WP_REST_Request $request): \WP_REST_Response
    {
        global $wpdb;
        $table = $wpdb->prefix . 'bbj_news_feed';
        $page = (int) ($request->get_param('page') ?? 1);
        $perPage = (int) ($request->get_param('per_page') ?? 30);
        $offset = ($page - 1) * $perPage;

        $items = $wpdb->get_results($wpdb->prepare(
            "SELECT * FROM {$table} ORDER BY published_at DESC LIMIT %d OFFSET %d",
            $perPage, $offset
        ));

        $total = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$table}");

        return new \WP_REST_Response([
            'items' => $items,
            'pagination' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $perPage,
                'total_pages' => ceil($total / $perPage),
            ],
        ]);
    }

    public function scanArticle(\WP_REST_Request $request): \WP_REST_Response
    {
        $url = esc_url_raw($request->get_param('url'));

        if (!$url) {
            return new \WP_REST_Response(['error' => 'No URL provided'], 400);
        }

        // Fetch the article HTML
        $response = wp_remote_get($url, [
            'timeout' => 15,
            'user-agent' => 'Mozilla/5.0 (compatible; BBJContentEngine/1.0)',
        ]);

        if (is_wp_error($response)) {
            return new \WP_REST_Response(['error' => 'Failed to fetch article: ' . $response->get_error_message()], 500);
        }

        $html = wp_remote_retrieve_body($response);

        // Extract main content — strip scripts, styles, nav, header, footer
        $text = $this->extractArticleText($html);

        if (strlen($text) < 100) {
            return new \WP_REST_Response(['error' => 'Could not extract meaningful article content'], 400);
        }

        return new \WP_REST_Response([
            'article_text' => $text,
            'source_url' => $url,
        ]);
    }

    public function refreshFeeds(\WP_REST_Request $request): \WP_REST_Response
    {
        $count = $this->fetchAllFeeds();

        return new \WP_REST_Response([
            'success' => true,
            'new_articles' => $count,
        ]);
    }

    public function getSources(\WP_REST_Request $request): \WP_REST_Response
    {
        $settings = get_option('bbjd_content_engine_settings', []);
        $sources = $settings['news_sources'] ?? $this->getDefaultSources();

        return new \WP_REST_Response(['sources' => $sources]);
    }

    // --- Internal Methods ---

    public function fetchAllFeeds(): int
    {
        $settings = get_option('bbjd_content_engine_settings', []);
        $sources = $settings['news_sources'] ?? $this->getDefaultSources();
        $newCount = 0;

        foreach ($sources as $source) {
            $newCount += $this->fetchSingleFeed($source['url'], $source['name']);
        }

        // Cleanup old articles (>14 days and unused)
        global $wpdb;
        $table = $wpdb->prefix . 'bbj_news_feed';
        $wpdb->query("DELETE FROM {$table} WHERE used = 0 AND fetched_at < DATE_SUB(NOW(), INTERVAL 14 DAY)");

        return $newCount;
    }

    private function fetchSingleFeed(string $feedUrl, string $sourceName): int
    {
        include_once ABSPATH . WPINC . '/feed.php';

        $feed = fetch_feed($feedUrl);

        if (is_wp_error($feed)) {
            return 0;
        }

        global $wpdb;
        $table = $wpdb->prefix . 'bbj_news_feed';
        $count = 0;

        foreach ($feed->get_items(0, 20) as $item) {
            $url = esc_url_raw($item->get_permalink());
            $title = sanitize_text_field($item->get_title());

            // Skip if already exists
            $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM {$table} WHERE url = %s", $url));
            if ($exists) continue;

            $excerpt = wp_trim_words(wp_strip_all_tags($item->get_description()), 40);
            $thumbnail = '';

            // Try to get enclosure image
            $enclosure = $item->get_enclosure();
            if ($enclosure && $enclosure->get_thumbnail()) {
                $thumbnail = esc_url_raw($enclosure->get_thumbnail());
            } elseif ($enclosure && $enclosure->get_link()) {
                $thumbnail = esc_url_raw($enclosure->get_link());
            }

            $publishedAt = $item->get_date('Y-m-d H:i:s');

            $wpdb->insert($table, [
                'title' => $title,
                'url' => $url,
                'source_name' => $sourceName,
                'excerpt' => $excerpt,
                'thumbnail' => $thumbnail,
                'published_at' => $publishedAt,
            ]);

            $count++;
        }

        return $count;
    }

    private function extractArticleText(string $html): string
    {
        // Remove scripts, styles, nav, header, footer, aside
        $html = preg_replace('/<script[^>]*>.*?<\/script>/si', '', $html);
        $html = preg_replace('/<style[^>]*>.*?<\/style>/si', '', $html);
        $html = preg_replace('/<nav[^>]*>.*?<\/nav>/si', '', $html);
        $html = preg_replace('/<header[^>]*>.*?<\/header>/si', '', $html);
        $html = preg_replace('/<footer[^>]*>.*?<\/footer>/si', '', $html);
        $html = preg_replace('/<aside[^>]*>.*?<\/aside>/si', '', $html);

        // Try to find <article> tag first
        if (preg_match('/<article[^>]*>(.*?)<\/article>/si', $html, $matches)) {
            $html = $matches[1];
        }

        // Strip remaining HTML
        $text = wp_strip_all_tags($html);

        // Clean up whitespace
        $text = preg_replace('/\s+/', ' ', $text);
        $text = trim($text);

        // Limit to reasonable length
        if (strlen($text) > 5000) {
            $text = substr($text, 0, 5000);
        }

        return $text;
    }

    private function getDefaultSources(): array
    {
        return [
            ['name' => 'Google News - Big Brother', 'url' => 'https://news.google.com/rss/search?q=%22Big+Brother%22+CBS&hl=en-US&gl=US&ceid=US:en'],
            ['name' => 'Reality Blurred', 'url' => 'https://www.realityblurred.com/feed/'],
        ];
    }
}
```

**Step 2: Register in Plugin.php**

```php
$newsRoutes = new NewsAggregatorRoutes();
$newsRoutes->register();
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add NewsAggregatorRoutes for RSS feed aggregation and article scanning"
```

---

## Task 7: WP Cron Jobs — Scheduled Posts + News Refresh

**Files:**
- Create: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Cron\ContentEngineCron.php`
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\Plugin.php`

**Step 1: Create ContentEngineCron.php**

Two cron jobs:
1. Check for scheduled posts every minute, fire them to Facebook
2. Refresh news feeds every 30 minutes

```php
<?php

namespace Jejesmith\BigBrotherJunkiesData\Cron;

use Jejesmith\BigBrotherJunkiesData\Api\FacebookRoutes;
use Jejesmith\BigBrotherJunkiesData\Api\NewsAggregatorRoutes;

class ContentEngineCron
{
    public function init(): void
    {
        // Register custom cron interval
        add_filter('cron_schedules', [$this, 'addCronIntervals']);

        // Schedule events on plugin load
        add_action('init', [$this, 'scheduleEvents']);

        // Hook the actual cron functions
        add_action('bbjd_process_scheduled_posts', [$this, 'processScheduledPosts']);
        add_action('bbjd_refresh_news_feeds', [$this, 'refreshNewsFeeds']);
    }

    public function addCronIntervals(array $schedules): array
    {
        $schedules['every_minute'] = [
            'interval' => 60,
            'display' => 'Every Minute',
        ];
        $schedules['every_30_minutes'] = [
            'interval' => 1800,
            'display' => 'Every 30 Minutes',
        ];
        return $schedules;
    }

    public function scheduleEvents(): void
    {
        if (!wp_next_scheduled('bbjd_process_scheduled_posts')) {
            wp_schedule_event(time(), 'every_minute', 'bbjd_process_scheduled_posts');
        }

        if (!wp_next_scheduled('bbjd_refresh_news_feeds')) {
            wp_schedule_event(time(), 'every_30_minutes', 'bbjd_refresh_news_feeds');
        }
    }

    public function processScheduledPosts(): void
    {
        global $wpdb;
        $table = $wpdb->prefix . 'bbj_content_queue';

        $posts = $wpdb->get_results(
            "SELECT * FROM {$table} WHERE status = 'scheduled' AND scheduled_at <= NOW()"
        );

        if (empty($posts)) return;

        foreach ($posts as $post) {
            $this->firePost($post);
        }
    }

    private function firePost(object $post): void
    {
        global $wpdb;
        $table = $wpdb->prefix . 'bbj_content_queue';

        // Get page token
        $settings = get_option('bbjd_content_engine_settings', []);
        $pages = $settings['facebook_pages'] ?? [];
        $token = null;

        foreach ($pages as $page) {
            if ($page['id'] === $post->target_page) {
                $token = $page['token'] ?? null;
                break;
            }
        }

        if (!$token) {
            $wpdb->update($table, ['status' => 'failed', 'posted_at' => current_time('mysql')], ['id' => $post->id]);
            return;
        }

        // Determine if photo or text post
        $hasImage = !empty($post->image_url) || !empty($post->image_data);
        $endpoint = $hasImage ? "/{$post->target_page}/photos" : "/{$post->target_page}/feed";

        $body = [
            'message' => $post->body,
            'access_token' => $token,
        ];

        if (!empty($post->image_url)) {
            $body['url'] = $post->image_url;
        }

        $response = wp_remote_post("https://graph.facebook.com/v21.0{$endpoint}", [
            'body' => $body,
            'timeout' => 30,
        ]);

        if (is_wp_error($response)) {
            $wpdb->update($table, ['status' => 'failed', 'posted_at' => current_time('mysql')], ['id' => $post->id]);
            return;
        }

        $result = json_decode(wp_remote_retrieve_body($response), true);

        if (isset($result['error'])) {
            $wpdb->update($table, ['status' => 'failed', 'posted_at' => current_time('mysql')], ['id' => $post->id]);
            return;
        }

        $wpdb->update($table, [
            'status' => 'posted',
            'posted_at' => current_time('mysql'),
            'fb_post_id' => $result['id'] ?? $result['post_id'] ?? null,
        ], ['id' => $post->id]);
    }

    public function refreshNewsFeeds(): void
    {
        $newsRoutes = new NewsAggregatorRoutes();
        $newsRoutes->fetchAllFeeds();
    }
}
```

**Step 2: Register in Plugin.php**

In `initCronJobs()`:

```php
$contentEngineCron = new ContentEngineCron();
$contentEngineCron->init();
```

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add WP cron jobs for scheduled post firing and news feed refresh"
```

---

## Task 8: Frontend API Functions

**Files:**
- Modify: `C:\xampp\htdocs\bbj-app\src\lib\api\admin.js`

**Step 1: Add all content engine API functions**

Append to `admin.js`:

```javascript
// --- Content Engine ---

export async function getContentDrafts(status = 'draft', page = 1) {
  return adminFetch(`/content-engine/drafts?status=${status}&page=${page}`);
}

export async function createContentDraft(data) {
  return adminFetch('/content-engine/drafts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateContentDraft(id, data) {
  return adminFetch(`/content-engine/drafts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteContentDraft(id) {
  return adminFetch(`/content-engine/drafts/${id}`, {
    method: 'DELETE',
  });
}

export async function getContentQueue() {
  return adminFetch('/content-engine/queue');
}

export async function rescheduleContent(id, scheduledAt) {
  return adminFetch(`/content-engine/queue/${id}/reschedule`, {
    method: 'POST',
    body: JSON.stringify({ scheduled_at: scheduledAt }),
  });
}

export async function getPostLog(page = 1) {
  return adminFetch(`/content-engine/log?page=${page}`);
}

export async function getContentEngineSettings() {
  return adminFetch('/content-engine/settings');
}

export async function updateContentEngineSettings(data) {
  return adminFetch('/content-engine/settings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// --- Facebook ---

export async function getFacebookPages() {
  return adminFetch('/facebook/pages');
}

export async function postToFacebook(data) {
  return adminFetch('/facebook/post', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function postPhotoToFacebook(data) {
  return adminFetch('/facebook/post-photo', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// --- AI ---

export async function generateCaption(imageData, mediaType = 'image/jpeg', context = '') {
  return adminFetch('/ai/caption', {
    method: 'POST',
    body: JSON.stringify({ image_data: imageData, media_type: mediaType, context }),
  });
}

export async function rewriteArticle(articleText, sourceUrl = '') {
  return adminFetch('/ai/rewrite', {
    method: 'POST',
    body: JSON.stringify({ article_text: articleText, source_url: sourceUrl }),
  });
}

export async function enhanceTemplate(templateText) {
  return adminFetch('/ai/enhance', {
    method: 'POST',
    body: JSON.stringify({ template_text: templateText }),
  });
}

// --- News ---

export async function getNewsFeed(page = 1) {
  return adminFetch(`/news/feed?page=${page}`);
}

export async function scanNewsArticle(url) {
  return adminFetch('/news/scan', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

export async function refreshNewsFeeds() {
  return adminFetch('/news/refresh', {
    method: 'POST',
  });
}

export async function getNewsSources() {
  return adminFetch('/news/sources');
}
```

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add content engine, facebook, AI, and news API functions to admin.js"
```

---

## Task 9: Frontend — DraftEditor Component

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\components\admin\content-engine\DraftEditor.jsx`

**Step 1: Build the shared draft editor**

This is the core UI component that all content sources funnel into. Text area, page selector, action buttons (Post Now, Schedule, Save Draft).

Key features:
- Text area for body content
- Facebook page selector dropdown (fetches from `/facebook/pages`)
- Action row: Post Now, Schedule (with datetime picker), Save Draft
- Optional "Also publish as blog post" checkbox
- Loading states during API calls
- Success/error feedback

Reference the announcements page pattern for state management and API call patterns.

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add DraftEditor component with page selector and action buttons"
```

---

## Task 10: Frontend — CreatePost Component (Image Paste)

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\components\admin\content-engine\CreatePost.jsx`

**Step 1: Build the image paste + AI caption UI**

Key features:
- Paste zone: `onPaste` handler that reads `clipboardData.items` for images
- Also supports drag-and-drop and file input as fallback
- Image preview thumbnail
- "Generate Caption" button that sends base64 image to `/ai/caption`
- AI suggestions rendered as selectable radio options
- Clicking a suggestion populates the DraftEditor body
- Manual text entry always available

Reference the Clipboard API: `navigator.clipboard.read()` or the simpler `paste` event approach.

**Step 2: Wire into DraftEditor**

CreatePost wraps DraftEditor and passes the image data + selected caption down.

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: add CreatePost component with image paste and AI caption generation"
```

---

## Task 11: Frontend — NewsFeed Component

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\components\admin\content-engine\NewsFeed.jsx`

**Step 1: Build the news aggregator UI**

Key features:
- Fetches from `/news/feed` on mount
- Renders list of articles: thumbnail, title, source, date, excerpt
- "Scan & Create" button per article → calls `/news/scan` then `/ai/rewrite` → opens DraftEditor with result
- "Refresh" button → calls `/news/refresh`
- "Open Original" link to source URL
- "Used" badge on articles that have been turned into posts
- Loading skeleton while fetching

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add NewsFeed component with article scanning and AI rewrite"
```

---

## Task 12: Frontend — Generator Component (Templates)

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\components\admin\content-engine\Generator.jsx`

**Step 1: Build the template engine UI**

Key features:
- Template type dropdown (Versus, Rankings, Hot Take, Trivia, Scenario, On This Day, This or That)
- "Generate" button that pulls random players from the database (via existing `/bbjd/v1/players` endpoint with random params)
- Template output displayed in editable text area
- "Regenerate" button for a fresh pull
- "Enhance with AI" button → calls `/ai/enhance` → shows 3 variations
- "Edit & Post" button → sends to DraftEditor
- Template logic: Each template type has a JavaScript function that formats the randomly-pulled player data into the template string

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add Generator component with template engine and AI enhancement"
```

---

## Task 13: Frontend — Queue Component

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\components\admin\content-engine\Queue.jsx`

**Step 1: Build the scheduler/queue UI**

Key features:
- Fetches from `/content-engine/queue` on mount
- List view grouped by date
- Each item shows: time, content preview (truncated body), target page badge, source icon
- Edit button → opens DraftEditor with item data
- Delete button → calls DELETE on draft
- Reschedule → datetime picker → calls `/content-engine/queue/{id}/reschedule`
- Empty state: "No scheduled posts"

Calendar view is a stretch goal — start with list view only.

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add Queue component with scheduled post management"
```

---

## Task 14: Frontend — PostLog Component

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\components\admin\content-engine\PostLog.jsx`

**Step 1: Build the post history UI**

Key features:
- Fetches from `/content-engine/log` on mount
- Table/list of posted items: date, content preview, target page, status (posted/failed), FB post link
- Pagination
- Failed posts shown with red badge
- "Retry" button on failed posts → re-submits to Facebook

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add PostLog component with post history and retry"
```

---

## Task 15: Frontend — Settings Sub-Tab

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\components\admin\content-engine\Settings.jsx`

**Step 1: Build the content engine settings UI**

Key features:
- Anthropic API key input (password field, shows "configured" if set)
- Facebook pages: list of configured pages with name, ID, token status. Add/remove pages.
- News sources: list of RSS feed URLs with name. Add/remove sources.
- Default posting times (3 time inputs)
- Save button → calls `/content-engine/settings`

**Step 2: Commit**

```bash
git add -A && git commit -m "feat: add content engine Settings component"
```

---

## Task 16: Wire All Components Into Content Engine Page

**Files:**
- Modify: `C:\xampp\htdocs\bbj-app\src\app\admin\content-engine\page.jsx`

**Step 1: Import and render all sub-components**

Replace the placeholder content with actual component rendering based on `activeTab`:

```jsx
import CreatePost from "@/components/admin/content-engine/CreatePost";
import NewsFeed from "@/components/admin/content-engine/NewsFeed";
import Generator from "@/components/admin/content-engine/Generator";
import Queue from "@/components/admin/content-engine/Queue";
import PostLog from "@/components/admin/content-engine/PostLog";
import Settings from "@/components/admin/content-engine/Settings";

// In the render:
{activeTab === "create" && <CreatePost />}
{activeTab === "news" && <NewsFeed />}
{activeTab === "generate" && <Generator />}
{activeTab === "queue" && <Queue />}
{activeTab === "log" && <PostLog />}
{activeTab === "settings" && <Settings />}
```

**Step 2: End-to-end verification**

- Login to admin panel
- Navigate to Content Engine tab
- Switch between all sub-tabs
- Test Settings: save Anthropic key and a Facebook page token
- Test Create Post: paste an image, generate caption, post to Facebook (use TRJ page for testing)
- Test News Feed: refresh feeds, scan an article
- Test Generator: generate a template, enhance with AI
- Test Queue: schedule a post, verify it appears
- Test Post Log: verify posted items show up

**Step 3: Commit**

```bash
git add -A && git commit -m "feat: wire all content engine sub-components into admin page"
```

---

## Task 17: Deploy to Staging

**Step 1: Deploy WordPress plugin**

```bash
bash .claude/scripts/deploy-plugin.sh --staging
```

**Step 2: Push Next.js to staging**

```bash
git push origin staging
```

**Step 3: Verify on staging**

- Login to staging admin panel
- Confirm Content Engine tab appears
- Run through the same verification checklist as Task 16

---

## Summary

| Task | What | Where |
|------|------|-------|
| 1 | Database tables | WP Plugin |
| 2 | Permission + admin tab | WP Plugin + Next.js |
| 3 | ContentEngineRoutes (CRUD) | WP Plugin |
| 4 | FacebookRoutes (posting) | WP Plugin |
| 5 | AIRoutes (Anthropic proxy) | WP Plugin |
| 6 | NewsAggregatorRoutes (RSS) | WP Plugin |
| 7 | WP Cron jobs | WP Plugin |
| 8 | Frontend API functions | Next.js |
| 9 | DraftEditor component | Next.js |
| 10 | CreatePost component | Next.js |
| 11 | NewsFeed component | Next.js |
| 12 | Generator component | Next.js |
| 13 | Queue component | Next.js |
| 14 | PostLog component | Next.js |
| 15 | Settings component | Next.js |
| 16 | Wire everything together | Next.js |
| 17 | Deploy to staging | Both |

**Backend tasks (1-7)** can be done independently and in parallel.
**Frontend tasks (8-15)** depend on Task 8 (API functions) but are otherwise independent.
**Task 16** depends on all of 9-15.
**Task 17** depends on everything.
