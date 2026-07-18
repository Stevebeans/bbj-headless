<?php
/**
 * LOCAL-ONLY end-to-end verify for the FB Quickie content pipeline (Tasks
 * 1-10): engagement columns on bbj_social_posts, SocialStore::topPosts
 * scoring/ranking, PromptContext CBS caution-window math + filter wiring,
 * and QueueBridge (source enum widening, slot arithmetic, feed-update
 * share queueing + de-dupe). Cleans up every row it seeds.
 *
 * Usage: php scripts/fb-quickie-verify.php [--wp=C:/xampp/htdocs/bbj/wp-load.php]
 */
$opts = [];
foreach (array_slice($argv, 1) as $a) {
    if (preg_match('/^--([^=]+)=(.*)$/', $a, $m)) $opts[$m[1]] = $m[2];
}
require_once $opts['wp'] ?? 'C:/xampp/htdocs/bbj/wp-load.php';

use BigBrotherJunkies\Data\Social\PromptContext;
use BigBrotherJunkies\Data\Social\QueueBridge;
use BigBrotherJunkies\Data\Social\SocialStore;

$pass = 0;
$fail = 0;
function check(string $label, bool $ok): void
{
    global $pass, $fail;
    echo ($ok ? '  ✓ ' : '  ✗ ') . $label . PHP_EOL;
    $ok ? $pass++ : $fail++;
}

echo "FB quickie pipeline verify\n";

// 1. Schema: engagement columns exist.
global $wpdb;
$cols = $wpdb->get_col("SHOW COLUMNS FROM {$wpdb->prefix}bbj_social_posts");
foreach (['likes', 'reposts', 'replies', 'quotes'] as $col) {
    check("bbj_social_posts.{$col} column", in_array($col, $cols, true));
}

// 2. Seed two rows with counts, confirm topPosts ranking (2*reposts beats likes).
$t = $wpdb->prefix . 'bbj_social_posts';
$now = current_time('mysql', true);
$wpdb->query($wpdb->prepare(
    "INSERT INTO {$t} (source, uri, cid, handle, display_name, text, posted_at, fetched_at, summarized, likes, reposts, replies, quotes)
     VALUES ('trusted', %s, '', 'verify-a.test', 'Verify A', 'verify post A', %s, %s, 1, 40, 10, 0, 0),
            ('trusted', %s, '', 'verify-b.test', 'Verify B', 'verify post B', %s, %s, 1, 5, 30, 0, 0)
     ON DUPLICATE KEY UPDATE likes = VALUES(likes), reposts = VALUES(reposts)",
    'at://verify/a', $now, $now, 'at://verify/b', $now, $now
));
$top = SocialStore::topPosts(24, 50);
$handles = array_column($top, 'handle');
$posA = array_search('verify-a.test', $handles, true);
$posB = array_search('verify-b.test', $handles, true);
check('topPosts returns both seeded rows', $posA !== false && $posB !== false);
check('score = likes + 2*reposts ranks B (65) over A (60)', $posB !== false && $posA !== false && $posB < $posA);

// 3. PromptContext window math (pure).
$slots = [['day' => 4, 'time_et' => '20:00', 'duration_min' => 60]];
$utc = new DateTimeZone('UTC');
check('inCautionWindow: Thu 8:30 PM ET true', PromptContext::inCautionWindow($slots, new DateTimeImmutable('2026-07-17 00:30:00', $utc)));
check('inCautionWindow: Thu 2 PM ET false', !PromptContext::inCautionWindow($slots, new DateTimeImmutable('2026-07-16 18:00:00', $utc)));

// 4. Filter wiring: with a slot saved + a frozen in-window "now" we can't fake
//    real time, so assert the callback is attached instead.
check('appendNotice attached to bbjd_fb_batch_prompt', has_filter('bbjd_fb_batch_prompt', [PromptContext::class, 'appendNotice']) !== false);
check('appendNotice attached to bbjd_bean_bot_feed_prompt', has_filter('bbjd_bean_bot_feed_prompt', [PromptContext::class, 'appendNotice']) !== false);

// 5. Queue bridge: enum + slot + feed shares.
QueueBridge::ensureSourceEnum();
$enumRow = $wpdb->get_row("SHOW COLUMNS FROM {$wpdb->prefix}bbj_content_queue LIKE 'source'", ARRAY_A);
check('content_queue source enum widened', strpos((string) ($enumRow['Type'] ?? ''), 'social_quickie') !== false
    && strpos((string) ($enumRow['Type'] ?? ''), 'feed_update_share') !== false);
$slot = QueueBridge::nextFreeSlot();
check('nextFreeSlot returns datetime', (bool) preg_match('/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/', $slot));

$updates = QueueBridge::recentFeedUpdates(5);
check('recentFeedUpdates returns rows with url+shared keys', $updates === [] || (isset($updates[0]['url'], $updates[0]['shared'])));

if (!empty($updates)) {
    $queued = QueueBridge::enqueueFeedShares([$updates[0]['id']], 'verify-page', 'Verify Page');
    check('enqueueFeedShares queues 1 row', count($queued) === 1);
    $again = QueueBridge::enqueueFeedShares([$updates[0]['id']], 'verify-page', 'Verify Page');
    check('re-queue of same update skipped', count($again) === 0);
    // Cleanup so the row never actually fires.
    $wpdb->query("DELETE FROM {$wpdb->prefix}bbj_content_queue WHERE target_page = 'verify-page'");
}

// Cleanup seeds.
$wpdb->query("DELETE FROM {$t} WHERE handle IN ('verify-a.test','verify-b.test')");

echo PHP_EOL . "{$pass} passed, {$fail} failed" . PHP_EOL;
exit($fail > 0 ? 1 : 0);
