// BBJ k6 load test — opening-night simulation.
//
// Decision criteria for this test:
//   - vercel_cache_hits  > 0.95   → safe to continue with Next.js
//                        < 0.90   → costs will spiral, investigate why pages miss
//   - http_req_duration p(95) < 1500ms on cache hits → edge is healthy
//   - http_req_failed    < 0.01   → no errors under load
//
// Run modes (uncomment one `stages` block below):
//   1. Smoke    — 50 VUs / 1 min  (verify script works, no real load)
//   2. Soak     — 500 VUs / 5 min (catch slow leaks before going big)
//   3. Full     — 2000 VUs / 10 min (the real test)
//
// Run:
//   k6 run --env BASE_URL=https://bigbrotherjunkies.com load-test.js
//   k6 run --env BASE_URL=https://staging.bigbrotherjunkies.com load-test.js
//
// Pre-flight checklist before each run:
//   [ ] Ads disabled via admin master switch
//   [ ] GA4 + Vercel Analytics filtering on `k6-bbj-loadtest/1.0` UA
//   [ ] If running from home IP: allow-list it at Cloudflare WAF
//   [ ] If hitting prod: warn Vercel support that legit synthetic traffic is coming
//   [ ] Sanity-check x-vercel-cache: HIT on every URL in URLS below before starting

import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Counter, Trend } from "k6/metrics";

// ─── Custom metrics ──────────────────────────────────────────────────────────
const cacheHitRate = new Rate("vercel_cache_hits");
const cacheMisses = new Counter("vercel_cache_misses");
const cacheStale = new Counter("vercel_cache_stale");
const cacheBypass = new Counter("vercel_cache_bypass_or_unknown");
const ttfbCacheHit = new Trend("ttfb_cache_hit_ms");
const ttfbCacheMiss = new Trend("ttfb_cache_miss_ms");

// ─── Config ──────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || "https://bigbrotherjunkies.com";

// Realistic URL mix for opening night. Adjust slugs to match what's live.
// Weight = relative traffic share. Total doesn't need to sum to 100.
//
// To override at runtime:
//   k6 run --env LATEST_POST=my-newest-spoiler-slug load-test.js
const LATEST_POST = __ENV.LATEST_POST || "big-brother-2025-what-we-know-and-want-this-season";
const HOT_POST_1 = __ENV.HOT_POST_1 || "big-brother-27-live-finale-discussion-who-wins-750k";
const HOT_POST_2 = __ENV.HOT_POST_2 || "big-brother-27-thursday-recap-for-sept-25th";

const URLS = [
  // ─── Hot content (most opening-night traffic) ────────────────────────────
  { path: "/", weight: 35, tag: "home" },
  { path: `/${LATEST_POST}`, weight: 25, tag: "latest_post" },
  { path: `/${HOT_POST_1}`, weight: 10, tag: "hot_post_1" },
  { path: `/${HOT_POST_2}`, weight: 8, tag: "hot_post_2" },

  // ─── Hub pages ───────────────────────────────────────────────────────────
  { path: "/live-feed-updates", weight: 8, tag: "feed_hub" },
  { path: "/directory", weight: 4, tag: "directory" },

  // ─── Long-tail (categories, supporter, etc.) ─────────────────────────────
  { path: "/category/spoilers", weight: 4, tag: "category" },
  { path: "/become-supporter", weight: 3, tag: "supporter" },
  { path: "/contact", weight: 1, tag: "static" },
  { path: "/privacy-policy", weight: 1, tag: "static" }
];

// Expand weights into a lookup table once (faster than weighted picking per iter)
const URL_POOL = URLS.flatMap(u => Array(u.weight).fill(u));

// ─── Load profile ────────────────────────────────────────────────────────────
// Pick ONE stages block. Comment the others out.

// 1. SMOKE — sanity check the script. ~50 VUs for 1 minute.
// export const options = {
//   stages: [
//     { duration: "20s", target: 50 },
//     { duration: "40s", target: 50 },
//     { duration: "10s", target: 0 }
//   ],
//   thresholds: {
//     vercel_cache_hits: ["rate>0.95"],
//     http_req_failed: ["rate<0.01"],
//     http_req_duration: ["p(95)<1500"]
//   }
// };

// 2. SOAK — 500 VUs for 5 minutes. Run this before going to 2k.
// export const options = {
//   stages: [
//     { duration: "1m", target: 500 },
//     { duration: "5m", target: 500 },
//     { duration: "30s", target: 0 }
//   ],
//   thresholds: {
//     vercel_cache_hits: ["rate>0.95"],
//     http_req_failed: ["rate<0.01"],
//     http_req_duration: ["p(95)<2000"]
//   }
// };

