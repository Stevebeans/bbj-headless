# Live Update Threads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship per-event live-blog threads — editor checkbox flips any post into a chronological, timestamped live update stream with global "one thread at a time" enforcement, ISR-safe caching, and premium-only auto-refresh polling.

**Architecture:** New `LiveThreadState` helper in the WP plugin owns state derivation (none/live/closed) from post meta + a single global option `bbjd_active_live_thread`. New `LiveThreadRoutes` exposes the public/admin/premium endpoints. Next.js gains a cached `getActiveLiveThread()` server helper (tagged `live-thread-active`), a `<LiveUpdateTimeline />` server component, and a premium-only `<LiveUpdatePoller />` client component. The top header strip and homepage banner reuse the same cached helper. Webhook tags stay narrow (`live-thread-{post_id}`) to avoid the May 2026 invalidation cascade.

**Tech Stack:** WordPress 6.x + PHP 8.x (custom plugin `bigbrotherjunkies-data`), Next.js 15 (App Router), React 19, JavaScript only (no TypeScript), Tailwind CSS v3, ISR via `revalidate: false` + tag-based webhook revalidation, Cloudflare edge cache purge on path-based revalidation.

**Spec:** `docs/superpowers/specs/2026-05-17-live-update-threads-design.md`

**Mockups:** `.superpowers/brainstorm/1211-1779065713/content/` (editor-sidebar.html, live-indicators.html, post-page.html)

**Verification model:** No Jest/Vitest in this project. Each task verifies via the local dev server (`npm run dev` at `localhost:3000`, XAMPP WP at `bbj.localhost`), `curl` against REST endpoints, browser inspection, `npm run lint`, and `npm run build`. Final integration test on staging via `/full-push`. **Do not push to production until the user explicitly says "push live".**

---

## File Map

### WordPress plugin (`C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data`)

- Create: `src/LiveThread/LiveThreadState.php` — state derivation + atomic option helpers
- Create: `src/LiveThread/LiveThreadMigrator.php` — one-time migration of legacy `liveFeedThread` posts
- Create: `src/LiveThread/LiveThreadCron.php` — cron to auto-close past-end threads
- Create: `src/Api/LiveThreadRoutes.php` — REST routes
- Modify: `src/Plugin.php` — wire LiveThread classes into bootstrap
- Modify: `src/Api/FeedUpdateRoutes.php` — attach new updates to active thread + fire revalidation
- Modify: `src/Api/HomeRoutes.php` (or wherever the `getContent` post payload is built) — surface live thread fields

### Next.js app (`C:\xampp\htdocs\bbj-app`)

- Create: `src/lib/api/liveThread.js` — cached helpers
- Create: `src/components/posts/LiveUpdateTimeline.jsx` — server component, chronological rendering
- Create: `src/components/posts/LiveUpdateSortToggle.jsx` — client subcomponent for sort pref
- Create: `src/components/posts/LiveUpdatePoller.jsx` — premium polling client component
- Create: `src/components/posts/JumpToLatestPill.jsx` — floating client pill
- Create: `src/components/home/LiveThreadBanner.jsx` — homepage banner
- Modify: `src/app/api/revalidate/route.js` — handle new types
- Modify: `src/lib/api/posts.js` — surface live thread fields
- Modify: `src/components/layout/Header.jsx` — repurpose top strip when thread is live
- Modify: `src/app/page.jsx` — mount LiveThreadBanner above Hero
- Modify: `src/app/[slug]/page.jsx` — render LiveUpdateTimeline instead of FeedUpdates when liveUpdates is set
- Modify: `src/components/editor/EditorSidebar.jsx` — add Live Updates control block
- Delete (after verification): `src/components/posts/FeedUpdates.jsx`

---

## Pre-flight

- [ ] **Step 1: Confirm working directories and clean state**

```powershell
cd C:\xampp\htdocs\bbj-app
git status
git pull
```

Expected: on `staging` branch, clean working tree (or only the spec changes you just committed).

```powershell
cd C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data
git status
```

Expected: clean working tree.

- [ ] **Step 2: Start dev server**

```powershell
cd C:\xampp\htdocs\bbj-app
npm run dev
```

Expected: server up on `http://localhost:3000`, no errors. Leave this running through the whole plan.

- [ ] **Step 3: Confirm XAMPP WordPress is up**

Open `http://bbj.localhost/wp-json/bbjd/v1/hero-post` in a browser. Expected: a JSON payload. If 404 or connection refused, start XAMPP Apache from the control panel.

- [ ] **Step 4: Switch local Next.js to local WP backend**

In `.env.local`:

```env
WORDPRESS_API_URL=http://bbj.localhost/wp-json
NEXT_PUBLIC_WORDPRESS_API_URL=http://bbj.localhost/wp-json
```

Restart `npm run dev` after the env change.

---

## Phase A — WordPress plugin: state foundation

### Task 1: Create LiveThreadState helper

**Files:**
- Create: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\LiveThread\LiveThreadState.php`

- [ ] **Step 1: Create the directory**

```powershell
New-Item -ItemType Directory -Path "C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\LiveThread" -Force
```

- [ ] **Step 2: Write LiveThreadState.php**

```php
<?php

namespace BigBrotherJunkies\Data\LiveThread;

use BigBrotherJunkies\Data\Utils\Revalidation;
use WP_Post;

/**
 * Owns the live-update state machine for posts.
 *
 * States (derived, never stored):
 *   - 'none'   : not a live thread
 *   - 'live'   : currently active (matches global option, in window, not closed)
 *   - 'closed' : was a live thread, no longer active
 */
class LiveThreadState
{
    public const OPTION_ACTIVE = 'bbjd_active_live_thread';

    public const META_LIVE_UPDATES = '_bbjd_live_updates';
    public const META_LIVE_START   = '_bbjd_live_start';
    public const META_LIVE_END     = '_bbjd_live_end';
    public const META_CLOSED_AT    = '_bbjd_closed_at';
    public const META_CLOSING_SUMMARY = '_bbjd_closing_summary';

    /**
     * Derive the live-thread state for a post.
     */
    public static function getState(WP_Post $post): string
    {
        $enabled = (int) get_post_meta($post->ID, self::META_LIVE_UPDATES, true);
        if ($enabled !== 1) {
            return 'none';
        }

        $closedAt = (int) get_post_meta($post->ID, self::META_CLOSED_AT, true);
        if ($closedAt > 0) {
            return 'closed';
        }

        $start = (int) get_post_meta($post->ID, self::META_LIVE_START, true);
        $end   = (int) get_post_meta($post->ID, self::META_LIVE_END, true);
        $now   = time();

        if ($start > 0 && $now < $start) {
            return 'closed'; // scheduled but window hasn't started yet — treat as closed to be safe
        }

        if ($end > 0 && $now > $end) {
            return 'closed';
        }

        $activeId = (int) get_option(self::OPTION_ACTIVE, 0);
        if ($activeId !== $post->ID) {
            return 'closed';
        }

        return 'live';
    }

    /**
     * Get the currently active live thread post, or null.
     */
    public static function getActivePost(): ?WP_Post
    {
        $id = (int) get_option(self::OPTION_ACTIVE, 0);
        if ($id <= 0) {
            return null;
        }
        $post = get_post($id);
        if (!$post || $post->post_status !== 'publish') {
            return null;
        }
        if (self::getState($post) !== 'live') {
            return null;
        }
        return $post;
    }

    /**
     * Atomically open a new thread.
     *
     * If a thread is already active, it is closed first (its _bbjd_closed_at
     * is stamped). The global option is then set to the new post ID.
     *
     * Returns the previously-active post ID (or 0 if none).
     */
    public static function openThread(int $newPostId): int
    {
        global $wpdb;

        $previousId = (int) get_option(self::OPTION_ACTIVE, 0);
        $now = time();

        $wpdb->query('START TRANSACTION');
        try {
            if ($previousId > 0 && $previousId !== $newPostId) {
                update_post_meta($previousId, self::META_CLOSED_AT, $now);
            }

            // Ensure the new post is marked as a live-updates post
            update_post_meta($newPostId, self::META_LIVE_UPDATES, 1);
            delete_post_meta($newPostId, self::META_CLOSED_AT);

            update_option(self::OPTION_ACTIVE, $newPostId, false);

            $wpdb->query('COMMIT');
        } catch (\Throwable $e) {
            $wpdb->query('ROLLBACK');
            throw $e;
        }

        // Fire revalidation tags (outside the transaction)
        Revalidation::revalidateTag('live-thread-active');
        Revalidation::revalidateTag("live-thread-{$newPostId}");
        if ($previousId > 0 && $previousId !== $newPostId) {
            Revalidation::revalidateTag("live-thread-{$previousId}");
        }

        return $previousId;
    }

    /**
     * Close the currently-active thread (or a specific post).
     */
    public static function closeThread(?int $postId = null): void
    {
        $activeId = (int) get_option(self::OPTION_ACTIVE, 0);
        $targetId = $postId ?? $activeId;
        if ($targetId <= 0) {
            return;
        }

        update_post_meta($targetId, self::META_CLOSED_AT, time());

        if ($activeId === $targetId) {
            update_option(self::OPTION_ACTIVE, 0, false);
        }

        Revalidation::revalidateTag('live-thread-active');
        Revalidation::revalidateTag("live-thread-{$targetId}");
    }

