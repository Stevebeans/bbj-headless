<?php
/**
 * LOCAL-ONLY verification for brand-safety scanner.
 *
 * Tests the blocklist loader and Scanner class for proper term matching,
 * word boundaries, phrase handling, HTML safety, and tier-based actions.
 *
 * Usage: php scripts/brand-safety-verify.php [--wp=C:/xampp/htdocs/bbj/wp-load.php]
 */
$opts = [];
foreach (array_slice($argv, 1) as $a) {
    if (preg_match('/^--([^=]+)=(.*)$/', $a, $m)) $opts[$m[1]] = $m[2];
}
require_once $opts['wp'] ?? 'C:/xampp/htdocs/bbj/wp-load.php';

use BigBrotherJunkies\Data\BrandSafety\Scanner;
use BigBrotherJunkies\Data\BrandSafety\Blocklist;
use BigBrotherJunkies\Data\BrandSafety\Log;

function check(bool $ok, string $label): void
{
    echo ($ok ? "PASS" : "FAIL") . "  {$label}\n";
    if (!$ok) throw new RuntimeException("check failed: {$label}");
}

// --- Tier config ---
$tiers = Blocklist::getTiers();
check(count($tiers) === 465, 'blocklist has 465 terms');
check(($tiers['bitch'] ?? '') === 'censor', 'bitch is censor tier');
check(($tiers['bet'] ?? '') === 'watch', 'bet is watch tier by default');

// --- Masking ---
$r = Scanner::censor('What a bitch move');
check($r['html'] === 'What a b***h move', 'first-letter mask');
check($r['hits'][0]['term'] === 'bitch' && $r['hits'][0]['action'] === 'censored', 'hit recorded');

// --- Word boundaries: no substring hits ---
foreach (['a class act', 'bass fishing', 'I assume so', 'Cassandra won'] as $safe) {
    $r = Scanner::censor($safe);
    check($r['html'] === $safe && !$r['hits'], "no substring hit: {$safe}");
}

// --- Case-insensitive, mask preserves length ---
$r = Scanner::censor('BITCH');
check($r['html'] === 'B***H' || $r['html'] === 'B****', 'case-insensitive match');

// --- Phrases ---
$r = Scanner::censor('they played fuck, marry, kill last night');
check(strpos($r['html'], 'fuck, marry, kill') === false, 'phrase masked');
$r = Scanner::censor('a ball  gag prop'); // double space still matches
check(!empty($r['hits']), 'phrase matches across normalized whitespace');

// --- Watch tier: logged, not masked ---
$r = Scanner::censor('I bet she wins HoH');
check($r['html'] === 'I bet she wins HoH', 'watch term not masked');
check($r['hits'][0]['action'] === 'watched', 'watch term recorded as watched');

// --- HTML safety: text nodes only ---
$r = Scanner::censor('<a href="https://example.com/bitch-page">so shady</a>');
check(strpos($r['html'], 'bitch-page') !== false, 'attribute URL untouched');
check($r['unmaskable'] === true, 'attribute hit reported unmaskable');
$r = Scanner::censor('<p>total bullshit</p>');
check($r['html'] === '<p>total b******t</p>', 'text inside tags masked');

// --- off tier ---
update_option('bbjd_brand_safety', ['tier_overrides' => ['bitch' => 'off']]);
Blocklist::flushCache();
$r = Scanner::censor('What a bitch move');
check($r['html'] === 'What a bitch move' && !$r['hits'], 'off tier fully ignored');
delete_option('bbjd_brand_safety');
Blocklist::flushCache();

echo "ALL MATCHER CHECKS PASS\n";

// --- Log table ---
Log::ensureTable();
global $wpdb;
$table = $wpdb->prefix . 'bbj_brand_safety_log';
check($wpdb->get_var("SHOW TABLES LIKE '{$table}'") === $table, 'log table exists');

Log::record('comment', 123, [['term' => 'bitch', 'tier' => 'censor', 'action' => 'censored']]);
$row = $wpdb->get_row("SELECT * FROM {$table} ORDER BY id DESC LIMIT 1");
check($row->object_type === 'comment' && (int) $row->object_id === 123 && $row->term === 'bitch' && $row->action === 'censored', 'log row recorded');

$recent = Log::recent(1, 10);
check($recent['total'] >= 1 && $recent['rows'][0]['term'] === 'bitch', 'recent() pages rows');
$wpdb->delete($table, ['object_id' => 123]);

echo "ALL CHECKS PASS (matcher + log table)\n";

