<?php
/**
 * LOCAL-ONLY verification for WeeklyAdmin DB layer (no wp-cli locally).
 * Creates a scratch week on a real season, saves a payload, reads it back,
 * then deletes the week — totals are recomputed on save AND delete, so the
 * season ends where it started.
 *
 * Usage: php scripts/weekly-admin-local-verify.php [--season=27] [--wp=C:/xampp/htdocs/bbj/wp-load.php]
 */
$opts = [];
foreach (array_slice($argv, 1) as $a) {
    if (preg_match('/^--([^=]+)=(.*)$/', $a, $m)) $opts[$m[1]] = $m[2];
}
$wpLoad = $opts['wp'] ?? 'C:/xampp/htdocs/bbj/wp-load.php';
require_once $wpLoad;

use BigBrotherJunkies\Data\Weekly\WeeklyAdmin;

function check(bool $ok, string $label): void
{
    echo ($ok ? "PASS" : "FAIL") . "  {$label}\n";
    if (!$ok) exit(1);
}

global $wpdb;
$seasonNumber = $opts['season'] ?? '27';
$seasonId = (int) $wpdb->get_var($wpdb->prepare(
    "SELECT id FROM {$wpdb->prefix}bbj_seasons WHERE season_number = %s", $seasonNumber
));
check($seasonId > 0, "resolved season {$seasonNumber} -> {$seasonId}");

$bundle = WeeklyAdmin::getAdminBundle($seasonId);
check(count($bundle['roster']) >= 4, 'bundle has roster (' . count($bundle['roster']) . ' players)');
check(count($bundle['comp_types']) >= 2, 'bundle has comp types');
$beforeWeeks = count($bundle['weeks']);

[$p1, $p2, $p3, $p4] = array_map(static fn ($r) => $r['id'], array_slice($bundle['roster'], 0, 4));

$created = WeeklyAdmin::createWeek($seasonId, '2026-07-10', null);
check($created['id'] > 0, "created week id={$created['id']} num={$created['week_num']}");

$bad = WeeklyAdmin::saveWeek($created['id'], ['active' => [$p1], 'hoh' => 999999999]);
check(!empty($bad['errors']), 'off-roster hoh rejected: ' . implode('; ', $bad['errors'] ?? []));

// Snapshot a player's stat totals to prove the recompute gate (default OFF) leaves them alone.
$totalsBefore = $wpdb->get_row($wpdb->prepare(
    "SELECT bbj_total_hoh, bbj_total_pov, bbj_total_misc, bbj_total_nom, bbj_total_havenot
       FROM {$wpdb->prefix}bbj_v2_player_season WHERE bbj_player = %d AND bbj_season = %d",
    $p1, $seasonId
), ARRAY_A);

$saved = WeeklyAdmin::saveWeek($created['id'], [
    'active'       => [$p1, $p2, $p3, $p4],
    'hoh'          => $p1,
    'pov'          => $p2,
    'noms'         => [$p3, $p4],
    'veto_used_on' => null,
    'evicted'      => [$p3],
    'havenot'      => [$p4],
    'votes'        => [$p2 => $p3],
    'misc_comps'   => [],
    'summary'      => 'scratch verification week',
]);
check(empty($saved['errors']), 'saveWeek ok: ' . json_encode($saved));
check(in_array($p3, $saved['changed_player_ids'] ?? [], true), 'evictee in changed_player_ids');

$after = WeeklyAdmin::getAdminBundle($seasonId);
$mine = null;
foreach ($after['weeks'] as $w) {
    if ($w['id'] === $created['id']) $mine = $w;
}
check($mine !== null, 'saved week present in bundle');
check(count($mine['players']) === 4, 'week has 4 player rows');
check(count($mine['comps']) === 2, 'week has hoh+pov comp rows');
check($mine['summary'] === 'scratch verification week', 'summary round-trips');
$evictedRow = null;
foreach ($mine['players'] as $r) {
    if ($r['player_id'] === $p3) $evictedRow = $r;
}
check($evictedRow && $evictedRow['evicted'] === 1 && $evictedRow['nom'] === 1, 'evictee row flags correct');
$havenotRow = null;
foreach ($mine['players'] as $r) {
    if ($r['player_id'] === $p4) $havenotRow = $r;
}
check($havenotRow && $havenotRow['havenot'] === 1, 'havenot flag round-trips');

// Recompute gate: option is OFF by default, so stat totals must be untouched.
check(!WeeklyAdmin::recomputeEnabled(), 'recompute gate defaults OFF');
$totalsAfter = $wpdb->get_row($wpdb->prepare(
    "SELECT bbj_total_hoh, bbj_total_pov, bbj_total_misc, bbj_total_nom, bbj_total_havenot
       FROM {$wpdb->prefix}bbj_v2_player_season WHERE bbj_player = %d AND bbj_season = %d",
    $p1, $seasonId
), ARRAY_A);
check($totalsBefore == $totalsAfter, 'stat totals untouched while gate is off');

// totalsDiff is read-only and reports per-player derived vs current.
$diff = WeeklyAdmin::totalsDiff($seasonId);
check(count($diff['players']) >= 4, 'totalsDiff covers roster (' . count($diff['players']) . ' players, ' . $diff['mismatches'] . ' mismatches)');
$diffP1 = null;
foreach ($diff['players'] as $dp) {
    if ($dp['player_id'] === $p1) $diffP1 = $dp;
}
check($diffP1 !== null && isset($diffP1['derived']['havenot'], $diffP1['current']['havenot']), 'totalsDiff includes havenot');

$deleted = WeeklyAdmin::deleteWeek($created['id']);
check($deleted !== null && $deleted['season_id'] === $seasonId, 'deleteWeek ok');
$final = WeeklyAdmin::getAdminBundle($seasonId);
check(count($final['weeks']) === $beforeWeeks, 'week count restored after cleanup');
check(WeeklyAdmin::deleteWeek($created['id']) === null, 'double delete returns null');

echo "ALL CHECKS PASSED\n";
