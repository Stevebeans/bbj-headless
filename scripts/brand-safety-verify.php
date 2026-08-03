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