    /**
     * Find which currently-live thread (if any) a feed-update at $updateTime
     * belongs to. Returns post ID or 0.
     */
    public static function findThreadForUpdate(int $updateTime): int
    {
        $activePost = self::getActivePost();
        if (!$activePost) {
            return 0;
        }

        $start = (int) get_post_meta($activePost->ID, self::META_LIVE_START, true);
        $end   = (int) get_post_meta($activePost->ID, self::META_LIVE_END, true);

        if ($start > 0 && $updateTime < $start) {
            return 0;
        }
        if ($end > 0 && $updateTime > $end) {
            return 0;
        }

        return $activePost->ID;
    }
}
```

- [ ] **Step 3: Wire LiveThreadState into Plugin.php so the class is autoloaded**

The plugin already uses Composer-style PSR-4 autoloading via the existing `BigBrotherJunkies\Data\LiveThread` namespace pattern. No edits needed if autoloading is wired by directory. Verify by tailing the autoload config:

```powershell
Get-Content "C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\composer.json"
```

Expected: a `psr-4` block mapping `BigBrotherJunkies\Data\\` → `src/`. If found, the new class autoloads. If not, run `composer dump-autoload` in the plugin directory.

- [ ] **Step 4: Commit**

```powershell
cd C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data
git add src/LiveThread/LiveThreadState.php
git commit -m "feat(live-thread): add state machine helper"
```

---

### Task 2: Register post meta + legacy migration

**Files:**
- Create: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\LiveThread\LiveThreadMigrator.php`
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Plugin.php` — register meta + run migration on activation

- [ ] **Step 1: Write LiveThreadMigrator.php**

```php
<?php

namespace BigBrotherJunkies\Data\LiveThread;

/**
 * One-time migration of posts that used the legacy `liveFeedThread` flag
 * (calendar-day feed-update embed). Converts each to a closed live-thread
 * matching its publish day.
 *
 * Idempotent — safe to run multiple times. Records completion in an option.
 */
class LiveThreadMigrator
{
    private const FLAG_OPTION = 'bbjd_live_thread_migration_v1';
    private const LEGACY_META = '_bbjd_live_feed_thread'; // adjust if the legacy field name differs

    public static function maybeRun(): void
    {
        if ((int) get_option(self::FLAG_OPTION, 0) === 1) {
            return;
        }

        $posts = get_posts([
            'post_type'      => 'post',
            'posts_per_page' => -1,
            'meta_query'     => [
                [
                    'key'     => self::LEGACY_META,
                    'value'   => '1',
                    'compare' => '=',
                ],
            ],
            'fields' => 'ids',
        ]);

        $now = time();
        foreach ($posts as $postId) {
            $postDate = get_the_date('Y-m-d', $postId);
            $start = (int) strtotime($postDate . ' 00:00:00');
            $end   = (int) strtotime($postDate . ' 23:59:59');

            update_post_meta($postId, LiveThreadState::META_LIVE_UPDATES, 1);
            update_post_meta($postId, LiveThreadState::META_LIVE_START, $start);
            update_post_meta($postId, LiveThreadState::META_LIVE_END, $end);
            update_post_meta($postId, LiveThreadState::META_CLOSED_AT, $now);
        }

        update_option(self::FLAG_OPTION, 1, false);
    }
}
```

- [ ] **Step 2: Verify the legacy meta key name**

The migrator assumes the legacy field is `_bbjd_live_feed_thread`. Confirm:

```powershell
Select-String -Path "C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\**\*.php" -Pattern "live_feed_thread|liveFeedThread"
```

If the actual key is different (e.g. `_live_feed_thread`), update the `LEGACY_META` constant in `LiveThreadMigrator.php` before continuing.

- [ ] **Step 3: Register meta + boot LiveThread classes in Plugin.php**

Open `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Plugin.php`. Add to the top of the file alongside other `use` statements:

```php
use BigBrotherJunkies\Data\LiveThread\LiveThreadMigrator;
use BigBrotherJunkies\Data\LiveThread\LiveThreadState;
```

Find the `boot()` method (around line ~150 where it calls `$this->initApiRoutes()`). Immediately above that call, add:

```php
$this->registerLiveThreadMeta();
add_action('init', [LiveThreadMigrator::class, 'maybeRun'], 20);
```

Then add the new private method at the end of the class:

```php
/**
 * Register live-thread post meta so it shows up in REST responses when needed.
 */
private function registerLiveThreadMeta(): void
{
    $singleInt = [
        'single'       => true,
        'type'         => 'integer',
        'show_in_rest' => true,
        'auth_callback' => function () { return current_user_can('edit_posts'); },
    ];
    $singleBool = [
        'single'       => true,
        'type'         => 'boolean',
        'show_in_rest' => true,
        'auth_callback' => function () { return current_user_can('edit_posts'); },
    ];
    $singleString = [
        'single'       => true,
        'type'         => 'string',
        'show_in_rest' => true,
        'auth_callback' => function () { return current_user_can('edit_posts'); },
    ];

    register_post_meta('post', LiveThreadState::META_LIVE_UPDATES, $singleBool);
    register_post_meta('post', LiveThreadState::META_LIVE_START, $singleInt);
    register_post_meta('post', LiveThreadState::META_LIVE_END, $singleInt);
    register_post_meta('post', LiveThreadState::META_CLOSED_AT, $singleInt);
    register_post_meta('post', LiveThreadState::META_CLOSING_SUMMARY, $singleString);

    // Per-feed-update meta — only render-only for v1, but the field must exist.
    register_post_meta('bbj_feed_update', '_bbjd_breaking', $singleBool);
}
```

- [ ] **Step 4: Trigger the migration manually for first run**

In a browser, visit `http://bbj.localhost/wp-admin/`. Click any admin page link — this fires the `init` action and runs `maybeRun()` once.

Verify by checking the option:

```powershell
# From XAMPP MySQL (or your DB client):
# SELECT option_value FROM wp_options WHERE option_name = 'bbjd_live_thread_migration_v1';
```

Expected: returns `1`.

Or use the existing MySQL MCP query helper:

```sql
SELECT option_value FROM wp_options WHERE option_name = 'bbjd_live_thread_migration_v1';
```

- [ ] **Step 5: Commit**

```powershell
cd C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data
git add src/LiveThread/LiveThreadMigrator.php src/Plugin.php
git commit -m "feat(live-thread): register post meta + migrate legacy liveFeedThread posts"
```

---

### Task 3: Auto-close cron for elapsed `live_end`

**Files:**
- Create: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\LiveThread\LiveThreadCron.php`
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Plugin.php` — schedule + hook the cron

- [ ] **Step 1: Write LiveThreadCron.php**

```php
<?php

namespace BigBrotherJunkies\Data\LiveThread;

/**
 * Checks every 5 minutes whether the currently-active live thread has passed
 * its `live_end` timestamp. If so, closes it.
 *
 * Defense-in-depth: the state derivation in LiveThreadState::getState() also
 * treats past-end threads as closed. This cron is what stamps _bbjd_closed_at
 * and clears the global option so the rest of the site updates.
 */
class LiveThreadCron
{
    public const HOOK = 'bbjd_live_thread_autoclose';

    public static function schedule(): void
    {
        if (!wp_next_scheduled(self::HOOK)) {
            wp_schedule_event(time() + 60, 'five_minutes', self::HOOK);
        }
    }

    public static function unschedule(): void
    {
        $next = wp_next_scheduled(self::HOOK);
        if ($next) {
            wp_unschedule_event($next, self::HOOK);
        }
    }

    public static function registerInterval(array $schedules): array
    {
        if (!isset($schedules['five_minutes'])) {
            $schedules['five_minutes'] = [
                'interval' => 5 * 60,
                'display'  => 'Every 5 Minutes',
            ];
        }
        return $schedules;
    }

    public static function run(): void
    {
        $activeId = (int) get_option(LiveThreadState::OPTION_ACTIVE, 0);
        if ($activeId <= 0) {
            return;
        }

        $end = (int) get_post_meta($activeId, LiveThreadState::META_LIVE_END, true);
        // 0 = continuous; do nothing
        if ($end === 0) {
            return;
        }

        if (time() > $end) {
            LiveThreadState::closeThread($activeId);
        }
    }
}
```

- [ ] **Step 2: Wire the cron in Plugin.php**

At the top of `Plugin.php` add:

```php
use BigBrotherJunkies\Data\LiveThread\LiveThreadCron;
```

In the `boot()` method, after the `registerLiveThreadMeta()` call, add:

```php
add_filter('cron_schedules', [LiveThreadCron::class, 'registerInterval']);
add_action(LiveThreadCron::HOOK, [LiveThreadCron::class, 'run']);
LiveThreadCron::schedule();
```

- [ ] **Step 3: Verify the cron is scheduled**

```sql
SELECT option_value FROM wp_options WHERE option_name = 'cron';
```

