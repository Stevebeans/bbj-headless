#!/usr/bin/env node
/**
 * Ask the Bean — one-time archive backfill into the vector index.
 * Usage: node --env-file=.env.local scripts/bean-index.mjs
 * Re-runnable: upserts by stable chunk id, so running again refreshes.
 */
import { fetchAllContent } from "../src/lib/bean/content.js";
import { indexItems } from "../src/lib/bean/indexContent.js";

const t0 = Date.now();
console.log("Fetching all content from WordPress…");
const items = await fetchAllContent();
const byType = items.reduce((a, i) => ((a[i.type] = (a[i.type] || 0) + 1), a), {});
console.log("Fetched:", byType, `(${items.length} total)`);

console.log("Indexing into Upstash Vector…");
const res = await indexItems(items, (m) => process.stdout.write(`\r${m}`));
console.log(`\nDone: ${res.items} items → ${res.chunks} chunks in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