// --- Comment save integration (REST dispatch, real wp_comments table) ---
wp_set_current_user(1);
$commentRoutes = new BigBrotherJunkies\Data\Api\CommentRoutes();
$testPostId = wp_insert_post([
    'post_title' => 'bs-verify',
    'post_status' => 'publish',
    'comment_status' => 'open',
]);

try {
    // censor-tier word gets masked
    $req = new WP_REST_Request('POST', '/bbjd/v1/comments');
    $req->set_body_params(['post_id' => $testPostId, 'content' => 'that was total bullshit', 'parent_id' => 0]);
    $res = $commentRoutes->postComment($req);
    $data = $res->get_data();
    check($res->get_status() === 201, 'censored comment accepted');
    check($data['comment']['content'] === 'that was total b******t', 'response content censored');
    $stored = get_comment($data['comment']['id']);
    check(strpos($stored->comment_content, 'bullshit') === false, 'stored content censored');
    wp_delete_comment($data['comment']['id'], true);

    // watch-tier word untouched
    $req = new WP_REST_Request('POST', '/bbjd/v1/comments');
    $req->set_body_params(['post_id' => $testPostId, 'content' => 'I bet she wins', 'parent_id' => 0]);
    $res = $commentRoutes->postComment($req);
    $data = $res->get_data();
    check($data['comment']['content'] === 'I bet she wins', 'watch term untouched in comment');
    wp_delete_comment($data['comment']['id'], true);

    // unmaskable (term in URL) -> rejected
    $req = new WP_REST_Request('POST', '/bbjd/v1/comments');
    $req->set_body_params(['post_id' => $testPostId, 'content' => '<a href="https://example.com/bitch">look</a>', 'parent_id' => 0]);
    $res = $commentRoutes->postComment($req);
    check($res->get_status() === 400 && $res->get_data()['code'] === 'content_blocked', 'unmaskable comment rejected');

    // editComment: censor-tier word masked on edit
    $req = new WP_REST_Request('POST', '/bbjd/v1/comments');
    $req->set_body_params(['post_id' => $testPostId, 'content' => 'a clean comment', 'parent_id' => 0]);
    $res = $commentRoutes->postComment($req);
    $editCommentId = $res->get_data()['comment']['id'];

    $req = new WP_REST_Request('PUT', "/bbjd/v1/comments/{$editCommentId}");
    $req->set_body_params(['comment_id' => $editCommentId, 'content' => 'edited: total bullshit']);
    $res = $commentRoutes->editComment($req);
    check($res->get_status() === 200, 'edit with censor-tier word accepted');
    check($res->get_data()['content'] === 'edited: total b******t', 'edit response content censored');
    $stored = get_comment($editCommentId);
    check(strpos($stored->comment_content, 'bullshit') === false, 'edited stored content censored');

    // editComment: unmaskable content rejected
    $req = new WP_REST_Request('PUT', "/bbjd/v1/comments/{$editCommentId}");
    $req->set_body_params(['comment_id' => $editCommentId, 'content' => '<a href="https://example.com/bitch">look</a>']);
    $res = $commentRoutes->editComment($req);
    check($res->get_status() === 400 && $res->get_data()['code'] === 'content_blocked', 'unmaskable edit rejected');

    wp_delete_comment($editCommentId, true);
} finally {
    wp_delete_post($testPostId, true);
}

echo "ALL CHECKS PASS (matcher + log table + comment integration)\n";

// --- Task 4: save_post hook, ads_unsafe flag, REST field, quote censoring ---
use BigBrotherJunkies\Data\BrandSafety\Hooks;

// save_post censors editorial text
$pid = wp_insert_post(['post_title' => 'Recap', 'post_content' => '<p>total bullshit tonight</p>', 'post_status' => 'publish', 'post_type' => 'post']);
$p = get_post($pid);
check(strpos($p->post_content, 'bullshit') === false, 'editorial censored on save');
check(get_post_meta($pid, Hooks::META_ORIGINAL, true) !== '', 'original preserved');
check(get_post_meta($pid, Hooks::META_UNSAFE, true) === '', 'maskable-only page not flagged');

// unmaskable hit -> flag; clean re-save -> flag clears
wp_update_post(['ID' => $pid, 'post_content' => '<a href="https://example.com/bitch">x</a>']);
check(get_post_meta($pid, Hooks::META_UNSAFE, true) === '1', 'unmaskable page flagged');
wp_update_post(['ID' => $pid, 'post_content' => '<p>all clean now</p>']);
check(get_post_meta($pid, Hooks::META_UNSAFE, true) === '', 'flag clears on clean save');