Expected: serialized array contains `bbjd_live_thread_autoclose`. (Don't try to parse — just visually confirm the string appears.)

- [ ] **Step 4: Commit**

```powershell
cd C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data
git add src/LiveThread/LiveThreadCron.php src/Plugin.php
git commit -m "feat(live-thread): cron to auto-close threads past live_end"
```

---

## Phase B — WordPress plugin: REST API

### Task 4: Create LiveThreadRoutes — current / take-over / close

**Files:**
- Create: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\LiveThreadRoutes.php`
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Plugin.php` — register routes

- [ ] **Step 1: Write LiveThreadRoutes.php (current + take-over + close endpoints)**

```php
<?php

namespace BigBrotherJunkies\Data\Api;

use BigBrotherJunkies\Data\LiveThread\LiveThreadState;
use BigBrotherJunkies\Data\Permissions\PermissionChecker;
use WP_REST_Request;
use WP_REST_Response;
use WP_Error;

class LiveThreadRoutes
{
    public function register(): void
    {
        add_action('rest_api_init', [$this, 'registerRoutes']);
    }

    public function registerRoutes(): void
    {
        $ns = 'bbjd/v1';

        register_rest_route($ns, '/live-thread/current', [
            'methods'             => 'GET',
            'callback'            => [$this, 'getCurrent'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route($ns, '/live-thread/take-over', [
            'methods'             => 'POST',
            'callback'            => [$this, 'takeOver'],
            'permission_callback' => [$this, 'checkAdminPermission'],
            'args' => [
                'new_post_id' => [
                    'required' => true,
                    'type'     => 'integer',
                ],
            ],
        ]);

        register_rest_route($ns, '/live-thread/(?P<id>\d+)/close', [
            'methods'             => 'POST',
            'callback'            => [$this, 'closeThread'],
            'permission_callback' => [$this, 'checkAdminPermission'],
        ]);

        register_rest_route($ns, '/live-thread/(?P<id>\d+)/updates-since', [
            'methods'             => 'GET',
            'callback'            => [$this, 'getUpdatesSince'],
            'permission_callback' => [$this, 'checkSupporterPermission'],
            'args' => [
                'ts' => [
                    'required' => true,
                    'type'     => 'integer',
                ],
            ],
        ]);
    }

    public function getCurrent(WP_REST_Request $req): WP_REST_Response
    {
        $post = LiveThreadState::getActivePost();
        if (!$post) {
            return new WP_REST_Response(null, 200);
        }

        $start = (int) get_post_meta($post->ID, LiveThreadState::META_LIVE_START, true);
        return new WP_REST_Response([
            'post_id'    => $post->ID,
            'title'      => get_the_title($post),
            'slug'       => $post->post_name,
            'started_at' => $start,
        ], 200);
    }

    public function takeOver(WP_REST_Request $req)
    {
        $newPostId = (int) $req->get_param('new_post_id');
        if ($newPostId <= 0 || !get_post($newPostId)) {
            return new WP_Error('invalid_post', 'Post not found.', ['status' => 404]);
        }
        $previousId = LiveThreadState::openThread($newPostId);
        return new WP_REST_Response([
            'new_active'    => $newPostId,
            'closed_previous' => $previousId,
        ], 200);
    }

    public function closeThread(WP_REST_Request $req)
    {
        $id = (int) $req->get_param('id');
        if ($id <= 0 || !get_post($id)) {
            return new WP_Error('invalid_post', 'Post not found.', ['status' => 404]);
        }
        LiveThreadState::closeThread($id);
        return new WP_REST_Response(['closed' => $id], 200);
    }

    public function getUpdatesSince(WP_REST_Request $req)
    {
        // Stub — filled in Task 5
        return new WP_REST_Response(['updates' => []], 200);
    }

    public function checkAdminPermission(): bool
    {
        return (new PermissionChecker())->userCan('bbj_admin_permissions', wp_get_current_user());
    }

    public function checkSupporterPermission(): bool
    {
        $user = wp_get_current_user();
        if (!$user || $user->ID === 0) {
            return false;
        }
        // Supporter detection mirrors existing pattern — adjust if BBJ uses a
        // different meta key or role.
        $isSupporter = (bool) get_user_meta($user->ID, 'bbjd_is_supporter', true);
        return $isSupporter;
    }
}
```

- [ ] **Step 2: Verify supporter check key matches existing pattern**

```powershell
Select-String -Path "C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\**\*.php" -Pattern "is_supporter|isSupporter|bbjd_is_supporter"
```

If supporter is detected via a different mechanism (e.g. a user role, an Auth0 claim, or a `bbjd_subscription_*` meta), update `checkSupporterPermission()` accordingly. If unclear, ask the user — do not guess.

- [ ] **Step 3: Register the route in Plugin.php's `initApiRoutes()`**

In `Plugin.php`, at the top of the file:

```php
use BigBrotherJunkies\Data\Api\LiveThreadRoutes;
```

Inside `initApiRoutes()`, add after the last `->register()` call:

```php
$liveThreadRoutes = new LiveThreadRoutes();
$liveThreadRoutes->register();
```

- [ ] **Step 4: Test the current endpoint**

```powershell
curl http://bbj.localhost/wp-json/bbjd/v1/live-thread/current
```

Expected: `null` (no active thread yet).

- [ ] **Step 5: Commit**

```powershell
cd C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data
git add src/Api/LiveThreadRoutes.php src/Plugin.php
git commit -m "feat(live-thread): add current/take-over/close REST endpoints"
```

---

### Task 5: Implement updates-since (premium polling)

**Files:**
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\LiveThreadRoutes.php`

- [ ] **Step 1: Replace the `getUpdatesSince` stub with real implementation**

```php
public function getUpdatesSince(WP_REST_Request $req)
{
    $threadId = (int) $req->get_param('id');
    $sinceTs  = (int) $req->get_param('ts');

    $thread = get_post($threadId);
    if (!$thread) {
        return new WP_Error('invalid_thread', 'Thread not found.', ['status' => 404]);
    }

    $start = (int) get_post_meta($threadId, LiveThreadState::META_LIVE_START, true);
    $end   = (int) get_post_meta($threadId, LiveThreadState::META_LIVE_END, true);

    // Bound the lower edge: don't return updates before this thread's window.
    $sinceTs = max($sinceTs, $start);

    // Build the query: feed updates whose published time is in (sinceTs, end]
    $metaQuery = [
        [
            'key'     => '_bbjd_update_time',
            'value'   => $sinceTs,
            'type'    => 'NUMERIC',
            'compare' => '>',
        ],
    ];
    if ($end > 0) {
        $metaQuery[] = [
            'key'     => '_bbjd_update_time',
            'value'   => $end,
            'type'    => 'NUMERIC',
            'compare' => '<=',
        ];
        $metaQuery['relation'] = 'AND';
    }

    $updates = get_posts([
        'post_type'      => 'bbj_feed_update',
        'post_status'    => 'publish',
        'posts_per_page' => 100,
        'orderby'        => 'meta_value_num',
        'meta_key'       => '_bbjd_update_time',
        'order'          => 'ASC',
        'meta_query'     => $metaQuery,
    ]);

    $items = array_map([$this, 'serializeFeedUpdate'], $updates);

    $response = new WP_REST_Response([
        'updates'      => $items,
        'thread_state' => LiveThreadState::getState($thread),
        'server_time'  => time(),
    ], 200);

    $response->header('Cache-Control', 'no-store, no-cache, must-revalidate');
    return $response;
}

private function serializeFeedUpdate(\WP_Post $update): array
{
    $time = (int) get_post_meta($update->ID, '_bbjd_update_time', true);
    return [
        'id'         => $update->ID,
        'time'       => $time,
        'time_iso'   => $time > 0 ? gmdate('c', $time) : null,
        'title'      => get_the_title($update),
        'content'    => apply_filters('the_content', $update->post_content),
        'thumbnail'  => get_the_post_thumbnail_url($update->ID, 'large') ?: null,
        'breaking'   => (bool) get_post_meta($update->ID, '_bbjd_breaking', true),
        'author'     => [
            'name' => get_the_author_meta('display_name', $update->post_author),
        ],
    ];
}
```

- [ ] **Step 2: Verify the feed-update post type slug and time meta key**

The code assumes `post_type = 'bbj_feed_update'` and timestamp lives in `_bbjd_update_time`. Verify against existing code:

```powershell
Select-String -Path "C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\**\*.php" -Pattern "bbj_feed_update|_bbjd_update_time"
```

If either differs, update the constants inline. If feed-updates aren't a custom post type but live in another table (e.g. a custom DB table), this endpoint and the existing `FeedUpdateRoutes` need to follow whichever shape exists — adapt without changing storage.

- [ ] **Step 3: Smoke-test (will 403 without supporter cookie, that's expected)**

```powershell
curl -i "http://bbj.localhost/wp-json/bbjd/v1/live-thread/1/updates-since?ts=0"
```

Expected: HTTP 401 or 403 (not authenticated as supporter). Verifying the route exists and auth is gating it.

- [ ] **Step 4: Commit**

```powershell
cd C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data
git add src/Api/LiveThreadRoutes.php
git commit -m "feat(live-thread): premium polling endpoint (updates-since)"
```

---

### Task 6: Attach new feed updates to active thread + fire revalidation

**Files:**
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\FeedUpdateRoutes.php`

- [ ] **Step 1: Locate the create handler**

```powershell
Select-String -Path "C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\FeedUpdateRoutes.php" -Pattern "createFeedUpdate|public function create"
```

Note the function name and line range that handles the create flow.

- [ ] **Step 2: At the end of the create handler, after the feed-update is saved**

Find the line where the new feed-update post ID is available (after `wp_insert_post()`). Immediately before returning the response, add:

```php
use BigBrotherJunkies\Data\LiveThread\LiveThreadState; // add this `use` at the top of the file if missing
use BigBrotherJunkies\Data\Utils\Revalidation;

// ... inside createFeedUpdate after the new ID is known ...

$updateTime = (int) get_post_meta($newFeedUpdateId, '_bbjd_update_time', true);
if ($updateTime === 0) {
    $updateTime = time();
}

$threadId = LiveThreadState::findThreadForUpdate($updateTime);
if ($threadId > 0) {
    // Tag this feed-update with the thread it belongs to so the live page
    // can fetch only its own updates.
    update_post_meta($newFeedUpdateId, '_bbjd_thread_post_id', $threadId);

    // Fire revalidation: this thread's page rebuilds with the new update.
    Revalidation::revalidateTag("live-thread-{$threadId}");

    // Also poke the post path directly so Cloudflare drops its cache.
    $thread = get_post($threadId);
    if ($thread) {
        Revalidation::revalidatePost($thread->post_name);
    }
}
```

Adjust the variable name `$newFeedUpdateId` to match whatever the existing code uses.

- [ ] **Step 3: Verify by writing a feed update via the admin UI or curl**

If the existing create flow can be exercised from XAMPP, publish one feed-update and check that `_bbjd_thread_post_id` was set on the new row when there's an active thread.

```sql
SELECT post_id, meta_value FROM wp_postmeta WHERE meta_key = '_bbjd_thread_post_id' ORDER BY post_id DESC LIMIT 5;
```

Expected: rows showing the thread ID for any new feed-update created while a thread was active.

- [ ] **Step 4: Commit**

```powershell
cd C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data
git add src/Api/FeedUpdateRoutes.php
git commit -m "feat(live-thread): attach new feed updates to active thread + revalidate"
```

---

### Task 7: Surface live thread fields in the post payload

**Files:**
- Modify: whichever route serves the post detail to Next.js's `getContent(slug)` — most likely a method in `HomeRoutes.php` or a dedicated `PostRoutes`/`ContentRoutes`

- [ ] **Step 1: Locate the post detail endpoint**

```powershell
Select-String -Path "C:\xampp\htdocs\bbj-app\src\lib\api\posts.js" -Pattern "getContent|bbjd/v1"
```

The Next.js side calls `getContent(slug)`. Trace which WP endpoint it hits, then locate the handler in the WP plugin.

```powershell
Select-String -Path "C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\*.php" -Pattern "register_rest_route.*post|getContent|/post/"
```

- [ ] **Step 2: Add live thread fields to the response array**

Inside the endpoint's response builder, after the existing fields, add:

```php
use BigBrotherJunkies\Data\LiveThread\LiveThreadState; // add this `use` if missing

// ... where the response array is being built for a post ...

$liveState = LiveThreadState::getState($post);
$response['liveUpdates']    = $liveState !== 'none';
$response['liveState']      = $liveState; // 'none' | 'live' | 'closed'
$response['liveStart']      = (int) get_post_meta($post->ID, LiveThreadState::META_LIVE_START, true);
$response['liveEnd']        = (int) get_post_meta($post->ID, LiveThreadState::META_LIVE_END, true);
$response['closedAt']       = (int) get_post_meta($post->ID, LiveThreadState::META_CLOSED_AT, true);
$response['closingSummary'] = (string) get_post_meta($post->ID, LiveThreadState::META_CLOSING_SUMMARY, true);
```

Also add an endpoint to fetch updates for a specific thread (used by server-rendered `<LiveUpdateTimeline />`):

```php
register_rest_route($ns, '/live-thread/(?P<id>\d+)/updates', [
    'methods'             => 'GET',
    'callback'            => [$this, 'getAllUpdatesForThread'],
    'permission_callback' => '__return_true',
]);

public function getAllUpdatesForThread(WP_REST_Request $req)
{
    $threadId = (int) $req->get_param('id');
    $thread = get_post($threadId);
    if (!$thread) {
        return new WP_Error('invalid_thread', 'Thread not found.', ['status' => 404]);
    }

    $start = (int) get_post_meta($threadId, LiveThreadState::META_LIVE_START, true);
    $end   = (int) get_post_meta($threadId, LiveThreadState::META_LIVE_END, true);

    $metaQuery = [
        [
            'key'     => '_bbjd_update_time',
            'value'   => $start,
            'type'    => 'NUMERIC',
            'compare' => '>=',
        ],
    ];
    if ($end > 0) {
        $metaQuery[] = [
            'key'     => '_bbjd_update_time',
            'value'   => $end,
            'type'    => 'NUMERIC',
            'compare' => '<=',
        ];
        $metaQuery['relation'] = 'AND';
    }

    $updates = get_posts([
        'post_type'      => 'bbj_feed_update',
        'post_status'    => 'publish',
        'posts_per_page' => -1, // closed thread = full archive; live thread = self-bounded by window
        'orderby'        => 'meta_value_num',
        'meta_key'       => '_bbjd_update_time',
        'order'          => 'ASC',
        'meta_query'     => $metaQuery,
    ]);

    return new WP_REST_Response([
        'updates'      => array_map([$this, 'serializeFeedUpdate'], $updates),
        'thread_state' => LiveThreadState::getState($thread),
        'live_start'   => $start,
        'live_end'     => $end,
    ], 200);
}
```

This new route can live in `LiveThreadRoutes.php` (since it shares the `serializeFeedUpdate` helper).

- [ ] **Step 3: Test the new fields are exposed**

```powershell
curl http://bbj.localhost/wp-json/bbjd/v1/post/SOME_EXISTING_SLUG
```

(replace `post/SOME_EXISTING_SLUG` with whichever endpoint Next.js actually calls in `getContent`).

Expected: response includes `liveUpdates: false`, `liveState: "none"`, and the other fields.

- [ ] **Step 4: Commit**

```powershell
cd C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data
git add src/Api/
git commit -m "feat(live-thread): expose live state in post payload + add /updates endpoint"
```

---

## Phase C — Next.js: revalidation & plumbing

### Task 8: Extend the revalidate webhook with new types

**Files:**
- Modify: `C:\xampp\htdocs\bbj-app\src\app\api\revalidate\route.js`

- [ ] **Step 1: Add two new cases to the switch statement**

In `src/app/api/revalidate/route.js`, find the `switch (type) { ... }` block. Before the `default:` case, add:

```javascript
case "live-thread-state":
  // Open / close / take-over: layout-level chrome needs to flip.
  revalidateTag("live-thread-active");
  revalidatePath("/", "layout");
  if (slug) {
    revalidatePath(`/${slug}`);
    revalidateTag(`live-thread-${body.postId || slug}`);
    cfPurgePaths.push(`/${slug}`);
  }
  revalidatePath("/");
  cfPurgePaths.push("/");
  break;

case "live-thread-update":
  // New feed-update in an active thread: only that thread's page needs to update.
  if (body.postId) {
    revalidateTag(`live-thread-${body.postId}`);
  }
  if (slug) {
    revalidatePath(`/${slug}`);
    cfPurgePaths.push(`/${slug}`);
  }
  break;
```

- [ ] **Step 2: Manual smoke test**

In a separate terminal:

```powershell
curl -X POST http://localhost:3000/api/revalidate -H "Content-Type: application/json" -d '{"secret":"YOUR_SECRET","type":"live-thread-update","slug":"some-post","postId":123}'
```

(Replace `YOUR_SECRET` with the value of `REVALIDATION_SECRET` in `.env.local`.)

Expected: `{"revalidated": true, ...}`.

- [ ] **Step 3: Commit**

```powershell
cd C:\xampp\htdocs\bbj-app
git add src/app/api/revalidate/route.js
git commit -m "feat(revalidate): add live-thread-state and live-thread-update types"
```

---

### Task 9: Create `liveThread.js` API helpers

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\lib\api\liveThread.js`

- [ ] **Step 1: Write the helpers**

```javascript
import { bbjdFetch } from "./wordpress";

/**
 * Server-side: fetch the currently-active live thread (or null).
 * Cached with tag `live-thread-active` — invalidated only on open/close/take-over.
 */
export async function getActiveLiveThread() {
  try {
    const data = await bbjdFetch("/live-thread/current", {
      tags: ["live-thread-active"],
      revalidate: false,
    });
    return data || null;
  } catch (err) {
    console.error("[liveThread] getActiveLiveThread failed:", err.message);
    return null;
  }
}

/**
 * Server-side: fetch all updates for a specific thread (used by the timeline).
 * Cached per-thread with tag `live-thread-{postId}`.
 */
export async function getThreadUpdates(postId) {
  try {
    const data = await bbjdFetch(`/live-thread/${postId}/updates`, {
      tags: [`live-thread-${postId}`],
      revalidate: false,
    });
    return data || { updates: [], thread_state: "none" };
  } catch (err) {
    console.error("[liveThread] getThreadUpdates failed:", err.message);
    return { updates: [], thread_state: "none" };
  }
}

/**
 * Client-side: poll for new updates since a timestamp.
 * Used by `<LiveUpdatePoller />` for premium users. Authenticated via Bearer.
 */
export async function fetchUpdatesSince(postId, sinceTs, token) {
  const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL ||
                 "https://bigbrotherjunkies.com/wp-json";
  const res = await fetch(
    `${apiUrl}/bbjd/v1/live-thread/${postId}/updates-since?ts=${sinceTs}`,
    {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
  if (!res.ok) {
    throw new Error(`updates-since failed: HTTP ${res.status}`);
  }
  return res.json();
}
```

- [ ] **Step 2: Smoke test via Next.js server fetch**

Temporarily edit `src/app/page.jsx` to log the result, restart `npm run dev`, and visit `http://localhost:3000`. You should see in the terminal logs that `getActiveLiveThread()` returns `null`.

Revert any temporary debug logs.

- [ ] **Step 3: Commit**

```powershell
cd C:\xampp\htdocs\bbj-app
git add src/lib/api/liveThread.js
git commit -m "feat(live-thread): add cached frontend API helpers"
```

---

### Task 10: Surface live thread fields in `posts.js`

**Files:**
- Modify: `C:\xampp\htdocs\bbj-app\src\lib\api\posts.js`

- [ ] **Step 1: Read the current shape**

```powershell
Get-Content C:\xampp\htdocs\bbj-app\src\lib\api\posts.js
```

Locate the `getContent` function. It maps the WP REST response into a `content` object consumed by `/[slug]/page.jsx`.

- [ ] **Step 2: Add the new fields to the mapped object**

In the place where the response is being destructured into the content shape, add:

```javascript
// In the mapping that builds the content object returned by getContent():
liveUpdates:    !!data.liveUpdates,
liveState:      data.liveState || "none",
liveStart:      data.liveStart || 0,
liveEnd:        data.liveEnd || 0,
closedAt:       data.closedAt || 0,
closingSummary: data.closingSummary || "",
```

- [ ] **Step 3: Verify with a known slug**

```powershell
curl http://localhost:3000/api/some-server-endpoint-that-uses-getContent
```

(or visit any post in the browser and confirm no errors — the new fields won't be used yet but should not break the page).

- [ ] **Step 4: Commit**

```powershell
cd C:\xampp\htdocs\bbj-app
git add src/lib/api/posts.js
git commit -m "feat(live-thread): surface live state fields in post payload"
```

---

## Phase D — Next.js: site chrome

### Task 11: Modify Header.jsx — repurpose top strip when thread is active

**Files:**
- Modify: `C:\xampp\htdocs\bbj-app\src\components\layout\Header.jsx`

- [ ] **Step 1: Inspect the current header structure**

```powershell
Get-Content C:\xampp\htdocs\bbj-app\src\components\layout\Header.jsx | Select-String -Pattern "Watch Feeds|LIVE" -Context 2,2
```

Find the JSX block that renders the "Watch Feeds | LIVE" pill.

- [ ] **Step 2: Convert that block to read from the cached helper**

If Header.jsx is currently a Client Component (`"use client"`), it can't directly call the server helper. Two options:

**Option A — Header is or can be a Server Component:** Make the header an async server component. Replace the JSX block with:

```jsx
import { getActiveLiveThread } from "@/lib/api/liveThread";

// inside the async function component:
const liveThread = await getActiveLiveThread();

// in JSX where the Watch Feeds pill is:
{liveThread ? (
  <a
    href={`/${liveThread.slug}`}
    className="inline-flex items-center gap-2 text-secondary-500 font-bold hover:text-secondary-400"
  >
    <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
      LIVE
    </span>
    <span>{liveThread.title} →</span>
  </a>
) : (
  // existing Watch Feeds | LIVE markup
)}
```

**Option B — Header must remain a Client Component:** Lift the fetch into the parent server layout (`src/app/layout.jsx`), pass `liveThread` as a prop to `<Header liveThread={...} />`.

Pick whichever matches the current architecture. If Header.jsx currently has `"use client"` AND uses auth hooks, Option B is safer.

- [ ] **Step 3: Verify caching invariants**

The new server fetch must NOT introduce `cookies()`, `headers()`, or `draftMode()` in any shared route segment. Run:

```powershell
Select-String -Path "C:\xampp\htdocs\bbj-app\src\components\layout\Header.jsx","C:\xampp\htdocs\bbj-app\src\app\layout.jsx" -Pattern "cookies\(\)|headers\(\)|draftMode\(\)"
```

Expected: no matches inside the modified files. If matches exist (from prior code), they should be unchanged by this task — flag for review.

- [ ] **Step 4: Smoke test (no active thread yet, so should look identical)**

Reload `http://localhost:3000`. Expected: page looks identical, "Watch Feeds | LIVE" pill renders normally, no console errors.

- [ ] **Step 5: Commit**

```powershell
cd C:\xampp\htdocs\bbj-app
git add src/components/layout/Header.jsx src/app/layout.jsx
git commit -m "feat(live-thread): top strip flips to active thread when set"
```

---

### Task 12: Homepage banner

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\components\home\LiveThreadBanner.jsx`
- Modify: `C:\xampp\htdocs\bbj-app\src\app\page.jsx`

- [ ] **Step 1: Write LiveThreadBanner.jsx**

```jsx
import Link from "next/link";
import { getActiveLiveThread } from "@/lib/api/liveThread";

export async function LiveThreadBanner() {
  const liveThread = await getActiveLiveThread();
  if (!liveThread) return null;

  return (
    <div className="mb-4 rounded-lg overflow-hidden border-2 border-red-500/30 bg-gradient-to-r from-red-50 via-white to-red-50 dark:from-red-950/40 dark:via-gray-900 dark:to-red-950/40">
      <Link
        href={`/${liveThread.slug}`}
        className="flex items-center gap-3 p-4 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors"
      >
        <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          LIVE NOW
        </span>
        <span className="flex-grow font-display text-xl md:text-2xl text-primary-500 dark:text-primary-300 font-bold">
          {liveThread.title}
        </span>
        <span className="text-primary-500 dark:text-primary-300 font-bold hidden sm:inline">
          Join the thread →
        </span>
      </Link>
    </div>
  );
}
```

- [ ] **Step 2: Mount it above the Hero in page.jsx**

In `src/app/page.jsx`, add the import:

```jsx
import { LiveThreadBanner } from "@/components/home/LiveThreadBanner";
```

In the JSX tree, immediately above the existing `<Hero />` (or its wrapper), add:

```jsx
<LiveThreadBanner />
```

- [ ] **Step 3: Smoke test**

Reload `http://localhost:3000`. With no active thread, the banner renders nothing (returns `null`). Expected: homepage unchanged.

- [ ] **Step 4: Commit**

```powershell
cd C:\xampp\htdocs\bbj-app
git add src/components/home/LiveThreadBanner.jsx src/app/page.jsx
git commit -m "feat(live-thread): homepage banner above hero when thread is active"
```

---

## Phase E — Next.js: live update timeline

### Task 13: Build LiveUpdateTimeline (server component, chronological rendering)

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\components\posts\LiveUpdateTimeline.jsx`

- [ ] **Step 1: Write the component**

```jsx
import { getThreadUpdates } from "@/lib/api/liveThread";
import { LiveUpdateSortToggle } from "./LiveUpdateSortToggle";
import { LiveUpdatePoller } from "./LiveUpdatePoller";
import { JumpToLatestPill } from "./JumpToLatestPill";
import Image from "next/image";

/**
 * Server component: renders the timeline of feed-updates for a live thread.
 *
 * @param {{ postId: number, liveState: 'live'|'closed', closedAt: number, closingSummary: string }} props
 */
export async function LiveUpdateTimeline({ postId, liveState, closedAt, closingSummary }) {
  const { updates, thread_state } = await getThreadUpdates(postId);
  // Trust the server's view of state if it disagrees (avoids stale client state)
  const state = thread_state === "live" || thread_state === "closed" ? thread_state : liveState;

  const updateCount = updates.length;
  const newestTs = updates.length > 0 ? updates[updates.length - 1].time : 0;

  return (
    <section
      id="live-updates"
      className="mt-6 pt-4 border-t-2 border-gray-200 dark:border-gray-700"
      data-live-state={state}
    >
      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        {state === "live" ? (
          <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE
          </span>
        ) : (
          <ClosedBanner closedAt={closedAt} />
        )}
        <h2 className="font-display text-2xl md:text-3xl text-primary-500 dark:text-primary-300 font-bold">
          Live Updates
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          · {updateCount} update{updateCount === 1 ? "" : "s"}
        </span>
        {state === "live" && (
          <div className="ml-auto flex items-center gap-2">
            <LiveUpdateSortToggle />
            <span className="text-[11px] text-gray-400">Auto-updates: premium ⭐</span>
          </div>
        )}
      </div>

      {/* Optional closing recap (AI roadmap, empty for now) */}
      {state === "closed" && closingSummary && (
        <div className="mb-4 p-3 rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
          <div className="text-sm font-bold text-yellow-800 dark:text-yellow-200 mb-1">Recap</div>
          <div
            className="text-sm text-yellow-900 dark:text-yellow-100 prose prose-sm dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: closingSummary }}
          />
        </div>
      )}

      {/* Timeline */}
      {updateCount === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          {state === "live" ? "Waiting for the first update…" : "No updates were posted in this thread."}
        </div>
      ) : (
        <ol
          className="relative pl-7 list-none m-0 p-0"
          data-sortable
        >
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-red-500 via-gray-300 to-gray-300 dark:via-gray-600 dark:to-gray-600" />
          {updates.map((u, idx) => {
            const isNewest = idx === updates.length - 1 && state === "live";
            return (
              <li key={u.id} className="relative pb-5 list-none">
                <span
                  className={
                    "absolute -left-[22px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 " +
                    (u.breaking || isNewest
                      ? "bg-red-500 ring-2 ring-red-500/40 " + (isNewest ? "animate-pulse" : "")
                      : "bg-gray-300 dark:bg-gray-600")
                  }
                />
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
                  {u.breaking && (
                    <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
                      Breaking
                    </span>
                  )}
                  <time dateTime={u.time_iso || undefined}>{formatUpdateTime(u.time)}</time>
                </div>
                {u.title && (
                  <div className="font-bold text-primary-500 dark:text-primary-300 mb-1">{u.title}</div>
                )}
                {u.thumbnail && (
                  <div className="my-2">
                    <Image
                      src={u.thumbnail}
                      alt={u.title || "Feed update image"}
                      width={600}
                      height={400}
                      className="rounded-md"
                      style={{ width: "auto", height: "auto", maxWidth: "100%" }}
                    />
                  </div>
                )}
                {u.content && (
                  <div
                    className={
                      "text-sm prose prose-sm dark:prose-invert max-w-none " +
                      (isNewest ? "bg-red-50 dark:bg-red-950/30 border-l-2 border-red-500 pl-3 py-1 rounded-r" : "")
                    }
                    dangerouslySetInnerHTML={{ __html: u.content }}
                  />
                )}
              </li>
            );
          })}
        </ol>
      )}

      {/* Premium polling — initializes only when state=live AND user is supporter */}
      {state === "live" && (
        <LiveUpdatePoller postId={postId} initialLastSeen={newestTs} />
      )}

      {/* Floating jump-to-latest pill */}
      {state === "live" && updateCount > 0 && <JumpToLatestPill />}
    </section>
  );
}

function ClosedBanner({ closedAt }) {
  const dt = closedAt > 0 ? new Date(closedAt * 1000) : null;
  const label = dt
    ? dt.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : null;
  return (
    <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold px-3 py-1.5 rounded-md border-l-4 border-slate-500">
      <span>● Thread closed</span>
      {label && <span className="font-normal text-slate-500 dark:text-slate-400">{label}</span>}
    </div>
  );
}

function formatUpdateTime(unixSeconds) {
  if (!unixSeconds) return "";
  const dt = new Date(unixSeconds * 1000);
  return dt.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
    timeZoneName: "short",
  });
}
```

- [ ] **Step 2: Commit (component compiles even though it depends on unmade subcomponents — those come next)**

The component imports `LiveUpdateSortToggle`, `LiveUpdatePoller`, `JumpToLatestPill` — those don't exist yet. The page won't be mounted until Task 17, so this commit is fine; the next 3 tasks unblock the imports.

```powershell
cd C:\xampp\htdocs\bbj-app
git add src/components/posts/LiveUpdateTimeline.jsx
git commit -m "feat(live-thread): LiveUpdateTimeline server component"
```

---

### Task 14: Sort toggle subcomponent (localStorage preference)

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\components\posts\LiveUpdateSortToggle.jsx`

- [ ] **Step 1: Write the client component**

```jsx
"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "bbjd_live_sort";

/**
 * Client component: toggles the rendered order of the timeline.
 * Reads/writes the user's preference to localStorage. On mount, if the
 * preference is "newest", it reverses the static `<ol data-sortable>`
 * served by the server.
 */
export function LiveUpdateSortToggle() {
  const [sort, setSort] = useState("oldest");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "newest" || stored === "oldest") {
        setSort(stored);
        applySort(stored);
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  function toggle() {
    const next = sort === "oldest" ? "newest" : "oldest";
    setSort(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    applySort(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="text-xs px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
      aria-label="Toggle sort order"
    >
      {sort === "oldest" ? "↑ Oldest first" : "↓ Newest first"}
    </button>
  );
}

function applySort(sort) {
  if (typeof document === "undefined") return;
  const list = document.querySelector("ol[data-sortable]");
  if (!list) return;
  const items = Array.from(list.children).filter((c) => c.tagName === "LI");
  const inAscOrder = items.length < 2 ||
    (items[0].dataset.ts || "") <= (items[items.length - 1].dataset.ts || "");
  const wantsAsc = sort === "oldest";
  if (inAscOrder !== wantsAsc) {
    items.reverse().forEach((node) => list.appendChild(node));
  }
}
```

Note: requires `<li data-ts={u.time}>` on each timeline item — add `data-ts={u.time}` to the `<li>` in `LiveUpdateTimeline.jsx` if not already there.

- [ ] **Step 2: Add `data-ts` to the timeline items**

In `src/components/posts/LiveUpdateTimeline.jsx`, modify the `<li>` opening tag inside `updates.map(...)`:

```jsx
<li key={u.id} data-ts={u.time} className="relative pb-5 list-none">
```

- [ ] **Step 3: Commit**

```powershell
cd C:\xampp\htdocs\bbj-app
git add src/components/posts/LiveUpdateSortToggle.jsx src/components/posts/LiveUpdateTimeline.jsx
git commit -m "feat(live-thread): per-user sort toggle (localStorage)"
```

---

### Task 15: LiveUpdatePoller (premium-only client polling)

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\components\posts\LiveUpdatePoller.jsx`

- [ ] **Step 1: Inspect how `isSupporter` and the JWT token are exposed**

```powershell
Select-String -Path "C:\xampp\htdocs\bbj-app\src\context\AuthContext.jsx" -Pattern "supporter|token"
```

Confirm the field name. The component below assumes `useAuth()` returns `{ user, token }` and `user.isSupporter` is a boolean. Adjust if reality differs.

- [ ] **Step 2: Write the component**

```jsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchUpdatesSince } from "@/lib/api/liveThread";

