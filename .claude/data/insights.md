## Page Speed Insights

## Feb 03, 2016

## Legacy Build:

**Mobile:**

Performance - 27
Accessibility - 86
Best Practices - 46
SEO - 85

Overall - 27

Notes:

First Contentful Paint
5.9 s
Largest Contentful Paint
19.1 s
Total Blocking Time
2,210 ms
Cumulative Layout Shift
0
Speed Index
15.1 s

**Desktop**

Performance - 40
Accessibility - 86
Best Practices - 50
SEO - 85

Overall - 40

Notes:

First Contentful Paint
1.0 s
Largest Contentful Paint
1.4 s
Total Blocking Time
1,690 ms
Cumulative Layout Shift
0.284
Speed Index
4.8 s

## Staging Build (Vercel) before optimizations

**Mobile:**

Performance - 93
Accessibility - 92
Best Practices - 96
SEO - 83

Overall - 93

Notes:

First Contentful Paint
1.2 s
Largest Contentful Paint
3.2 s
Total Blocking Time
10 ms
Cumulative Layout Shift
0
Speed Index
1.9 s

Insights:

- Forced reflow
- LCP request discovery
- Use efficient cache lifetimes Est savings of 14 KiB
- Legacy JavaScript Est savings of 11 KiB
- Reduce unused CSS Est savings of 16 KiB

Accessibility:

Background and foreground colors do not have a sufficient contrast ratio.

- Examples in Spoiler Bar
  -- `Jury <div class="spoilerbar-jury text-center text-[10px] w-full border-t-2 border-r-2 borde…">`
  -- `Morgan <div class="spoilerbar-jury rounded-b-md border-r-2 border-l-2 border-b-2 text-[10px] …">`
- `Latest Big Brother 27 Spoilers 17 comments Read More Big Brother 27 – Vince and…  <article class="v2-primary-container-inner" aria-labelledby="featured-post-title">`
- `RECENT REPLIES <div class="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 upper…">`
- `New threads for Survivor and TAR would be great! <span class="text-gray-500 dark:text-gray-400">` (note this is the recent comments to feed update)
- `Steve Beans 4 months ago Does anyone want to write Survivor or TAR recaps this … <article id="does-anyone-want-to-write-survivor-or-tar-recaps-this-season-hit-me-up-in-…" class="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 …">`

Touch targets do not have sufficient size or spacing.

Best Practices:

- Browser errors were logged to the console
  (example) /bigbrother-players/lauren-domingue?\_rsc=3lb4g:1:0(staging.bigbrotherjunkies.com) Failed to load resource: the server responded with a status of 500 (Internal Server Error)

SEO:

- Links do not have descriptive text 1 link found
  (example) bigbrotherjunkies.com 1st party
  /big-brother-27-vince-and-kelsey-back-on(staging.bigbrotherjunkies.com)
- robots.txt is not valid Request for robots.txt returned HTTP status: 500

**Desktop**

Performance - 98
Accessibility - 88
Best Practices - 92
SEO - 83

Overall - 98

Notes:

First Contentful Paint
0.3 s
Largest Contentful Paint
0.5 s
Total Blocking Time
20 ms
Cumulative Layout Shift
0.081
Speed Index
0.9 s

## Apr 04, 2026 — Next.js Staging WITH Ads

**Mobile (staging.bigbrotherjunkies.com):**

Performance - 45
Accessibility - 96
Best Practices - 35
SEO - 92

First Contentful Paint: 1.7 s
Largest Contentful Paint: 4.4 s
Total Blocking Time: 3,390 ms
Cumulative Layout Shift: 0
Speed Index: 11.6 s

Notes:

- Freestar ad scripts are the main performance killer
- TBT went from 10ms (no ads) to 3,390ms — ad JS blocking main thread
- Best Practices dropped from 96 to 35 — likely console errors from ad scripts
- Accessibility and SEO actually improved since Feb

## Apr 04, 2026 — WordPress Live (Current)

**Mobile (bigbrotherjunkies.com):**

Performance - 19
Accessibility - 84
Best Practices - 27
SEO - 85

First Contentful Paint: 8.9 s
Largest Contentful Paint: 24.9 s
Total Blocking Time: 2,120 ms
Cumulative Layout Shift: 0.182
Speed Index: 19.9 s

Notes:

- Worst scores yet — WP performance has degraded over time
- 24.9s LCP is catastrophic
- CLS 0.182 (layout shift from ads loading)
- Even with ads hurting Next.js, it still beats WP on every metric

## Comparison Table (All Mobile)

| Metric         | WP Legacy (Feb) | Next.js No Ads (Feb) | Next.js + Ads (Apr) | WP Live (Apr) |
| -------------- | --------------- | -------------------- | ------------------- | ------------- |
| Performance    | 27              | 93                   | 45                  | 19            |
| Accessibility  | 86              | 92                   | 96                  | 84            |
| Best Practices | 46              | 96                   | 35                  | 27            |
| SEO            | 85              | 83                   | 92                  | 85            |
| FCP            | 5.9s            | 1.2s                 | 1.7s                | 8.9s          |
| LCP            | 19.1s           | 3.2s                 | 4.4s                | 24.9s         |
| TBT            | 2,210ms         | 10ms                 | 3,390ms             | 2,120ms       |
| CLS            | 0               | 0                    | 0                   | 0.182         |
| Speed Index    | 15.1s           | 1.9s                 | 11.6s               | 19.9s         |