// isAdsUnsafe() + override
update_post_meta($pid, Hooks::META_UNSAFE, '1');
check(Hooks::isAdsUnsafe($pid) === true, 'isAdsUnsafe true when flagged');
update_post_meta($pid, Hooks::META_OVERRIDE, '1');
check(Hooks::isAdsUnsafe($pid) === false, 'override wins');
wp_delete_post($pid, true);

// quotes are censored at insert (real QuoteStore::insert() field names: quote_text, said_on)
$qid = BigBrotherJunkies\Data\Social\QuoteStore::insert([
    'season_id'   => 0,
    'player_id'   => 0,
    'quote_text'  => 'that bullshit again',
    'context'     => '',
    'said_on'     => gmdate('Y-m-d'),
]);
check($qid > 0, 'quote inserted');
global $wpdb;
$qtable = BigBrotherJunkies\Data\Social\SocialSchema::table(BigBrotherJunkies\Data\Social\SocialSchema::TABLE_QUOTES);
$qrow = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$qtable} WHERE id = %d", $qid));
check($qrow !== null, 'quote row found by returned insert id');
check(strpos($qrow->quote_text, 'bullshit') === false, 'quote censored at insert');
BigBrotherJunkies\Data\Social\QuoteStore::delete($qid);

// --- Fix round 1: titles use a plain-text scan path (no HTML-tag semantics) ---
$r = Scanner::censorText("5 < 10 > that's bullshit");
check(strpos($r['html'], 'b******t') !== false, 'censorText masks censor-tier term');
check($r['unmaskable'] === false, 'censorText never reports unmaskable');

$pid2 = wp_insert_post([
    'post_title' => "5 < 10 > total bullshit",
    'post_content' => '<p>clean body</p>',
    'post_status' => 'publish',
    'post_type' => 'post',
]);
$p2 = get_post($pid2);
check(strpos($p2->post_title, 'bullshit') === false, 'title with literal <> censored in storage');
check(get_post_meta($pid2, Hooks::META_UNSAFE, true) === '', 'title with literal <> not flagged ads_unsafe');
wp_delete_post($pid2, true);

// Regression: plain title (no angle brackets) still censors as before.
$pid3 = wp_insert_post([
    'post_title' => 'total bullshit tonight',
    'post_content' => '<p>clean body</p>',
    'post_status' => 'publish',
    'post_type' => 'post',
]);
$p3 = get_post($pid3);
check(strpos($p3->post_title, 'bullshit') === false, 'plain title still censored (regression)');
wp_delete_post($pid3, true);

echo "ALL CHECKS PASS (matcher + log table + comment integration + editorial/quotes + title plain-text)\n";

// --- Task 5: comment media shutdown + quarantine ---
use BigBrotherJunkies\Data\Comments\MediaRoutes;
use BigBrotherJunkies\Data\Comments\MediaUploader;

// upload endpoint is 410
$req = new WP_REST_Request('POST', '/bbjd/v1/comments/media');
$res = (new MediaRoutes())->uploadMedia($req);
check($res->get_status() === 410 && $res->get_data()['code'] === 'uploads_disabled', 'upload endpoint gone');

// quarantined media invisible
global $wpdb;
$mtable = $wpdb->prefix . 'bbj_comment_media';
$tmp = tempnam(sys_get_temp_dir(), 'bsq');
file_put_contents($tmp, 'x');
$wpdb->insert($mtable, ['user_id' => 1, 'comment_id' => 999999, 'media_type' => 'image', 'file_name' => 'bsq.webp', 'file_path' => $tmp, 'file_url' => 'http://x/bsq.webp', 'file_size' => 1, 'mime_type' => 'image/webp', 'storage_type' => 'local']);
$mid = $wpdb->insert_id;
$r = MediaUploader::quarantineAllLocal();
check($r['moved'] >= 1 && !$r['errors'], 'quarantine moved files');
$row = $wpdb->get_row("SELECT * FROM {$mtable} WHERE id = {$mid}");
check($row->storage_type === 'quarantined', 'row marked quarantined');
check(file_exists(WP_CONTENT_DIR . '/bbj-quarantine/' . basename($row->file_path)), 'file in quarantine dir');
check(MediaUploader::getCommentMedia(999999) === null, 'quarantined media hidden from comments');
$wpdb->delete($mtable, ['id' => $mid]);

echo "ALL CHECKS PASS (matcher + log table + comment integration + editorial/quotes + title plain-text + media shutdown)\n";

// --- Task 6: Backfill + admin REST routes ---
use BigBrotherJunkies\Data\Api\BrandSafetyRoutes;
use BigBrotherJunkies\Data\BrandSafety\Backfill;
use BigBrotherJunkies\Data\Permissions\PermissionChecker;

$routes = new BrandSafetyRoutes();