const POLL_INTERVAL_MS = 30_000;

/**
 * Client-only: when the user is a supporter AND the thread is live, polls for
 * new updates and appends them into the existing timeline `<ol data-sortable>`.
 *
 * Free users render this component too, but it stays inert (no-op) so we don't
 * need conditional rendering up the tree.
 */
export function LiveUpdatePoller({ postId, initialLastSeen }) {
  const { user, token } = useAuth();
  const [enabled, setEnabled] = useState(true);
  const lastSeen = useRef(initialLastSeen || 0);
  const intervalRef = useRef(null);

  const isSupporter = !!user?.isSupporter;

  useEffect(() => {
    if (!isSupporter || !enabled) return undefined;

    const tick = async () => {
      try {
        const data = await fetchUpdatesSince(postId, lastSeen.current, token);
        if (data.thread_state === "closed") {
          // Thread closed — stop polling.
          setEnabled(false);
          return;
        }
        if (Array.isArray(data.updates) && data.updates.length > 0) {
          appendUpdatesToDom(data.updates);
          lastSeen.current = data.updates[data.updates.length - 1].time;
        }
      } catch (err) {
        // Swallow — next tick will try again.
        console.warn("[LiveUpdatePoller]", err.message);
      }
    };

    intervalRef.current = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [postId, token, isSupporter, enabled]);

  return (
    <div className="mt-3 flex items-center justify-end gap-2 text-xs">
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <span className="text-gray-500 dark:text-gray-400">
          {isSupporter ? "Auto-updates" : "Auto-updates ⭐ premium"}
        </span>
        <input
          type="checkbox"
          checked={isSupporter && enabled}
          disabled={!isSupporter}
          onChange={(e) => setEnabled(e.target.checked)}
          className="accent-red-500"
        />
      </label>
      {!isSupporter && (
        <a href="/become-supporter" className="text-primary-500 dark:text-primary-300 underline">
          Upgrade
        </a>
      )}
    </div>
  );
}

function appendUpdatesToDom(updates) {
  const list = document.querySelector("ol[data-sortable]");
  if (!list) return;
  for (const u of updates) {
    if (list.querySelector(`li[data-update-id="${u.id}"]`)) continue; // dedupe
    const node = renderUpdateLi(u);
    list.appendChild(node);
  }
  // Trigger a custom event for any onlookers (e.g. jump-to-latest pill)
  list.dispatchEvent(new CustomEvent("bbjd:live-update-appended", { bubbles: true }));
}

function renderUpdateLi(u) {
  const li = document.createElement("li");
  li.dataset.ts = String(u.time);
  li.dataset.updateId = String(u.id);
  li.className = "relative pb-5 list-none";
  li.innerHTML = `
    <span class="absolute -left-[22px] top-1 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 bg-red-500 ring-2 ring-red-500/40 animate-pulse"></span>
    <div class="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-2">
      ${u.breaking ? '<span class="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">Breaking</span>' : ""}
      <time datetime="${u.time_iso || ""}">${formatTime(u.time)}</time>
    </div>
    ${u.title ? `<div class="font-bold text-primary-500 dark:text-primary-300 mb-1">${escapeHtml(u.title)}</div>` : ""}
    ${u.content ? `<div class="text-sm prose prose-sm dark:prose-invert max-w-none bg-red-50 dark:bg-red-950/30 border-l-2 border-red-500 pl-3 py-1 rounded-r">${u.content}</div>` : ""}
  `;
  return li;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function formatTime(unixSeconds) {
  if (!unixSeconds) return "";
  const dt = new Date(unixSeconds * 1000);
  return dt.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Los_Angeles",
    timeZoneName: "short",
  });
}
```

- [ ] **Step 3: Commit**

```powershell
cd C:\xampp\htdocs\bbj-app
git add src/components/posts/LiveUpdatePoller.jsx
git commit -m "feat(live-thread): premium polling client component"
```

---

### Task 16: JumpToLatestPill (floating, scroll-aware)

**Files:**
- Create: `C:\xampp\htdocs\bbj-app\src\components\posts\JumpToLatestPill.jsx`

- [ ] **Step 1: Write the component**

```jsx
"use client";