// 3. FULL — 2000 VUs for 10 minutes. THE test.
export const options = {
  stages: [
    { duration: "2m", target: 500 }, // gentle ramp — let edge cache warm
    { duration: "2m", target: 2000 }, // ramp to peak
    { duration: "10m", target: 2000 }, // sustain
    { duration: "1m", target: 0 } // cool down
  ],
  thresholds: {
    vercel_cache_hits: ["rate>0.95"],
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<2000"]
  }
};

// ─── The test ────────────────────────────────────────────────────────────────
export default function () {
  const choice = URL_POOL[Math.floor(Math.random() * URL_POOL.length)];
  const url = `${BASE_URL}${choice.path}`;

  const res = http.get(url, {
    tags: { url_group: choice.tag },
    headers: {
      // Distinct UA so analytics filters can exclude this traffic
      "User-Agent": "k6-bbj-loadtest/1.0",
      // Pretend to be a normal browser for everything else
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9"
    }
  });

  check(res, {
    "status 200/304": r => r.status === 200 || r.status === 304
  });

  // ─── Track Vercel edge cache behavior ─────────────────────────────────────
  // Header values: HIT | MISS | STALE | BYPASS | PRERENDER | REVALIDATED
  // See: https://vercel.com/docs/edge-network/headers#x-vercel-cache
  const cache = res.headers["X-Vercel-Cache"] || "";
  const ttfb = res.timings.waiting;

  switch (cache) {
    case "HIT":
    case "PRERENDER":
      cacheHitRate.add(true);
      ttfbCacheHit.add(ttfb);
      break;
    case "STALE":
      // STALE still served from edge — no function invocation, but stale.
      // Counted as a hit for cost purposes; tracked separately for visibility.
      cacheHitRate.add(true);
      cacheStale.add(1);
      ttfbCacheHit.add(ttfb);
      break;
    case "MISS":
    case "REVALIDATED":
      cacheHitRate.add(false);
      cacheMisses.add(1);
      ttfbCacheMiss.add(ttfb);
      break;
    default:
      // BYPASS or empty header — usually means a dynamic route or API call.
      cacheBypass.add(1);
  }

  // Realistic browse pacing — real users don't refresh constantly.
  // 2–6s between requests ≈ a user reading the page before clicking next.
  sleep(Math.random() * 4 + 2);
}

// ─── Summary printer ─────────────────────────────────────────────────────────
export function handleSummary(data) {
  const m = data.metrics;
  const hitRate = m.vercel_cache_hits?.values?.rate ?? 0;
  const misses = m.vercel_cache_misses?.values?.count ?? 0;
  const stale = m.vercel_cache_stale?.values?.count ?? 0;
  const bypass = m.vercel_cache_bypass_or_unknown?.values?.count ?? 0;
  const errRate = m.http_req_failed?.values?.rate ?? 0;
  const p95 = m.http_req_duration?.values?.["p(95)"] ?? 0;
  const reqTotal = m.http_reqs?.values?.count ?? 0;

  // Rough Vercel cost projection (function invocations).
  // Function pricing is the lever; bandwidth is generally cheap.
  // Edge-cached hits don't count. Misses do. STALE doesn't.
  const projectedInvocations = misses; // 1 miss = ~1 function invocation
  const invocationsPerMillion = projectedInvocations / 1_000_000;
  // Pricing changes — confirm at https://vercel.com/pricing before trusting this.
  const roughCostUSD = invocationsPerMillion * 0.6; // $0.60 per 1M invocations as of 2026

  const verdict = hitRate >= 0.95 && errRate < 0.01 ? "✅ SAFE — proceed with Next.js" : hitRate >= 0.9 ? "⚠️  MARGINAL — investigate misses before launch" : "❌ DANGER — costs will spiral, fix caching or revert to PHP";

  const text = `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` + `  BBJ Opening-Night Load Test Summary\n` + `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` + `  Total requests:        ${reqTotal.toLocaleString()}\n` + `  Vercel cache HIT rate: ${(hitRate * 100).toFixed(2)}%\n` + `  Cache MISS count:      ${misses.toLocaleString()}\n` + `  Cache STALE count:     ${stale.toLocaleString()}\n` + `  Cache BYPASS/unknown:  ${bypass.toLocaleString()}\n` + `  Error rate:            ${(errRate * 100).toFixed(3)}%\n` + `  Latency p(95):         ${p95.toFixed(0)} ms\n` + `\n` + `  Projected fn invocations: ${projectedInvocations.toLocaleString()}\n` + `  Rough function cost:      $${roughCostUSD.toFixed(2)}\n` + `  (extrapolate to expected opening-night traffic for real budgeting)\n` + `\n` + `  Verdict: ${verdict}\n` + `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  return {
    stdout: text,
    "summary.json": JSON.stringify(data, null, 2)
  };
}