/**
 * dry-run is now time-sliced (Fix round 1 follow-up): a single call may
 * return done:false on a large table. Poll the route until it finishes and
 * return the final (done:true) response, same shape callers used to get
 * from a single call.
 */
function bsFullDryRun(BrandSafetyRoutes $routes, string $target, int $maxLoops = 2000): array
{
    $loops = 0;
    do {
        $req = new WP_REST_Request('POST', '/bbjd/v1/brand-safety/dry-run');
        $req->set_param('target', $target);
        $sum = $routes->dryRun($req)->get_data();
        $loops++;
    } while (!($sum['done'] ?? true) && $loops < $maxLoops);
    return $sum;
}

// --- settings GET/PUT ---
$settings = $routes->getSettings()->get_data();
check(isset($settings['enabled']) && is_array($settings['tiers']) && is_array($settings['watch_defaults']), 'settings GET shape');
check(($settings['tiers']['bitch'] ?? '') === 'censor', 'settings tiers reflect blocklist');

$req = new WP_REST_Request('PUT', '/bbjd/v1/brand-safety/settings');
$req->set_param('tier_overrides', ['bitch' => 'off']);
$updated = $routes->updateSettings($req)->get_data();
check(($updated['tiers']['bitch'] ?? '') === 'off', 'settings PUT overrides tier');
update_option('bbjd_brand_safety', []);
Blocklist::flushCache();

// --- posts: dry-run + apply ---
$dirtyPost = wp_insert_post(['post_title' => 'x', 'post_content' => 'plain bullshit here', 'post_status' => 'publish', 'post_type' => 'post']);
$cleanPost = wp_insert_post(['post_title' => 'clean title', 'post_content' => 'nothing to see here', 'post_status' => 'publish', 'post_type' => 'post']);
$wpdb->update($wpdb->posts, ['post_content' => 'plain bullshit here'], ['ID' => $dirtyPost]);
clean_post_cache($dirtyPost);
delete_post_meta($dirtyPost, Hooks::META_ORIGINAL);
$cleanModifiedBefore = get_post($cleanPost)->post_modified;

$sum = bsFullDryRun($routes, 'posts');
check($sum['target'] === 'posts', 'dry-run posts target echoed');
check($sum['done'] === true, 'dry-run posts loop reaches done');
check($sum['hits_objects'] >= 1, 'dry-run finds dirty post');
check($sum['scanned'] >= $sum['hits_objects'], 'scanned count covers hit objects');
check(get_post($dirtyPost)->post_content === 'plain bullshit here', 'dry-run is read-only');

$req = new WP_REST_Request('POST', '/bbjd/v1/brand-safety/apply');
$req->set_param('target', 'posts');
$req->set_param('batch', 100);
$loops = 0;
do {
    $r = $routes->apply($req)->get_data();
    $loops++;
} while (!$r['done'] && $loops < 1000);
check($r['done'] === true, 'posts apply reaches done');
check(strpos(get_post($dirtyPost)->post_content, 'bullshit') === false, 'apply censored legacy post');
check(get_post($cleanPost)->post_modified === $cleanModifiedBefore, 'clean post NOT rewritten (post_modified unchanged)');

$r2 = $routes->apply($req)->get_data();
check($r2['processed'] === 0 && $r2['done'] === true, 'posts apply idempotent no-op re-run');

wp_delete_post($dirtyPost, true);
wp_delete_post($cleanPost, true);

// --- comments: dry-run + apply ---
$postForComment = wp_insert_post(['post_title' => 'bs-backfill-host', 'post_status' => 'publish']);
$dirtyCommentId = wp_insert_comment([
    'comment_post_ID' => $postForComment,
    'comment_author' => 'legacy user',
    'comment_content' => 'that was total bullshit back then',
    'comment_approved' => 1,
]);

$sum = bsFullDryRun($routes, 'comments');
check($sum['done'] === true, 'dry-run comments loop reaches done (was a single 503-prone call pre-slicing)');
check($sum['hits_objects'] >= 1, 'dry-run finds dirty comment');
check(get_comment($dirtyCommentId)->comment_content === 'that was total bullshit back then', 'comment dry-run is read-only');

$req = new WP_REST_Request('POST', '/bbjd/v1/brand-safety/apply');
$req->set_param('target', 'comments');
$req->set_param('batch', 500);
$loops = 0;
do {
    $r = $routes->apply($req)->get_data();
    $loops++;
} while (!$r['done'] && $loops < 1000);
check($r['done'] === true, 'comments apply reaches done');
check(strpos(get_comment($dirtyCommentId)->comment_content, 'bullshit') === false, 'apply censored legacy comment');
check(get_comment_meta($dirtyCommentId, '_bbjd_bs_original', true) !== '', 'legacy comment original preserved');

