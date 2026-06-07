#!/usr/bin/env node
/**
 * Ask the Bean — index structured SEASON FACT-SHEETS (winner/runner-up/AFP + cast +
 * week-by-week HoH/Veto/Noms/Evictions). Replaces the thin season entries so the Bean
 * can answer hard facts instead of guessing. Small write count (~1 chunk per season).
 * Usage: node --env-file=.env.local scripts/bean-index-facts.mjs
 */
import { fetchSeasonFactSheets } from "../src/lib/bean/factSheets.js";
import { reindexItem } from "../src/lib/bean/indexContent.js";

const t0 = Date.now();
console.log("Building season fact-sheets from structured data…");
const items = await fetchSeasonFactSheets();
console.log(`Built ${items.length} season fact-sheets. Indexing…`);

let n = 0;
for (const it of items) {
  await reindexItem(it);
  process.stdout.write(`\r${++n}/${items.length}  ${it.title}                    `);
}
console.log(`\nDone in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