import { useEffect, useState } from "react";

/**
 * Client-only floating pill: visible only when the newest timeline item is
 * below the viewport. Clicking scrolls to it.
 */
export function JumpToLatestPill() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function check() {
      const list = document.querySelector("ol[data-sortable]");
      if (!list) {
        setVisible(false);
        return;
      }
      const items = list.querySelectorAll("li");
      if (items.length === 0) {
        setVisible(false);
        return;
      }
      const newest = items[items.length - 1];
      const rect = newest.getBoundingClientRect();
      const offscreen = rect.top > window.innerHeight - 80;
      setVisible(offscreen);
    }
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    document.addEventListener("bbjd:live-update-appended", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
      document.removeEventListener("bbjd:live-update-appended", check);
    };
  }, []);

  function scrollToLatest() {
    const list = document.querySelector("ol[data-sortable]");
    if (!list) return;
    const items = list.querySelectorAll("li");
    if (items.length === 0) return;
    items[items.length - 1].scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={scrollToLatest}
      className="fixed bottom-20 right-6 z-40 bg-red-500 hover:bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg shadow-red-500/30 inline-flex items-center gap-1.5"
    >
      ↓ Latest update
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```powershell
cd C:\xampp\htdocs\bbj-app
git add src/components/posts/JumpToLatestPill.jsx
git commit -m "feat(live-thread): floating jump-to-latest pill"
```

---

### Task 17: Wire LiveUpdateTimeline into the post page

**Files:**
- Modify: `C:\xampp\htdocs\bbj-app\src\app\[slug]\page.jsx`

- [ ] **Step 1: Replace the old FeedUpdates render block**

Find the existing block in `src/app/[slug]/page.jsx` that conditionally renders `<FeedUpdates />`:

```jsx
{/* Feed Updates - only for posts with live feed thread */}
{feedUpdatesData && (
  <FeedUpdates
    updates={feedUpdatesData.updates}
    dateFormatted={feedUpdatesData.date_formatted}
    total={feedUpdatesData.total}
  />
)}
```

Replace with:

```jsx
{/* Live Update Timeline — only for posts flagged as live threads */}
{content.liveUpdates && (
  <LiveUpdateTimeline
    postId={content.id}
    liveState={content.liveState}
    closedAt={content.closedAt}
    closingSummary={content.closingSummary}
  />
)}
```

Add the import at the top:

```jsx
import { LiveUpdateTimeline } from "@/components/posts/LiveUpdateTimeline";
```

Remove the now-unused `FeedUpdates` import and the `getFeedUpdatesByDate` call (and the `feedUpdatesData` variable):

```jsx
// REMOVE these:
// import { FeedUpdates } from "@/components/posts/FeedUpdates";
// import { getFeedUpdatesByDate } from "@/lib/api/feedUpdates";
//
// And inside the component body, remove:
// let feedUpdatesData = null;
// if (content.liveFeedThread) {
//   feedUpdatesData = await getFeedUpdatesByDate(content.date);
// }
```

- [ ] **Step 2: Verify the build**

```powershell
cd C:\xampp\htdocs\bbj-app
npm run build
```

Expected: build passes. Any post pages that aren't live threads should render normally. If `feedUpdatesData` or `FeedUpdates` is referenced elsewhere, fix those imports.

- [ ] **Step 3: Smoke test in browser**

Visit any existing post page at `http://localhost:3000/some-post-slug`. Expected: page renders normally without the live update section (since `content.liveUpdates` is false for that post).

- [ ] **Step 4: Commit**

```powershell
cd C:\xampp\htdocs\bbj-app
git add src/app/[slug]/page.jsx
git commit -m "feat(live-thread): mount LiveUpdateTimeline on post page (replaces FeedUpdates)"
```

---

## Phase F — Editor sidebar control

### Task 18: Add Live Updates block to EditorSidebar.jsx

**Files:**
- Modify: `C:\xampp\htdocs\bbj-app\src\components\editor\EditorSidebar.jsx`

- [ ] **Step 1: Inspect the current sidebar structure**

```powershell
Get-Content C:\xampp\htdocs\bbj-app\src\components\editor\EditorSidebar.jsx
```

Identify: (a) the props the sidebar receives, (b) where Post Type / Featured Image blocks live (we insert between them), (c) how form state is propagated upward to the publish handler.

- [ ] **Step 2: Build the LiveUpdatesBlock subcomponent**

At the top of `EditorSidebar.jsx` (or a sibling file `LiveUpdatesBlock.jsx` if the sidebar file is already large), add:

```jsx
import { useEffect, useState } from "react";

function LiveUpdatesBlock({
  liveUpdates,
  liveStart,
  liveEnd,
  onChange, // ({ liveUpdates, liveStart, liveEnd }) => void
}) {
  const [activeThread, setActiveThread] = useState(null); // { post_id, title, slug } | null
  const [conflictAcknowledged, setConflictAcknowledged] = useState(false);

  // Fetch current active thread when checkbox is first enabled
  useEffect(() => {
    if (!liveUpdates) {
      setActiveThread(null);
      setConflictAcknowledged(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "";
        const res = await fetch(`${apiUrl}/bbjd/v1/live-thread/current`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setActiveThread(data);
      } catch { /* ignore */ }
    })();
    return () => { cancelled = true; };
  }, [liveUpdates]);

  function handleToggle(e) {
    const next = e.target.checked;
    if (!next) {
      onChange({ liveUpdates: false, liveStart: 0, liveEnd: 0 });
      setConflictAcknowledged(false);
      return;
    }
    onChange({ liveUpdates: true, liveStart: 0, liveEnd: 0 });
  }

  function setStartOfDay() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    onChange({ liveUpdates, liveStart: Math.floor(today.getTime() / 1000), liveEnd });
  }

  function setEndChoice(value) {
    if (value === "continuous") {
      onChange({ liveUpdates, liveStart, liveEnd: 0 });
    } else if (value === "end_of_day") {
      const today = new Date();
      today.setHours(23, 59, 59, 0);
      onChange({ liveUpdates, liveStart, liveEnd: Math.floor(today.getTime() / 1000) });
    }
  }

  const isActive = liveUpdates;
  const hasUnresolvedConflict =
    isActive && activeThread && activeThread.post_id && !conflictAcknowledged;

  return (
    <div className={`mb-4 rounded-lg p-3 ${isActive ? "border-2 border-secondary-500 bg-white" : "border border-gray-200 bg-white"}`}>
      <label className="flex items-center gap-2 cursor-pointer mb-2">
        <input
          type="checkbox"
          checked={!!liveUpdates}
          onChange={handleToggle}
          className="w-4 h-4 accent-primary-500"
        />
        <span className="font-bold text-primary-500">Live Updates</span>
        {isActive && (
          <span className="ml-auto inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            ● LIVE
          </span>
        )}
      </label>

      {isActive && (
        <>
          {hasUnresolvedConflict && (
            <ConflictPrompt
              activeThread={activeThread}
              onConfirm={() => {
                // User acknowledges they want to displace the active thread.
                // The actual /take-over call happens at publish (Step 4) so we
                // never have a moment where two threads are partially active.
                setConflictAcknowledged(true);
              }}
              onCancel={() => onChange({ liveUpdates: false, liveStart: 0, liveEnd: 0 })}
            />
          )}
          <div className="mb-2">
            <div className="text-[11px] font-bold text-gray-500 mb-1">START</div>
            <div className="flex gap-1.5 items-stretch">
              <input
                value={liveStart > 0 ? new Date(liveStart * 1000).toLocaleString() : "On publish (default)"}
                readOnly
                className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1.5"
              />
              <button type="button" onClick={setStartOfDay} className="text-xs border border-gray-200 bg-white rounded px-2" title="Start at midnight today">🕛 Day</button>
            </div>
          </div>
          <div className="mb-2">
            <div className="text-[11px] font-bold text-gray-500 mb-1">END</div>
            <select
              value={liveEnd === 0 ? "continuous" : "end_of_day"}
              onChange={(e) => setEndChoice(e.target.value)}
              className="w-full text-xs bg-white border border-gray-200 rounded px-2 py-1.5"
            >
              <option value="end_of_day">End of day (11:59pm)</option>
              <option value="continuous">Continuous (until displaced)</option>
            </select>
          </div>
          <div className="text-[11px] bg-yellow-50 border-l-2 border-secondary-500 text-yellow-900 p-2 rounded">
            Feed updates posted in this window stream into the post chronologically.
          </div>
        </>
      )}
    </div>
  );
}

function ConflictPrompt({ activeThread, onConfirm, onCancel }) {
  return (
    <div className="mb-3 p-3 rounded border-2 border-red-500 bg-red-50 text-sm">
      <div className="font-bold text-red-700 mb-1">A live thread is already active:</div>
      <div className="font-bold text-gray-800 mb-2">{activeThread.title}</div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs px-2 py-1 border border-gray-300 bg-white rounded"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="text-xs px-2 py-1 bg-red-500 text-white rounded font-bold"
        >
          Close it &amp; start this one
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire `<LiveUpdatesBlock />` into the EditorSidebar JSX**

Inside the existing sidebar render, between the Post Type and Featured Image blocks, add:

```jsx
<LiveUpdatesBlock
  liveUpdates={formData.liveUpdates || false}
  liveStart={formData.liveStart || 0}
  liveEnd={formData.liveEnd || 0}
  onChange={({ liveUpdates, liveStart, liveEnd }) => {
    onFormChange({ ...formData, liveUpdates, liveStart, liveEnd });
  }}
/>
```

Adjust prop names (`formData`, `onFormChange`) to match the actual sidebar's parent state machinery. If the sidebar uses individual props per field, pass them through analogously.

- [ ] **Step 4: Wire the editor's save/publish handler to send the new fields**

Inspect `src/components/editor/EditorPage.jsx` (or wherever publish/save happens). Find the function that builds the request body and POSTs it to the WP plugin (probably hits `/bbjd/v1/editor/posts` or `/wp/v2/posts`).

**Add `live_updates`, `live_start`, `live_end` to the request payload.** Most likely the existing flow sets meta either via `meta: { ... }` on the WP REST envelope OR via dedicated fields the editor backend understands. Match whichever the existing flow uses for OTHER post fields. Concretely:

```javascript
// In the publish handler, before the fetch:
const payload = {
  ...existingPayload,
  liveUpdates: !!formData.liveUpdates,
  liveStart:   formData.liveStart || 0,
  liveEnd:     formData.liveEnd || 0,
};
```

Then in the WP plugin, `EditorRoutes.php`'s save handler must read those three fields off the request and write them to the post meta keys `_bbjd_live_updates`, `_bbjd_live_start`, `_bbjd_live_end`. Locate the save handler:

```powershell
Select-String -Path "C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\EditorRoutes.php" -Pattern "update_post_meta|wp_insert_post|wp_update_post"
```

Add the three meta writes alongside the existing ones.

**After save, call `/take-over` if the post is to be live.** This is the single source of truth for opening — it handles both "no conflict" and "displace existing" atomically:

```javascript
// AFTER the post save succeeds and you have the new/updated post ID:
if (formData.liveUpdates) {
  await fetch(`${apiUrl}/bbjd/v1/live-thread/take-over`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ new_post_id: savedPostId }),
  });
}
```

Note: this should fire whether or not the conflict prompt was shown — the `/take-over` endpoint is idempotent and handles both cases (`previousId === 0` → just open; `previousId !== 0` → close-then-open).

- [ ] **Step 5: End-to-end editor flow test**

1. Open `http://localhost:3000/editor/new`
2. Fill in a title + content
3. Check "Live Updates" — confirm no conflict prompt (no active thread yet)
4. Choose "End of day (11:59pm)" for end
5. Click Publish
6. Open `http://bbj.localhost/wp-admin/edit.php?post_type=post` — confirm the new post exists with `_bbjd_live_updates = 1`
7. Curl `http://bbj.localhost/wp-json/bbjd/v1/live-thread/current` — expected: returns the new post's stub
8. Visit the new post page at `http://localhost:3000/{slug}` — expected: top strip shows "LIVE: [title]", homepage shows banner, post page has Live Update Timeline section (empty)