$r2 = $routes->apply($req)->get_data();
check($r2['processed'] === 0 && $r2['done'] === true, 'comments apply idempotent no-op re-run');

wp_delete_comment($dirtyCommentId, true);
wp_delete_post($postForComment, true);

// --- quotes: dry-run + apply (real column is quote_text, not quote) ---
$qtable = BigBrotherJunkies\Data\Social\SocialSchema::table(BigBrotherJunkies\Data\Social\SocialSchema::TABLE_QUOTES);
$wpdb->insert($qtable, [
    'season_id' => 0,
    'player_id' => null,
    'quote_text' => 'legacy bullshit quote',
    'context' => '',
    'said_on' => gmdate('Y-m-d'),
    'source_count' => 1,
    'created_at' => gmdate('Y-m-d H:i:s'),
]);
$dirtyQuoteId = (int) $wpdb->insert_id;

$sum = bsFullDryRun($routes, 'quotes');
check($sum['done'] === true, 'dry-run quotes loop reaches done');
check($sum['hits_objects'] >= 1, 'dry-run finds dirty quote');
$rawQuote = $wpdb->get_var($wpdb->prepare("SELECT quote_text FROM {$qtable} WHERE id = %d", $dirtyQuoteId));
check($rawQuote === 'legacy bullshit quote', 'quote dry-run is read-only');

$req = new WP_REST_Request('POST', '/bbjd/v1/brand-safety/apply');
$req->set_param('target', 'quotes');
$req->set_param('batch', 500);
$loops = 0;
do {
    $r = $routes->apply($req)->get_data();
    $loops++;
} while (!$r['done'] && $loops < 1000);
check($r['done'] === true, 'quotes apply reaches done');
$rawQuote = $wpdb->get_var($wpdb->prepare("SELECT quote_text FROM {$qtable} WHERE id = %d", $dirtyQuoteId));
check(strpos($rawQuote, 'bullshit') === false, 'apply censored legacy quote');

$r2 = $routes->apply($req)->get_data();
check($r2['processed'] === 0 && $r2['done'] === true, 'quotes apply idempotent no-op re-run');

$wpdb->delete($qtable, ['id' => $dirtyQuoteId]);

// --- apply with no report file -> graceful, never fatal ---
@unlink(WP_CONTENT_DIR . '/bbj-quarantine/reports/dry-run-posts.json');
$noReport = Backfill::apply('posts', 25);
check($noReport['processed'] === 0 && $noReport['remaining'] === 0 && $noReport['done'] === true && isset($noReport['error']), 'apply with no report file is graceful, not fatal');
check(($noReport['purged'] ?? -1) === 0, 'apply with no report file returns purged:0');

// --- flagged / override ---
$flagPost = wp_insert_post(['post_title' => 'flag-me', 'post_content' => '<a href="https://example.com/bitch">x</a>', 'post_status' => 'publish', 'post_type' => 'post']);
$flaggedList = $routes->flagged()->get_data();
$found = null;
foreach ($flaggedList as $row) {
    if ($row['id'] === $flagPost) {
        $found = $row;
        break;
    }
}
check($found !== null && $found['overridden'] === false, 'flagged endpoint lists unsafe post');

$req = new WP_REST_Request('POST', '/bbjd/v1/brand-safety/override');
$req->set_param('post_id', $flagPost);
$req->set_param('safe', true);
$ov = $routes->override($req)->get_data();
check($ov['overridden'] === true && $ov['ads_unsafe'] === false, 'override marks post safe');

$req->set_param('safe', false);
$ov = $routes->override($req)->get_data();
check($ov['overridden'] === false && $ov['ads_unsafe'] === true, 'override removal restores unsafe flag');
wp_delete_post($flagPost, true);

// --- log ---
$logReq = new WP_REST_Request('GET', '/bbjd/v1/brand-safety/log');
$logReq->set_param('page', 1);
$logResult = $routes->log($logReq)->get_data();
check(isset($logResult['rows']) && isset($logResult['total']), 'log endpoint shape');

