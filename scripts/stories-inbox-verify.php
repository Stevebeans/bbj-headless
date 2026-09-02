<?php
/**
 * LOCAL-ONLY end-to-end check for Stories Batch A: option round-trip,
 * fixture ingest via the adapters' parse(), inbox query, quickie handoff
 * credit guard, content-queue row. Restores bbjd_stories when done.
 *
 * Usage: php scripts/stories-inbox-verify.php [--wp=C:/xampp/htdocs/bbj/wp-load.php]
 */
$opts = [];
foreach (array_slice($argv, 1) as $a) {
    if (preg_match('/^--([^=]+)=(.*)$/', $a, $m)) $opts[$m[1]] = $m[2];
}
require_once $opts['wp'] ?? 'C:/xampp/htdocs/bbj/wp-load.php';

use BigBrotherJunkies\Data\Stories\ItemStore;
use BigBrotherJunkies\Data\Stories\QuickieHandoff;
use BigBrotherJunkies\Data\Stories\Schema;
use BigBrotherJunkies\Data\Stories\Settings;
use BigBrotherJunkies\Data\Stories\Sources\RedditAdapter;
use BigBrotherJunkies\Data\Stories\Sources\RssAdapter;

function check(bool $ok, string $label): void
{
    echo ($ok ? "PASS" : "FAIL") . "  {$label}\n";
    if (!$ok) $GLOBALS['failed'] = true;
}

$fixtures = 'C:/xampp/htdocs/bbj/wp-content/plugins/bigbrotherjunkies-data/tests/fixtures/stories/';
$backup   = get_option(Settings::OPTION, null);
wp_set_current_user(1);

try {
    Schema::maybeMigrate();
    global $wpdb;
    check((bool) $wpdb->get_var("SHOW TABLES LIKE '" . Schema::table(Schema::TABLE_ITEMS) . "'"), 'items table exists');

    $s = Settings::saveSettings(['shows' => ['big-brother' => ['label' => 'Big Brother', 'enabled' => true]],
        'sources' => [['show' => 'big-brother', 'type' => 'reddit', 'key' => 'BigBrother', 'trust' => 'standard']]]);
    check($s['shows']['big-brother']['enabled'] === true, 'show saved + enabled');
    check(count(Settings::sourcesFor('big-brother')) === 1, 'source saved');

    $src   = ['show' => 'big-brother', 'type' => 'rss', 'key' => 'https://example.com/feed', 'trust' => 'standard'];
    $items = RssAdapter::parse(file_get_contents($fixtures . 'rss2.xml'), $src);
    $items = array_merge($items, RedditAdapter::parse(json_decode(file_get_contents($fixtures . 'reddit-new.json'), true),
        ['show' => 'big-brother', 'type' => 'reddit', 'key' => 'BigBrother', 'trust' => 'standard', 'flair' => '']));
    $wpdb->query("DELETE FROM " . Schema::table(Schema::TABLE_ITEMS) . " WHERE url LIKE 'https://example.com/%' OR url LIKE 'https://www.reddit.com/r/BigBrother/comments/a%'");
    $added = ItemStore::insertItems($items);
    check($added === 4, "inserted 4 fixture items (got {$added})");
    check(ItemStore::insertItems($items) === 0, 're-insert dedupes to 0');

    $inbox = ItemStore::inbox(['show' => 'big-brother', 'status' => 'new', 'sort' => 'score', 'days' => 14]);
    check($inbox['total'] >= 4, 'inbox lists items');
    $top = $inbox['items'][0];
    check($top['score'] === 412, 'sorted by score (reddit 412 first)');

    $rssItem = null;
    foreach ($inbox['items'] as $it) if ($it['source'] === 'rss') $rssItem = $it;
    check($rssItem !== null, 'rss item present');

    $pre = QuickieHandoff::prefill((int) $rssItem['id']);
    check(str_contains($pre['caption'], 'via Staff Writer'), 'prefill caption carries credit');

    $bad = QuickieHandoff::enqueue((int) $rssItem['id'], ['page_id' => '123', 'caption' => 'no credit here']);
    check($bad['success'] === false && str_contains($bad['message'], 'credit'), 'enqueue refused without credit');

    $good = QuickieHandoff::enqueue((int) $top['id'], ['page_id' => '123', 'page_name' => 'Test', 'caption' => $pre['caption'] . "\nvia u/feedwatcher"]);
    check($good['success'] === true, 'enqueue succeeds with credit (' . ($good['message'] ?? 'ok') . ')');
    $row = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}bbj_content_queue WHERE id = %d", (int) ($good['queue_id'] ?? 0)), ARRAY_A);
    check($row && $row['source'] === 'stories_inbox' && $row['status'] === 'scheduled', 'content queue row is stories_inbox/scheduled');
    check(ItemStore::get((int) $top['id'])['inbox_status'] === 'used', 'item marked used');

    // cleanup queue row + fixture items
    if ($row) $wpdb->delete("{$wpdb->prefix}bbj_content_queue", ['id' => (int) $row['id']]);
    $wpdb->query("DELETE FROM " . Schema::table(Schema::TABLE_ITEMS) . " WHERE url LIKE 'https://example.com/%' OR url LIKE 'https://www.reddit.com/r/BigBrother/comments/a%'");
} finally {
    if ($backup === null) delete_option(Settings::OPTION); else update_option(Settings::OPTION, $backup);
    \BigBrotherJunkies\Data\Stories\Scheduler::reschedule();
}
exit(empty($GLOBALS['failed']) ? 0 : 1);