- [ ] **Step 6: Commit**

```powershell
cd C:\xampp\htdocs\bbj-app
git add src/components/editor/EditorSidebar.jsx src/components/editor/EditorPage.jsx
git commit -m "feat(live-thread): editor sidebar Live Updates control + conflict modal"
```

---

## Phase G — Verification & cleanup

### Task 19: End-to-end manual verification checklist

This task is a checklist, not new code. Run through each scenario; fix any breakage as a follow-up commit.

- [ ] **Scenario 1: Empty state (no active thread)**
  - Homepage loads, no LIVE banner above hero
  - Top strip reads "Watch Feeds | LIVE" (existing pill)
  - Any existing post page renders without timeline section

- [ ] **Scenario 2: Publish a live thread, verify chrome**
  - Editor: check "Live Updates", set end = end_of_day, publish
  - Top strip across the site now shows "LIVE: [Title] →"
  - Homepage banner appears above hero, links to the new post
  - Post page shows the section header with LIVE chip and "0 updates"

- [ ] **Scenario 3: Add feed updates, verify they stream in**
  - Use the existing feed-update creation flow (admin or `/feed-updates/create` endpoint)
  - Each new update appears in the timeline after page refresh (free user)
  - As a supporter, new updates appear within 30s without refresh

- [ ] **Scenario 4: Take-over flow**
  - Open the editor for a SECOND post
  - Check "Live Updates" — conflict prompt should appear listing the first thread
  - Confirm "Close it & start this one"
  - First thread's post page now shows "Thread closed at [time]" banner
  - Second thread is now active in top strip + homepage banner