// --- quarantine-media ---
$mtable2 = $wpdb->prefix . 'bbj_comment_media';
$tmp2 = tempnam(sys_get_temp_dir(), 'bsq2');
file_put_contents($tmp2, 'x');
$wpdb->insert($mtable2, ['user_id' => 1, 'comment_id' => 999998, 'media_type' => 'image', 'file_name' => 'bsq2.webp', 'file_path' => $tmp2, 'file_url' => 'http://x/bsq2.webp', 'file_size' => 1, 'mime_type' => 'image/webp', 'storage_type' => 'local']);
$qmMediaId = $wpdb->insert_id;
$qmResult = $routes->quarantineMedia()->get_data();
check($qmResult['moved'] >= 1 && $qmResult['remaining_local'] === 0, 'quarantine-media route quarantines + reports remaining');
$wpdb->delete($mtable2, ['id' => $qmMediaId]);

// --- registration: brand_safety permission exists ---
$perms = PermissionChecker::getPermissionConfig();
check(isset($perms['brand_safety']), 'brand_safety permission registered');

echo "ALL CHECKS PASS (matcher + log table + comment integration + editorial/quotes + title plain-text + media shutdown + backfill/routes)\n";

// --- Fix round 1: optional revalidation purge on backfill apply ---
// Hooks::scanAndCensorPost() writes via a direct $wpdb->update, so it never
// fires transition_post_status and the purge-on-edit webhook never runs;
// without an explicit purge, applied posts would keep serving stale
// CF/ISR-cached HTML (uncensored content, missing ads_unsafe) for up to the
// edge TTL. Verified entirely offline via a pre_http_request short-circuit —
// no real HTTP call ever leaves this process either way, default or opt-in.
global $wpdb;

$httpCallCount = 0;
$interceptor = function ($preempt, $args, $url) use (&$httpCallCount) {
    if (strpos((string) $url, '/api/revalidate') !== false) {
        $httpCallCount++;
        return [
            'headers' => [],
            'body' => '',
            'response' => ['code' => 200, 'message' => 'OK'],
            'cookies' => [],
            'filename' => null,
        ];
    }
    return $preempt;
};
add_filter('pre_http_request', $interceptor, 10, 3);
update_option('bbj_revalidation_secret', 'verify-script-test-secret');

$postsReportFile = WP_CONTENT_DIR . '/bbj-quarantine/reports/dry-run-posts.json';
$commentsReportFile = WP_CONTENT_DIR . '/bbj-quarantine/reports/dry-run-comments.json';
$quotesReportFile = WP_CONTENT_DIR . '/bbj-quarantine/reports/dry-run-quotes.json';

function bsSetSingleRowReport(string $file, string $target, int $id, string $label, string $url): void
{
    file_put_contents($file, wp_json_encode([
        'scanned' => 1,
        'rows' => [['id' => $id, 'label' => $label, 'url' => $url, 'terms' => [['term' => 'bullshit', 'tier' => 'censor', 'action' => 'censored']]]],
    ]));
    $opt = get_option('bbjd_brand_safety', []);
    $opt["apply_cursor_{$target}"] = 0;
    update_option('bbjd_brand_safety', $opt);
}

// purge omitted (default false): zero HTTP calls even though the post has hits
$purgePostA = wp_insert_post(['post_title' => 'purge-check-a', 'post_content' => 'plain bullshit here', 'post_status' => 'publish', 'post_type' => 'post']);
$wpdb->update($wpdb->posts, ['post_content' => 'plain bullshit here'], ['ID' => $purgePostA]);
clean_post_cache($purgePostA);
delete_post_meta($purgePostA, Hooks::META_ORIGINAL);
bsSetSingleRowReport($postsReportFile, 'posts', $purgePostA, 'purge-check-a', '/purge-check-a');

// Reset the counter here, not before seeding: wp_insert_post(post_status=>publish)
// above fires the pre-existing transition_post_status hook (Plugin.php) that
// already calls Revalidation::revalidatePost() on its own, unrelated to Backfill's
// purge param. The assertion below must measure only what apply() itself does.
$httpCallCount = 0;
$req = new WP_REST_Request('POST', '/bbjd/v1/brand-safety/apply');
$req->set_param('target', 'posts');
$req->set_param('batch', 25);
$rNoPurge = $routes->apply($req)->get_data();
check($httpCallCount === 0, 'apply with purge omitted (default false) makes zero HTTP calls');
check(($rNoPurge['purged'] ?? -1) === 0, 'apply with purge=false returns purged:0');
check(strpos(get_post($purgePostA)->post_content, 'bullshit') === false, 'purge=false still censors the post content');
wp_delete_post($purgePostA, true);

// purge=true on a 1-post seeded report: exactly one HTTP call, purged:1
$purgePostB = wp_insert_post(['post_title' => 'purge-check-b', 'post_content' => 'plain bullshit here', 'post_status' => 'publish', 'post_type' => 'post']);
$wpdb->update($wpdb->posts, ['post_content' => 'plain bullshit here'], ['ID' => $purgePostB]);
clean_post_cache($purgePostB);
delete_post_meta($purgePostB, Hooks::META_ORIGINAL);
bsSetSingleRowReport($postsReportFile, 'posts', $purgePostB, 'purge-check-b', '/purge-check-b');

