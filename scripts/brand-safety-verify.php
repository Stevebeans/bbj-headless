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

echo "ALL CHECKS PASS (matcher + log table + comment integration + editorial/quotes)\n";