- [ ] **Scenario 5: End-of-day auto-close**
  - Manually edit `_bbjd_live_end` on the active thread to a past timestamp:
    ```sql
    UPDATE wp_postmeta SET meta_value = UNIX_TIMESTAMP() - 60
    WHERE post_id = ACTIVE_POST_ID AND meta_key = '_bbjd_live_end';
    ```
  - Run cron manually: visit any WP admin page (triggers cron) OR run `wp cron event run bbjd_live_thread_autoclose` if WP-CLI is available
  - Top strip falls back to Watch Feeds
  - Post page enters closed state on next reload

- [ ] **Scenario 6: Caching invariants check**
  - In a fresh incognito window, hit the homepage 5 times in a row
  - Open browser devtools → Network → look at the homepage HTML response
  - Expected: `x-vercel-cache` or `cf-cache-status` is HIT after the first load
  - If MISS on every load, something has broken ISR — likely a `cookies()`/`headers()` call leaked into a shared route segment. Audit `Header.jsx` and `layout.jsx`.

- [ ] **Scenario 7: `npm run build` clean**
  ```powershell
  cd C:\xampp\htdocs\bbj-app
  npm run lint
  npm run build
  ```
  Expected: both succeed. No ESLint errors, no build failures.

- [ ] **Scenario 8: Post pages without live thread still work**
  - Visit 3 random existing post slugs — they render normally, no timeline section, no errors