$httpCallCount = 0;
$req = new WP_REST_Request('POST', '/bbjd/v1/brand-safety/apply');
$req->set_param('target', 'posts');
$req->set_param('batch', 25);
$req->set_param('purge', true);
$rPurge = $routes->apply($req)->get_data();
check($httpCallCount === 1, 'apply with purge=true makes exactly one HTTP call for a 1-post report');
check(($rPurge['purged'] ?? -1) === 1, 'apply with purge=true returns purged:1');
check(strpos(get_post($purgePostB)->post_content, 'bullshit') === false, 'purge=true still censors the post content');
wp_delete_post($purgePostB, true);

// purge is a no-op for comments/quotes targets (never counted, never called)
$origCommentsReport = @file_get_contents($commentsReportFile);
$origCommentsCursor = (int) (get_option('bbjd_brand_safety', [])['apply_cursor_comments'] ?? 0);

$purgeCommentPost = wp_insert_post(['post_title' => 'purge-check-comment-host', 'post_status' => 'publish']);
$purgeCommentId = wp_insert_comment([
    'comment_post_ID' => $purgeCommentPost,
    'comment_author' => 'purge check',
    'comment_content' => 'that was total bullshit back then',
    'comment_approved' => 1,
]);
bsSetSingleRowReport($commentsReportFile, 'comments', $purgeCommentId, 'comment #' . $purgeCommentId, '?p=' . $purgeCommentPost);

$httpCallCount = 0;
$req = new WP_REST_Request('POST', '/bbjd/v1/brand-safety/apply');
$req->set_param('target', 'comments');
$req->set_param('batch', 500);
$req->set_param('purge', true);
$rPurgeComment = $routes->apply($req)->get_data();
check($httpCallCount === 0, 'purge=true is a no-op for the comments target (zero HTTP calls)');
check(($rPurgeComment['purged'] ?? -1) === 0, 'comments apply always returns purged:0');
wp_delete_comment($purgeCommentId, true);
wp_delete_post($purgeCommentPost, true);

if ($origCommentsReport !== false) {
    file_put_contents($commentsReportFile, $origCommentsReport);
} else {
    @unlink($commentsReportFile);
}
$optRestore = get_option('bbjd_brand_safety', []);
$optRestore['apply_cursor_comments'] = $origCommentsCursor;
update_option('bbjd_brand_safety', $optRestore);

$origQuotesReport = @file_get_contents($quotesReportFile);
$origQuotesCursor = (int) (get_option('bbjd_brand_safety', [])['apply_cursor_quotes'] ?? 0);

$qtable2 = BigBrotherJunkies\Data\Social\SocialSchema::table(BigBrotherJunkies\Data\Social\SocialSchema::TABLE_QUOTES);
$wpdb->insert($qtable2, [
    'season_id' => 0,
    'player_id' => null,
    'quote_text' => 'purge check bullshit quote',
    'context' => '',
    'said_on' => gmdate('Y-m-d'),
    'source_count' => 1,
    'created_at' => gmdate('Y-m-d H:i:s'),
]);
$purgeQuoteId = (int) $wpdb->insert_id;
bsSetSingleRowReport($quotesReportFile, 'quotes', $purgeQuoteId, 'quote #' . $purgeQuoteId, '');

$httpCallCount = 0;
$req = new WP_REST_Request('POST', '/bbjd/v1/brand-safety/apply');
$req->set_param('target', 'quotes');
$req->set_param('batch', 500);
$req->set_param('purge', true);
$rPurgeQuote = $routes->apply($req)->get_data();
check($httpCallCount === 0, 'purge=true is a no-op for the quotes target (zero HTTP calls)');
check(($rPurgeQuote['purged'] ?? -1) === 0, 'quotes apply always returns purged:0');
$wpdb->delete($qtable2, ['id' => $purgeQuoteId]);

if ($origQuotesReport !== false) {
    file_put_contents($quotesReportFile, $origQuotesReport);
} else {
    @unlink($quotesReportFile);
}
$optRestore = get_option('bbjd_brand_safety', []);
$optRestore['apply_cursor_quotes'] = $origQuotesCursor;
update_option('bbjd_brand_safety', $optRestore);

remove_filter('pre_http_request', $interceptor, 10);
delete_option('bbj_revalidation_secret');
@unlink($postsReportFile);

echo "ALL CHECKS PASS (matcher + log table + comment integration + editorial/quotes + title plain-text + media shutdown + backfill/routes + purge-on-apply)\n";

// --- Fix round 2: time-sliced, resumable dry-run ---
// The comments dry-run 503'd on the full ~254k-row table under Apache/mod_php
// (single request, no time budget). Verified here against the real (much
// smaller) 'quotes' table so the resume/no-rescan/cursor-timing mechanics get
// fully exercised without a multi-minute test run. sliceSeconds=0 forces
// exactly one object processed per call, making the slicing deterministic.
global $wpdb;
$qtable3 = BigBrotherJunkies\Data\Social\SocialSchema::table(BigBrotherJunkies\Data\Social\SocialSchema::TABLE_QUOTES);
$quotesReportFile2 = WP_CONTENT_DIR . '/bbj-quarantine/reports/dry-run-quotes.json';

$origQuotesReport2 = @file_get_contents($quotesReportFile2);
$origQuotesCursor2 = (int) (get_option('bbjd_brand_safety', [])['apply_cursor_quotes'] ?? 0);

$baselineQuotes = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$qtable3}");
$sliceQuoteIds = [];
for ($i = 0; $i < 3; $i++) {
    $wpdb->insert($qtable3, [
        'season_id' => 0,
        'player_id' => null,
        'quote_text' => "slice-test bullshit quote {$i}",
        'context' => '',
        'said_on' => gmdate('Y-m-d'),
        'source_count' => 1,
        'created_at' => gmdate('Y-m-d H:i:s'),
    ]);
    $sliceQuoteIds[] = (int) $wpdb->insert_id;
}
$expectedTotal = $baselineQuotes + 3;

@unlink($quotesReportFile2); // guarantee this run starts fresh, not resuming leftover state
$opt = get_option('bbjd_brand_safety', []);
$opt['apply_cursor_quotes'] = 42; // sentinel — must survive every in-progress slice untouched
update_option('bbjd_brand_safety', $opt);

$loops = 0;
$done = false;
$lastScanned = 0;
while (!$done) {
    $slice = Backfill::dryRun('quotes', 0);
    $loops++;
    check($slice['scanned_so_far'] > $lastScanned, 'slice scanned_so_far strictly advances (no rescan-from-zero)');
    $lastScanned = $slice['scanned_so_far'];
    $done = $slice['done'];
    $cursorNow = (int) (get_option('bbjd_brand_safety', [])['apply_cursor_quotes'] ?? -1);
    if (!$done) {
        check($cursorNow === 42, 'apply cursor untouched mid-slice');
    } else {
        check($cursorNow === 0, 'apply cursor reset exactly on completion');
    }
    check($loops < $expectedTotal + 10, 'slice loop terminates within expected bound');
}
check($loops === $expectedTotal, 'sliced dry-run took exactly one call per object (sliceSeconds=0)');
check($lastScanned === $expectedTotal, 'sliced dry-run scanned every object exactly once');

$slicedReport = Backfill::readReport('quotes');
check($slicedReport['done'] === true, 'final persisted report marked done');
$slicedIds = array_column($slicedReport['rows'], 'id');
check(count($slicedIds) === count(array_unique($slicedIds)), 'no duplicate report rows after resume');

// Fresh single-pass run: the just-finished done:true report is now "stale" —
// Backfill::dryRun deletes it and restarts from zero — should land on the
// same object set, proving the sliced path and the single-pass path agree.
$reference = Backfill::dryRun('quotes'); // default 20s slice; small table finishes in one call
check($reference['done'] === true, 'reference single-pass run completes in one call');
$referenceReport = Backfill::readReport('quotes');
$referenceIds = array_column($referenceReport['rows'], 'id');
sort($slicedIds);
sort($referenceIds);
check($slicedIds === $referenceIds, 'sliced run finds the identical object set as a single-pass run');
check($slicedReport['scanned'] === $referenceReport['scanned'], 'sliced run scanned the same total as a single-pass run');

// --- cleanup ---
foreach ($sliceQuoteIds as $id) {
    $wpdb->delete($qtable3, ['id' => $id]);
}
if ($origQuotesReport2 !== false) {
    file_put_contents($quotesReportFile2, $origQuotesReport2);
} else {
    @unlink($quotesReportFile2);
}
$optRestore2 = get_option('bbjd_brand_safety', []);
$optRestore2['apply_cursor_quotes'] = $origQuotesCursor2;
update_option('bbjd_brand_safety', $optRestore2);

echo "ALL CHECKS PASS (matcher + log table + comment integration + editorial/quotes + title plain-text + media shutdown + backfill/routes + purge-on-apply + sliced dry-run)\n";