---

### Task 20: Remove deprecated FeedUpdates.jsx & final commit

**Files:**
- Delete: `C:\xampp\htdocs\bbj-app\src\components\posts\FeedUpdates.jsx`
- Possibly delete: `C:\xampp\htdocs\bbj-app\src\lib\api\feedUpdates.js`'s `getFeedUpdatesByDate` export (only if no other consumers)

- [ ] **Step 1: Confirm no remaining consumers of FeedUpdates**

```powershell
Select-String -Path "C:\xampp\htdocs\bbj-app\src\**\*.jsx","C:\xampp\htdocs\bbj-app\src\**\*.js" -Pattern "FeedUpdates|getFeedUpdatesByDate"
```

Expected: ZERO matches (if Task 17 was done correctly). If `getFeedUpdatesByDate` is still referenced somewhere, leave it; only remove what's unused.

- [ ] **Step 2: Delete the file**

```powershell
Remove-Item C:\xampp\htdocs\bbj-app\src\components\posts\FeedUpdates.jsx
```

- [ ] **Step 3: If `getFeedUpdatesByDate` has no remaining consumers, remove it from feedUpdates.js**

```powershell
Get-Content C:\xampp\htdocs\bbj-app\src\lib\api\feedUpdates.js | Select-String -Pattern "getFeedUpdatesByDate" -Context 0,15
```

Edit `feedUpdates.js` to remove the unused export. Leave any still-used exports alone.

- [ ] **Step 4: Final lint + build pass**

```powershell
cd C:\xampp\htdocs\bbj-app
npm run lint
npm run build
```

Expected: both succeed cleanly.

- [ ] **Step 5: Commit**

```powershell
cd C:\xampp\htdocs\bbj-app
git add -A
git commit -m "chore(live-thread): remove deprecated FeedUpdates component"
```

- [ ] **Step 6: Ship to staging**

When the user gives the explicit go-ahead, run `/full-push` to deploy both the Next.js app AND the WordPress plugin to staging. **Do not push to production** without an explicit "push live" directive (see [[feedback_no_unauthorized_pushes]]).

---

## Post-implementation: roadmap follow-ups (not part of this plan)

- AI-generated closing recap (writes to `_bbjd_closing_summary`)
- Editor UI for setting `_bbjd_breaking` per feed-update
- Push notifications on thread open and BREAKING updates
- Per-segment grouping on `/live-feed-updates` hub
