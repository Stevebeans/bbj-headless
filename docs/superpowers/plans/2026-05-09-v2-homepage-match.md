# V2 Homepage Match Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the bbj-app Next.js homepage layout into parity with `bbj/wp-content/themes/bbj-v2-theme/front-page.php` — single PR, no caching regressions.

**Architecture:** Extend the existing `/bbjd/v1/homepage` combined endpoint (no new endpoints, no new ISR cache tags). Add five new React components, update Hero heading hierarchy, restructure the shared `Sidebar.jsx`. Webhook-driven ISR preserved.

**Tech Stack:** Next.js 15 (App Router), React 19, JavaScript (no TypeScript), Tailwind CSS v3, WordPress 6.x with the `bigbrotherjunkies-data` custom plugin, ISR via `revalidate: false` + tag-based webhook revalidation.

**Spec:** `docs/superpowers/specs/2026-05-09-v2-homepage-match-design.md`

**Verification model:** This project has no Jest/Vitest. Each task verifies via local dev server (`npm run dev`), `npm run lint`, `npm run build`, and visual inspection. Final integration test on staging via `/full-push`.

---

## File Map

### bbj-app

- Create: `src/components/home/StatusStrip.jsx`
- Create: `src/components/home/HouseStrip.jsx`
- Create: `src/components/home/HousePulse.jsx`
- Create: `src/components/sidebar/ParamountPlusCard.jsx`
- Create: `src/components/sidebar/StickyAdSlot.jsx`
- Modify: `src/styles/globals.css` (add utility classes)
- Modify: `src/components/home/Hero.jsx` (h1→h2)
- Modify: `src/components/home/HomeWidgets.jsx` (`SeasonStats` styling refresh)
- Modify: `src/components/home/index.js` (exports)
- Modify: `src/components/layout/Sidebar.jsx` (strip wrappers, add anchors)
- Modify: `src/lib/api/home.js` (extend `DEFAULTS` + destructure)
- Modify: `src/app/page.jsx` (component tree)
- Modify: 16 other pages that use `<Sidebar>` to add `<SubscribeWidget />` into their children
- Conditional delete: `Houseboard`, `SocialFollow`, `WatchLiveFeeds` exports if no consumers remain

### WordPress plugin (`bigbrotherjunkies-data`)

- Modify: `src/Api/HomeRoutes.php` — add `getHousePulse()`, `getCurrentSeason()`, extend `getHomepage()`

---

## Pre-flight check

- [ ] **Step 1: Confirm working directory and branch**

```powershell
cd C:\xampp\htdocs\bbj-app
git status   # should be clean on `staging` (or feature branch)
git pull
```

- [ ] **Step 2: Start dev server in a separate terminal so you can hot-reload during the work**

```powershell
npm run dev
```

Expected: server up on `http://localhost:3000`, no errors. Leave it running through the whole plan.

- [ ] **Step 3: Confirm bbj.localhost (XAMPP WordPress) is up**

Open `http://bbj.localhost/wp-json/bbjd/v1/homepage` in a browser. Expected: a JSON payload with `hero`, `feedUpdates`, `houseboard`, `seasonStats`, `recentComments`, `posts` keys. If it 404s, start XAMPP Apache.

---

## Task 1: Port v2 CSS utility classes into globals.css

**Why first:** Components in later tasks reference these classes. Land them up front so each component task has the styles it needs.

**Files:**
- Modify: `src/styles/globals.css`

**Source classes** (from `bbj/wp-content/themes/bbj-v2-theme/src/css/style.css`):
- `.bbj-card` — white card with border + padding
- `.bbj-status-strip` — dark navy band
- `.bbj-ticker` + `.bbj-ticker-track` + `@keyframes bbj-ticker-slide` — scrolling marquee with fade mask + reduced-motion fallback
- `.bbj-sidebar-card` — sidebar card spacing
- `.bbj-house-strip` — referenced in PHP as a class on the HouseStrip section (no specific rules in v2 style.css beyond `.bbj-card`; treat as a marker class)
- `.bbj-house-pulse` — same (marker class)

- [ ] **Step 1: Read the v2 source classes**

```powershell
# View the v2 utility classes
Get-Content C:\xampp\htdocs\bbj\wp-content\themes\bbj-v2-theme\src\css\style.css | Select-String -Pattern "bbj-card|bbj-status-strip|bbj-ticker|bbj-sidebar-card|bbj-ticker-slide" -Context 0,5
```

- [ ] **Step 2: Read current globals.css to find a good insertion point**

```powershell
Get-Content C:\xampp\htdocs\bbj-app\src\styles\globals.css | Select-String -Pattern "@layer components" -Context 0,3
```

- [ ] **Step 3: Add the utility classes inside the existing `@layer components` block**

In `src/styles/globals.css`, append the following inside the `@layer components { ... }` block:

```css
.bbj-card {
  @apply bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-5 mb-4;
}

.bbj-status-strip {
  @apply bg-gray-900 dark:bg-black border-b border-gray-700 text-white;
}

.bbj-ticker {
  @apply relative overflow-hidden min-w-0 flex-1;
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 24px, #000 calc(100% - 24px), transparent);
          mask-image: linear-gradient(90deg, transparent, #000 24px, #000 calc(100% - 24px), transparent);
}

.bbj-ticker-track {
  @apply inline-flex items-center whitespace-nowrap;
  animation: bbj-ticker-slide 60s linear infinite;
}

.bbj-ticker:hover .bbj-ticker-track,
.bbj-ticker:focus-within .bbj-ticker-track {
  animation-play-state: paused;
}

@media (prefers-reduced-motion: reduce) {
  .bbj-ticker-track { animation: none; }
}

.bbj-sidebar-card {
  @apply pb-6 mb-6 last:mb-0 last:pb-0;
}

.bbj-house-strip { @apply block; }
.bbj-house-pulse { @apply block; }
```

Then, OUTSIDE the `@layer components` block (at the top level of the file), add the keyframes:

```css
@keyframes bbj-ticker-slide {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
```

- [ ] **Step 4: Lint**

```powershell
npm run lint
```

Expected: no errors related to globals.css (CSS isn't linted by ESLint, but lint catches accidental JS edits).

- [ ] **Step 5: Verify Tailwind compiles**

Wait for the dev server to recompile (watch terminal). Open `http://localhost:3000` in browser. Expected: page still renders, no console errors.

- [ ] **Step 6: Commit**

```powershell
git add src/styles/globals.css
git commit -m "feat(home): port bbj-v2 utility classes for v2 homepage match"
```

---

## Task 2: Add `getHousePulse()` to the WP plugin

**Why:** This produces the data the new HousePulse component needs. Edit happens in the bigbrotherjunkies-data plugin per CLAUDE.md.

**Files:**
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\HomeRoutes.php`

**Source logic to port** (from `bbj/wp-content/themes/bbj-v2-theme/inc/homepage-data.php` lines 257+, function `bbj_v2_homepage_house_pulse`):

```php
global $wpdb;
$rows = $wpdb->get_results($wpdb->prepare(
    "SELECT HOUR(post_date) AS h, COUNT(*) AS c
     FROM {$wpdb->posts}
     WHERE post_type = 'live-feed-updates'
       AND post_status = 'publish'
       AND post_date >= DATE_SUB(NOW(), INTERVAL %d HOUR)
     GROUP BY HOUR(post_date)",
    $hours
), ARRAY_A);
```

Active-season check (from `bbj_v2_is_active_season`): read `bbj_v2_season_active` option first; if null/empty, look up the current season's `end_date` and compare to `time()`.

- [ ] **Step 1: Open HomeRoutes.php and locate `getHomepage()` method (around line 696)**

```powershell
Get-Content "C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\HomeRoutes.php" | Select-String -Pattern "function getHomepage|function getRecentComments|function getPosts" -List | Select-Object -First 10
```

- [ ] **Step 2: Add a private `getHousePulse()` method just above `getHomepage()`**

```php
/**
 * Hourly feed-update counts for the last $hours hours.
 * Returns ['active' => bool, 'buckets' => [...], 'total' => int].
 * Off-season → active=false, empty buckets.
 */
private function getHousePulse(int $hours = 8): array
{
    // Active-season gate (mirrors bbj_v2_is_active_season).
    $active = true;
    $override = get_option('bbj_v2_season_active', null);
    if ($override !== null && $override !== '') {
        $active = (bool) (int) $override;
    } else {
        $seasonId = (int) get_option('bbj_v2_current_season', 0);
        if ($seasonId > 0 && function_exists('bbj_v2_get_season_by_id')) {
            $season = bbj_v2_get_season_by_id($seasonId);
            $end = $season['end_date'] ?? '';
            if ($end !== '') {
                $endTs = strtotime($end);
                if ($endTs !== false && $endTs < time()) {
                    $active = false;
                }
            }
        }
    }

    if (!$active) {
        return ['active' => false, 'buckets' => [], 'total' => 0];
    }

    global $wpdb;
    $rows = $wpdb->get_results($wpdb->prepare(
        "SELECT HOUR(post_date) AS h, COUNT(*) AS c
         FROM {$wpdb->posts}
         WHERE post_type = 'live-feed-updates'
           AND post_status = 'publish'
           AND post_date >= DATE_SUB(NOW(), INTERVAL %d HOUR)
         GROUP BY HOUR(post_date)",
        $hours
    ), ARRAY_A);

    $counts = [];
    foreach ($rows as $r) {
        $counts[(int) $r['h']] = (int) $r['c'];
    }

    $buckets = [];
    $total = 0;
    for ($i = $hours - 1; $i >= 0; $i--) {
        $ts    = strtotime("-{$i} hour");
        $hour  = (int) date('H', $ts);
        $count = $counts[$hour] ?? 0;
        $total += $count;
        $buckets[] = [
            'hour'  => $hour,
            'label' => date('ga', $ts),
            'count' => $count,
        ];
    }

    return ['active' => true, 'buckets' => $buckets, 'total' => $total];
}
```

- [ ] **Step 3: Verify the file is syntactically valid**

```powershell
& "C:\xampp\php\php.exe" -l "C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\HomeRoutes.php"
```

Expected: `No syntax errors detected in ...`

- [ ] **Step 4: Commit**

```powershell
cd C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data
git add src/Api/HomeRoutes.php
git commit -m "feat(api): add getHousePulse() returning 8h feed-update buckets"
cd C:\xampp\htdocs\bbj-app
```

---

## Task 3: Add `getCurrentSeason()` to the WP plugin

**Why:** Powers the StatusStrip H1 ("Big Brother N Spoilers").

**Files:**
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\HomeRoutes.php`

- [ ] **Step 1: Add `getCurrentSeason()` private method directly under `getHousePulse()`**

```php
/**
 * Current season info for the homepage status-strip H1.
 * Returns ['number' => int, 'full_name' => string]. Both empty when no season set.
 */
private function getCurrentSeason(): array
{
    $seasonId = (int) get_option('bbj_v2_current_season', 0);
    if ($seasonId <= 0 || !function_exists('bbj_v2_get_season_by_id')) {
        return ['number' => 0, 'full_name' => ''];
    }

    $season = bbj_v2_get_season_by_id($seasonId);
    $number = (int) ($season['season_number'] ?? 0);
    $name   = trim((string) ($season['full_name'] ?? ''));
    if ($name === '' && $number > 0) {
        $name = 'Big Brother ' . $number;
    }

    return ['number' => $number, 'full_name' => $name];
}
```

- [ ] **Step 2: Lint PHP**

```powershell
& "C:\xampp\php\php.exe" -l "C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\HomeRoutes.php"
```

Expected: `No syntax errors detected`.

- [ ] **Step 3: Commit**

```powershell
cd C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data
git add src/Api/HomeRoutes.php
git commit -m "feat(api): add getCurrentSeason() for homepage H1"
cd C:\xampp\htdocs\bbj-app
```

---

## Task 4: Extend `getHomepage()` to include the new fields

**Files:**
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\HomeRoutes.php`

- [ ] **Step 1: Update the `$result` array in `getHomepage()` (around line 723)**

Find the existing block:

```php
$result = [
    'hero' => $this->getHeroPost(),
    'feedUpdates' => $this->getFeedUpdates($feedRequest),
    'houseboard' => $this->getHouseboard(),
    'seasonStats' => $this->getSeasonStats(),
    'recentComments' => $this->getRecentComments($commentsRequest),
    'posts' => $this->getPosts($postsRequest),
];
```

Replace with:

```php
$result = [
    'hero' => $this->getHeroPost(),
    'feedUpdates' => $this->getFeedUpdates($feedRequest),
    'houseboard' => $this->getHouseboard(),
    'seasonStats' => $this->getSeasonStats(),
    'recentComments' => $this->getRecentComments($commentsRequest),
    'posts' => $this->getPosts($postsRequest),
    'housePulse' => $this->getHousePulse(8),
    'currentSeason' => $this->getCurrentSeason(),
];
```

- [ ] **Step 2: Lint**

```powershell
& "C:\xampp\php\php.exe" -l "C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\HomeRoutes.php"
```

- [ ] **Step 3: Hit the endpoint and verify the new keys**

Open `http://bbj.localhost/wp-json/bbjd/v1/homepage` in a browser, or:

```powershell
Invoke-RestMethod http://bbj.localhost/wp-json/bbjd/v1/homepage | Select-Object -Property housePulse, currentSeason | ConvertTo-Json -Depth 5
```

Expected output:
```json
{
  "housePulse": { "active": true|false, "buckets": [...8 entries], "total": <int> },
  "currentSeason": { "number": <int>, "full_name": "Big Brother N" }
}
```

If you see `null` for either field, restart Apache and clear the WP transient (the existing 60s transient may have a cached payload without the new keys):

```powershell
# In a browser at /wp-admin, deactivate/reactivate the bigbrotherjunkies-data plugin OR run:
# wp transient delete bbjd_homepage_combined  (if WP-CLI available)
```

- [ ] **Step 4: Commit**

```powershell
cd C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data
git add src/Api/HomeRoutes.php
git commit -m "feat(api): include housePulse and currentSeason in /homepage payload"
cd C:\xampp\htdocs\bbj-app
```

---

## Task 5: Extend `home.js` to receive new fields

**Files:**
- Modify: `src/lib/api/home.js`

- [ ] **Step 1: Update `DEFAULTS` and the destructure in `getHomepageData()`**

Open `src/lib/api/home.js`. Replace the `DEFAULTS` object:

```js
const DEFAULTS = {
  hero: { post: null, season: null },
  feedUpdates: { updates: [], total: 0 },
  houseboard: { season: null, houseboard: { hoh: [], pov: [], nominees: [], have_nots: [] } },
  seasonStats: { season: null, players: [] },
  recentComments: { comments: [], total: 0 },
  posts: { posts: [] },
  housePulse: { active: false, buckets: [], total: 0 },
  currentSeason: { number: 0, full_name: "" },
};
```

In `getHomepageData()`, update the return block:

```js
return {
  hero: data.hero || DEFAULTS.hero,
  feedUpdates: data.feedUpdates || DEFAULTS.feedUpdates,
  houseboard: data.houseboard || DEFAULTS.houseboard,
  seasonStats: data.seasonStats || DEFAULTS.seasonStats,
  recentComments: data.recentComments || DEFAULTS.recentComments,
  posts: data.posts || DEFAULTS.posts,
  housePulse: data.housePulse || DEFAULTS.housePulse,
  currentSeason: data.currentSeason || DEFAULTS.currentSeason,
};
```

- [ ] **Step 2: Lint**

```powershell
npm run lint
```

Expected: no new errors.

- [ ] **Step 3: Verify in dev server**

Reload `http://localhost:3000`. The page should still render normally (we haven't used the new fields yet, just plumbed them through).

- [ ] **Step 4: Commit**

```powershell
git add src/lib/api/home.js
git commit -m "feat(home): plumb housePulse and currentSeason through getHomepageData"
```

---

## Task 6: Build StatusStrip component

**Files:**
- Create: `src/components/home/StatusStrip.jsx`

The H1 + scrolling ticker that sits above main. Server component.

- [ ] **Step 1: Create the file with this content**

```jsx
import Link from "next/link";

/**
 * Page-defining H1 + horizontal ticker of latest feed-update headlines.
 * Hidden ticker on small screens; H1 always renders.
 */
export function StatusStrip({ season, tickerItems = [] }) {
  const heading = season?.full_name
    ? `${season.full_name} Spoilers`
    : "Spoilers";

  // Render the headline list TWICE so the marquee loops seamlessly.
  const doubled = [...tickerItems, ...tickerItems];

  return (
    <section
      className="bbj-status-strip"
      aria-label="Page header"
    >
      <div className="mx-auto max-w-screen-xl px-4 py-3 flex items-center gap-6">
        <h1 className="font-display text-xl md:text-2xl font-bold text-white shrink-0 m-0 leading-none">
          <Link
            href="/category/spoilers/"
            className="no-underline text-white hover:text-secondary-500"
          >
            {heading}
          </Link>
        </h1>

        {tickerItems.length > 0 && (
          <div className="bbj-ticker hidden md:block" aria-label="Latest feed updates">
            <div className="bbj-ticker-track font-osw uppercase tracking-wider text-xs text-gray-300">
              {doubled.map((item, idx) => (
                <Link
                  key={`${item.id}-${idx}`}
                  href={item.permalink}
                  className="inline-flex items-center gap-2 px-4 no-underline text-gray-200 hover:text-secondary-500"
                  aria-hidden={idx >= tickerItems.length}
                  tabIndex={idx >= tickerItems.length ? -1 : 0}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-accent-red shrink-0"
                    aria-hidden="true"
                  />
                  <span>{item.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Lint**

```powershell
npm run lint
```

- [ ] **Step 3: Commit**

```powershell
git add src/components/home/StatusStrip.jsx
git commit -m "feat(home): add StatusStrip component (page H1 + ticker)"
```

---

## Task 7: Build HouseStrip component

**Files:**
- Create: `src/components/home/HouseStrip.jsx`

Horizontal compact replacement for the sidebar Houseboard. Same data shape (`{ hoh, pov, nominees, have_nots }` from `data.houseboard.houseboard`).

- [ ] **Step 1: Create the file**

```jsx
import Image from "next/image";
import Link from "next/link";

const GROUPS = [
  { key: "hoh", label: "HOH", bg: "bg-emerald-600" },
  { key: "pov", label: "VETO", bg: "bg-orange-500" },
  { key: "nominees", label: "NOMS", bg: "bg-red-600" },
  { key: "have_nots", label: "HAVE-NOTS", bg: "bg-purple-600" },
];

export function HouseStrip({ houseboard, season }) {
  const seasonLabel = season?.name || "Big Brother";

  return (
    <section className="bbj-card bbj-house-strip">
      <div className="flex items-center gap-6 flex-wrap">
        <div
          className="leading-tight pr-6 border-r shrink-0 border-gray-200 dark:border-gray-700"
        >
          <div className="font-osw uppercase tracking-wider text-sm text-primary-500 dark:text-secondary-500">
            The House
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {seasonLabel}
          </div>
        </div>

        <div className="flex justify-around flex-grow gap-4 flex-wrap">
          {GROUPS.map(({ key, label, bg }) => (
            <HouseGroup
              key={key}
              players={houseboard?.[key] || []}
              label={label}
              bg={bg}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function HouseGroup({ players, label, bg }) {
  const isEmpty = players.length === 0;
  const names = players.map((p) => p.name).filter(Boolean).join(" · ");

  return (
    <div className="flex items-center gap-3 shrink-0">
      <div className="flex -space-x-2">
        {isEmpty ? (
          <span
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 font-osw text-base"
            aria-hidden="true"
          >
            —
          </span>
        ) : (
          players.map((p) => (
            <Link
              key={p.id}
              href={p.permalink || "#"}
              aria-label={p.name}
              className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-white font-osw font-semibold text-sm border-2 border-white dark:border-gray-800 overflow-hidden no-underline ${bg}`}
            >
              {p.image ? (
                <Image
                  src={p.image}
                  alt=""
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <span>{(p.name || "").charAt(0).toUpperCase()}</span>
              )}
            </Link>
          ))
        )}
      </div>
      <div className="leading-tight">
        <div className="text-[10px] font-osw uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {label}
        </div>
        <div
          className={`text-sm font-semibold ${
            isEmpty
              ? "text-gray-400 dark:text-gray-500"
              : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {isEmpty ? "TBD" : names}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Lint**

```powershell
npm run lint
```

- [ ] **Step 3: Commit**

```powershell
git add src/components/home/HouseStrip.jsx
git commit -m "feat(home): add HouseStrip — horizontal HOH/Veto/Noms/Have-Nots strip"
```

---

## Task 8: Build HousePulse component

**Files:**
- Create: `src/components/home/HousePulse.jsx`

Server-rendered 8-bar chart of feed-updates/hour. Returns null when off-season.

- [ ] **Step 1: Create the file**

```jsx
function colorForRatio(ratio) {
  if (ratio === 0) return "bg-gray-200 dark:bg-gray-700";
  if (ratio <= 0.2) return "bg-amber-200";
  if (ratio <= 0.5) return "bg-amber-400";
  if (ratio <= 0.8) return "bg-red-400";
  return "bg-red-600";
}

export function HousePulse({ housePulse }) {
  if (!housePulse?.active) return null;

  const { buckets = [], total = 0 } = housePulse;
  if (buckets.length === 0) return null;

  const max = Math.max(...buckets.map((b) => b.count), 0);

  return (
    <section
      id="house-pulse"
      className="bbj-card bbj-house-pulse"
      aria-label="Feed activity last 8 hours"
    >
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="font-osw text-lg md:text-xl uppercase tracking-wide text-primary-500 dark:text-secondary-500 m-0">
          House Pulse
        </h2>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-osw uppercase tracking-wider">
          Updates/hr · last 8 hours
        </span>
      </div>

      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Quiet house · no updates in the last 8 hours.
        </p>
      ) : (
        <>
          <div
            className="flex gap-1 items-end h-12"
            role="img"
            aria-label="Updates per hour, last 8 hours"
          >
            {buckets.map((b, i) => {
              const ratio = max > 0 ? b.count / max : 0;
              const heightPct = Math.max(10, Math.round(ratio * 100));
              return (
                <div
                  key={`${b.hour}-${i}`}
                  className={`flex-1 ${colorForRatio(ratio)} rounded-sm`}
                  style={{ height: `${heightPct}%` }}
                >
                  <span className="sr-only">
                    {b.count} updates at {b.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-1 mt-1 text-[10px] text-gray-500 dark:text-gray-400 font-osw uppercase tracking-wider">
            {buckets.map((b, i) => (
              <div key={`${b.hour}-label-${i}`} className="flex-1 text-center">
                {i % 2 === 0 ? b.label : " "}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Lint**

```powershell
npm run lint
```

- [ ] **Step 3: Commit**

```powershell
git add src/components/home/HousePulse.jsx
git commit -m "feat(home): add HousePulse — 8h feed-update activity bar chart"
```

---

## Task 9: Build ParamountPlusCard component

**Files:**
- Create: `src/components/sidebar/ParamountPlusCard.jsx`

Sidebar affiliate card. Server component.

- [ ] **Step 1: Create the directory and file**

```powershell
New-Item -ItemType Directory -Force -Path C:\xampp\htdocs\bbj-app\src\components\sidebar | Out-Null
```

Create `src/components/sidebar/ParamountPlusCard.jsx`:

```jsx
const PARAMOUNT_PLUS_URL =
  "https://paramountplus.qflm.net/c/161260/3116110/3065";

export function ParamountPlusCard() {
  return (
    <section className="bbj-sidebar-card">
      <div className="bg-primary-500 text-white p-4 rounded-md">
        <h2 className="font-display text-2xl mb-2">
          Watch Live on Paramount+
        </h2>
        <p className="text-sm opacity-90 mb-3">
          Stream the full BB live feeds and CBS episodes. 7-day free trial.
        </p>
        <a
          href={PARAMOUNT_PLUS_URL}
          target="_blank"
          rel="noopener sponsored"
          className="btn-secondary w-full text-center block"
        >
          Start free trial
        </a>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Lint**

```powershell
npm run lint
```

- [ ] **Step 3: Commit**

```powershell
git add src/components/sidebar/ParamountPlusCard.jsx
git commit -m "feat(sidebar): add ParamountPlusCard affiliate widget"
```

---

## Task 10: Build StickyAdSlot component

**Files:**
- Create: `src/components/sidebar/StickyAdSlot.jsx`

Sticky sidebar ad wrapper. Client component (uses existing `FreestarSlot` which is a client component).

- [ ] **Step 1: Read the existing FreestarSlot to confirm import path**

```powershell
Get-Content C:\xampp\htdocs\bbj-app\src\components\ads\FreestarSlot.jsx | Select-String -Pattern "export" -Context 0,1
```

- [ ] **Step 2: Create `src/components/sidebar/StickyAdSlot.jsx`**

```jsx
"use client";

import { FreestarSlot } from "../ads/FreestarSlot";

/**
 * Sticky sidebar ad wrapper.
 * Defaults to the homepage_sidebar_sticky placement; pass `placementName`
 * to override (e.g. on other pages with their own sticky slots).
 */
export function StickyAdSlot({ placementName = "bigbrotherjunkies_siderail_sticky" }) {
  return (
    <div className="lg:sticky lg:top-24">
      <FreestarSlot placementName={placementName} />
    </div>
  );
}
```

Note: `bigbrotherjunkies_siderail_sticky` is the placement name to register with Freestar / configure in the WP admin. If a slot by that exact name doesn't exist yet, the Freestar component will fail-soft (renders nothing).

- [ ] **Step 3: Lint**

```powershell
npm run lint
```

- [ ] **Step 4: Commit**

```powershell
git add src/components/sidebar/StickyAdSlot.jsx
git commit -m "feat(sidebar): add StickyAdSlot wrapper for sticky 300x600 placement"
```

---

## Task 11: Update Hero h1 → h2 ("Latest Update")

**Files:**
- Modify: `src/components/home/Hero.jsx`

**Why:** v2 hero-post.php uses `<h2>Latest Update</h2>` as a kicker, with the post title as `<h3>`. Page H1 lives in StatusStrip.

- [ ] **Step 1: Replace the existing `<h1>` (lines 10-19) with the v2 kicker pattern**

In `src/components/home/Hero.jsx`, find this block:

```jsx
{/* Section Header */}
<h1 className="font-display text-2xl text-primary-500 dark:text-primary-400 p-2">
  Latest{" "}
  {season?.permalink ? (
    <Link href={season.permalink} className="hover:underline">
      {season.name} Spoilers
    </Link>
  ) : (
    "Big Brother Spoilers"
  )}
</h1>
```

Replace it with:

```jsx
{/* Section Header */}
<div className="pb-3 mb-5 border-b border-gray-200 dark:border-gray-700 px-3 pt-3">
  <h2 className="font-osw text-lg md:text-xl uppercase tracking-wide text-primary-500 dark:text-secondary-500 m-0">
    Latest Update
  </h2>
</div>
```

(The existing `season` prop becomes unused — that's fine, leave it in the signature for backwards compat, the linter will not complain since it's destructured.)

- [ ] **Step 2: Demote the existing `<h2>` post title (line 65) to `<h3>`**

Find this block:

```jsx
<h2 className="font-display text-2xl md:text-4xl text-primary-500 dark:text-primary-400">
  <Link href={`/${post.slug}`} className="hover:underline">
    {post.title}
  </Link>
</h2>
```

Replace with:

```jsx
<h3 className="font-display text-2xl md:text-4xl text-primary-500 dark:text-primary-400">
  <Link href={`/${post.slug}`} className="hover:underline">
    {post.title}
  </Link>
</h3>
```

(Tag-only change — Tailwind classes stay identical.)

- [ ] **Step 3: Verify in dev server**

Reload `http://localhost:3000`. Right-click → Inspect, search the DOM for `h1`. Expected: zero `h1` on the home page (StatusStrip will provide the page H1 in Task 14; this is a known intermediate state).

- [ ] **Step 4: Lint**

```powershell
npm run lint
```

- [ ] **Step 5: Commit**

```powershell
git add src/components/home/Hero.jsx
git commit -m "refactor(home): demote Hero h1 to h2 'Latest Update' (v2 hierarchy)"
```

---

## Task 12: Refresh `SeasonStats` styling to match v2 sidebar card

**Files:**
- Modify: `src/components/home/HomeWidgets.jsx` (the `SeasonStats` export only)

**Scope of change:** Visual only. Data structure (full-cast H/V/N/VR/TD table) stays exactly as-is — that's user-confirmed in the spec.

- [ ] **Step 1: Open `src/components/home/HomeWidgets.jsx` and find the `SeasonStats` function**

Currently uses `v2-primary-container-inner p-4`. Update its outer wrapper to use `bbj-card bbj-sidebar-card` to match the v2 visual language.

Find:

```jsx
<section className="v2-primary-container-inner p-4" aria-labelledby="stats-title">
```

Replace with:

```jsx
<section className="bbj-card bbj-sidebar-card" aria-labelledby="stats-title">
```

Find the section heading inside SeasonStats:

```jsx
<h2 id="stats-title" className="v2-primary-subheader">
```

Replace with v2 sidebar header style:

```jsx
<h2 id="stats-title" className="font-osw text-lg md:text-xl uppercase tracking-wide text-primary-500 dark:text-secondary-500 m-0 pb-3 mb-5 border-b border-gray-200 dark:border-gray-700">
```

Leave the rest of the component (progress bar + table + legend) untouched.

- [ ] **Step 2: Verify in dev server**

Reload `http://localhost:3000`. The SeasonStats card should now have a top border under its heading and a tighter card outline. The data table inside is unchanged.

- [ ] **Step 3: Lint**

```powershell
npm run lint
```

- [ ] **Step 4: Commit**

```powershell
git add src/components/home/HomeWidgets.jsx
git commit -m "style(home): refresh SeasonStats card to match v2 sidebar visual language"
```

---

## Task 13: Modify `Sidebar.jsx` — strip wrappers, add anchored Paramount+ and StickyAdSlot

**Files:**
- Modify: `src/components/layout/Sidebar.jsx`

**What changes:**
- KEEP: Welcome widget (auth-aware, useful site-wide)
- ADD: `<ParamountPlusCard />` directly under the welcome widget
- KEEP: `{children}`
- REMOVE: Top FreestarSlot ad (replaced by Paramount+)
- REMOVE: `<SubscribeWidget />` call (moves into per-page children — Task 15 puts it back on non-home pages)
- REMOVE: "Hot Posts coming soon" placeholder (was a placeholder)
- REMOVE: Bottom FreestarSlot ad (replaced by StickyAdSlot)
- ADD: `<StickyAdSlot />` at the bottom

- [ ] **Step 1: Read the current Sidebar.jsx**

Already read in pre-flight; confirm with:

```powershell
Get-Content C:\xampp\htdocs\bbj-app\src\components\layout\Sidebar.jsx | Select-Object -First 130
```

- [ ] **Step 2: Update imports**

In `src/components/layout/Sidebar.jsx`, replace the existing imports block:

```jsx
import { FreestarSlot } from "../ads/FreestarSlot";
import { SubscribeWidget } from "../email/SubscribeWidget";
```

with:

```jsx
import { ParamountPlusCard } from "../sidebar/ParamountPlusCard";
import { StickyAdSlot } from "../sidebar/StickyAdSlot";
```

- [ ] **Step 3: Update the function signature and wrapper body**

Change the `Sidebar` function signature from:

```jsx
export function Sidebar({ showAds = true, sticky = true, children }) {
```

to (keep `showAds` for compatibility with other pages that pass it; it now only controls the StickyAdSlot):

```jsx
export function Sidebar({ showAds = true, sticky = true, children }) {
```

(Signature stays — the `showAds` prop is preserved for the 16 other pages that may pass it.)

- [ ] **Step 4: Replace the JSX body**

Find the `<aside>` block and replace its contents (KEEP the welcome widget block exactly as it is — that's the `loading ? skeleton : isAuthenticated ? logged-in : logged-out` ternary). Around the welcome widget, the body becomes:

```jsx
return (
  <aside
    className={`w-full lg:w-80 flex-shrink-0 lg:self-start ${sticky ? "lg:sticky lg:top-28" : ""} space-y-4`}
    aria-label="Sidebar"
  >
    {/* User Welcome Widget — UNCHANGED, keep the existing welcome ternary block here */}
    <div className="v2-sidebar-container p-4">
      {/* ... existing welcome widget content unchanged ... */}
    </div>

    {/* Paramount+ affiliate — replaces top ad */}
    <ParamountPlusCard />

    {/* Page-specific children */}
    {children}

    {/* Sticky bottom ad — replaces bottom FreestarSlot */}
    {showAds && <StickyAdSlot />}
  </aside>
);
```

(Be careful: copy the existing welcome widget JSX verbatim into the comment-marked spot — it has auth state, image fallback, login/register buttons. Don't paraphrase.)

- [ ] **Step 5: Verify in dev server**

Reload `http://localhost:3000`. Expected:
- Welcome widget still at the top of the sidebar (login/logout works as before)
- Paramount+ card directly below welcome
- The home page's existing sidebar children (Houseboard, SocialFollow, WatchLiveFeeds, SeasonStats, RecentComments) still render in the middle for now (we update page.jsx in Task 14)
- Sticky ad slot at the bottom (may render empty — Freestar slot may not be configured yet, that's fine)
- "Hot Posts coming soon" gone

- [ ] **Step 6: Lint**

```powershell
npm run lint
```

- [ ] **Step 7: Commit**

```powershell
git add src/components/layout/Sidebar.jsx
git commit -m "refactor(sidebar): strip top-ad/SubscribeWidget/hot-posts wrappers; anchor Paramount+ + StickyAdSlot"
```

---

## Task 14: Update `page.jsx` to v2 layout

**Files:**
- Modify: `src/app/page.jsx`

This is the orchestration step that wires everything together.

- [ ] **Step 1: Update imports**

Replace the existing import block at the top of `src/app/page.jsx`:

```jsx
import { Sidebar } from "@/components/layout/Sidebar";
import { FreestarSlot } from "@/components/ads/FreestarSlot";
import { SpoilerBarWrapper } from "@/components/spoiler-bar/SpoilerBarWrapper";
import { getHomepageData } from "@/lib/api/home";
import {
  Hero,
  FeedUpdatesSection,
  MoreStories,
  SocialFollow,
  Houseboard,
  WatchLiveFeeds,
  SeasonStats,
  RecentComments,
} from "@/components/home";
```

with:

```jsx
import { Sidebar } from "@/components/layout/Sidebar";
import { FreestarSlot } from "@/components/ads/FreestarSlot";
import { SpoilerBarWrapper } from "@/components/spoiler-bar/SpoilerBarWrapper";
import { SubscribeWidget } from "@/components/email/SubscribeWidget";
import { getHomepageData } from "@/lib/api/home";
import {
  Hero,
  FeedUpdatesSection,
  MoreStories,
  SeasonStats,
  RecentComments,
  StatusStrip,
  HouseStrip,
  HousePulse,
} from "@/components/home";
```

(Ensure `StatusStrip`, `HouseStrip`, `HousePulse` are exported from `src/components/home/index.js` — Task 16 covers that.)

- [ ] **Step 2: Replace the page body**

Replace the JSX returned from `HomePage()` with:

```jsx
return (
  <>
    <SpoilerBarWrapper />
    <StatusStrip
      season={data.currentSeason}
      tickerItems={(data.feedUpdates.updates || []).slice(0, 3).map((u) => ({
        id: u.id,
        title: u.title,
        permalink: u.permalink || `/live-feed-updates/${u.slug}`,
      }))}
    />
    <main className="v2-primary-container">
      {isStaging && (
        <div className="mb-4 rounded-lg border border-secondary-500/30 bg-secondary-500/10 px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
          <strong className="text-secondary-600 dark:text-secondary-400">Heads up!</strong>{" "}
          This is the staging server, so things may load slower than the real site. If something seems off, try refreshing a couple times to clear stale data. Performance won't be an issue on the live site.
        </div>
      )}
      <div className="flex w-full flex-col lg:flex-row lg:gap-4 dark:text-gray-200">
        <section id="main-left" className="flex-grow space-y-4">
          {data.hero.post && (
            <Hero post={data.hero.post} season={data.hero.season} />
          )}

          <HouseStrip
            houseboard={data.houseboard.houseboard}
            season={data.houseboard.season}
          />

          <HousePulse housePulse={data.housePulse} />

          <FreestarSlot placementName="bigbrotherjunkies_incontent_reusable" />

          <FeedUpdatesSection updates={data.feedUpdates.updates} />

          <FreestarSlot placementName="bigbrotherjunkies_incontent_reusable_Homepage2" />

          <MoreStories posts={data.posts.posts || []} heroId={data.hero.post?.id} />
        </section>

        <Sidebar sticky={false}>
          <SeasonStats
            season={data.seasonStats.season}
            players={data.seasonStats.players}
          />
          <SubscribeWidget />
          <RecentComments comments={data.recentComments.comments} />
        </Sidebar>
      </div>
    </main>
  </>
);
```

- [ ] **Step 3: Verify in dev server**

Reload `http://localhost:3000`. Expected layout (top to bottom):
1. SpoilerBarWrapper
2. StatusStrip with H1 "Big Brother N Spoilers" + ticker (only visible if there are recent feed updates)
3. Main column: Hero ("Latest Update" h2) → HouseStrip → HousePulse (or hidden if off-season) → ad → Feed updates → ad → More stories
4. Sidebar: Welcome → Paramount+ → SeasonStats → SubscribeWidget → RecentComments → StickyAdSlot

Inspect the DOM and confirm there's exactly ONE `<h1>` (the StatusStrip one).

- [ ] **Step 4: Lint**

```powershell
npm run lint
```

- [ ] **Step 5: Build**

```powershell
npm run build
```

Expected: build succeeds. Watch for warnings about missing exports — if Task 16's index.js update is needed first, do it now.

- [ ] **Step 6: Commit**

```powershell
git add src/app/page.jsx
git commit -m "feat(home): wire v2 layout — StatusStrip, HouseStrip, HousePulse, restructured sidebar"
```

---

## Task 15: Re-add `SubscribeWidget` to non-home pages that use `Sidebar`

**Files (16 total):**
- Modify each of the following — add `<SubscribeWidget />` as the LAST `<Sidebar>` child OR a sensible position:
  - `src/app/[slug]/page.jsx`
  - `src/app/category/[...slug]/page.jsx`
  - `src/app/bigbrother-seasons/[slug]/page.jsx`
  - `src/app/bigbrother-seasons/[slug]/edit/page.jsx`
  - `src/app/users/[username]/page.jsx`
  - `src/app/users/[username]/loading.jsx`
  - `src/app/bigbrother-players/[slug]/page.jsx`
  - `src/app/bigbrother-players/[slug]/edit/page.jsx`
  - `src/app/directory/page.jsx`
  - `src/app/tag/[slug]/page.jsx`
  - `src/app/privacy-policy/page.jsx`
  - `src/app/preview/[postId]/page.jsx`
  - `src/app/live-feed-updates/[slug]/page.jsx`
  - `src/app/live-feed-updates/page.jsx`
  - `src/app/compare/page.jsx`
  - `src/components/layout/PageLayout.jsx`

**Why:** Task 13 removed the SubscribeWidget call from inside Sidebar.jsx. Each of these pages needs it added back into their `<Sidebar>...children...</Sidebar>` block to preserve the existing newsletter UX.

- [ ] **Step 1: Skim each page to see its current Sidebar usage**

```powershell
$files = @(
  "src/app/[slug]/page.jsx",
  "src/app/category/[...slug]/page.jsx",
  "src/app/bigbrother-seasons/[slug]/page.jsx",
  "src/app/bigbrother-seasons/[slug]/edit/page.jsx",
  "src/app/users/[username]/page.jsx",
  "src/app/users/[username]/loading.jsx",
  "src/app/bigbrother-players/[slug]/page.jsx",
  "src/app/bigbrother-players/[slug]/edit/page.jsx",
  "src/app/directory/page.jsx",
  "src/app/tag/[slug]/page.jsx",
  "src/app/privacy-policy/page.jsx",
  "src/app/preview/[postId]/page.jsx",
  "src/app/live-feed-updates/[slug]/page.jsx",
  "src/app/live-feed-updates/page.jsx",
  "src/app/compare/page.jsx",
  "src/components/layout/PageLayout.jsx"
)
foreach ($f in $files) {
  Write-Host "=== $f ==="
  Get-Content $f | Select-String -Pattern "<Sidebar|</Sidebar" -Context 1,3
}
```

This shows each Sidebar usage and what's already in its children.

- [ ] **Step 2: For each file, add `import { SubscribeWidget } from "@/components/email/SubscribeWidget";` to the imports**

- [ ] **Step 3: For each file, insert `<SubscribeWidget />` immediately before `</Sidebar>`**

For most pages with `<Sidebar />` (self-closing, no children), convert to:

```jsx
<Sidebar>
  <SubscribeWidget />
</Sidebar>
```

For pages that already have children passed to Sidebar, append `<SubscribeWidget />` as the last child.

- [ ] **Step 4: Lint**

```powershell
npm run lint
```

- [ ] **Step 5: Build**

```powershell
npm run build
```

Expected: build succeeds. If any page fails, fix it before proceeding.

- [ ] **Step 6: Click through 3 pages in dev server to confirm sidebars still show newsletter**

Visit:
- A blog post: `http://localhost:3000/<any-recent-post-slug>`
- A player page: `http://localhost:3000/bigbrother-players/<any-player-slug>`
- The privacy policy: `http://localhost:3000/privacy-policy`

Each should show: Welcome → Paramount+ → (page-specific content) → SubscribeWidget (if you added it) → StickyAdSlot.

- [ ] **Step 7: Commit**

```powershell
git add src/app src/components/layout/PageLayout.jsx
git commit -m "refactor(sidebar): explicitly include SubscribeWidget per page after Sidebar restructure"
```

---

## Task 16: Update `home/index.js` exports + clean up unused widgets

**Files:**
- Modify: `src/components/home/index.js`
- Conditionally modify: `src/components/home/HomeWidgets.jsx` (remove `SocialFollow`, `WatchLiveFeeds`, `Houseboard` if no remaining consumers)

- [ ] **Step 1: Add new exports to `src/components/home/index.js`**

Append to the file (or replace the existing exports block):

```js
export { Hero } from "./Hero";
export { FeedUpdateCard } from "./FeedUpdateCard";
export { FeedUpdatesSection } from "./FeedUpdatesSection";
export { MoreStories } from "./MoreStories";
export { StatusStrip } from "./StatusStrip";
export { HouseStrip } from "./HouseStrip";
export { HousePulse } from "./HousePulse";
export {
  SeasonStats,
  RecentComments,
} from "./HomeWidgets";
```

(Note: `SocialFollow`, `WatchLiveFeeds`, `Houseboard` removed from the exports.)

- [ ] **Step 2: Grep for any remaining consumers of the dropped widgets**

```powershell
Get-ChildItem -Recurse -Path C:\xampp\htdocs\bbj-app\src -Include *.jsx,*.js | Select-String -Pattern "SocialFollow|WatchLiveFeeds|Houseboard" | Where-Object { $_.Path -notmatch "HomeWidgets.jsx" }
```

- [ ] **Step 3: If no consumers, delete the function bodies from `HomeWidgets.jsx`**

If the grep returns zero hits, open `src/components/home/HomeWidgets.jsx` and delete the `SocialFollow`, `WatchLiveFeeds`, and `Houseboard` (and `HouseboardCard`) function definitions. Keep `SeasonStats`, `RecentComments`, and `PlayerStatsRow`.

If any consumers remain (e.g., a non-home page using `Houseboard`), leave the functions in place but don't re-export them from `index.js` — direct importers can import them from `./HomeWidgets`.

- [ ] **Step 4: Build**

```powershell
npm run build
```

Expected: build succeeds with no missing-export errors.

- [ ] **Step 5: Commit**

```powershell
git add src/components/home/index.js src/components/home/HomeWidgets.jsx
git commit -m "refactor(home): export new components, drop unused SocialFollow/WatchLiveFeeds/Houseboard"
```

---

## Task 17: Final integration check on local dev

- [ ] **Step 1: Force a fresh page load**

In the dev server browser tab, hard-reload `http://localhost:3000` (Ctrl+Shift+R).

- [ ] **Step 2: Visual checklist (top to bottom)**

Confirm each of these renders correctly:
- [ ] SpoilerBarWrapper at the very top
- [ ] StatusStrip dark navy band with `<h1>` linking to `/category/spoilers/`
- [ ] StatusStrip ticker visible at md+ breakpoints, hidden on small (use DevTools responsive mode to test)
- [ ] Hero card with "Latest Update" `<h2>` kicker, post title is `<h3>`
- [ ] HouseStrip: 4 groups (HOH/VETO/NOMS/HAVE-NOTS) with avatars or "TBD"
- [ ] HousePulse: bar chart visible if season is active, hidden if not
- [ ] Two ads in the main column
- [ ] Feed updates section
- [ ] More stories section
- [ ] Sidebar: Welcome → Paramount+ → SeasonStats → SubscribeWidget → RecentComments → StickyAdSlot

- [ ] **Step 3: SEO check**

In DevTools Console:

```js
document.querySelectorAll("h1").length
```

Expected: `1`. (Only the StatusStrip H1.)

- [ ] **Step 4: Mobile check**

DevTools → Responsive mode → 375px width. Confirm:
- StatusStrip ticker hidden, H1 still visible
- Layout collapses to single column
- StickyAdSlot loses its sticky positioning (`lg:sticky` only applies at lg+)

- [ ] **Step 5: Network check**

DevTools Network tab → reload page. Confirm exactly **one** server fetch goes to `/bbjd/v1/homepage` (or however many your existing render makes — the count should match what was happening before this PR; this work should not increase the fetch count).

- [ ] **Step 6: Build**

```powershell
npm run build
```

Expected: clean build, no errors.

- [ ] **Step 7: Lint**

```powershell
npm run lint
```

- [ ] **Step 8: Commit any cleanup discovered during the visual pass**

If anything needed fixing (typos, missing class, etc.):

```powershell
git add -A
git commit -m "fix(home): post-integration polish from visual check"
```

---

## Task 18: Deploy to staging via `/full-push`

**Default per CLAUDE.md is staging.** Production deploy is a follow-up after staging validation.

- [ ] **Step 1: Check git status one more time**

```powershell
git status
git log --oneline staging ^origin/staging
```

You should see all the Task commits ready to push.

- [ ] **Step 2: Run `/full-push` skill (or its underlying script)**

This pushes the bbj-app commits to staging AND deploys the WP plugin changes via SSH. See `/full-push` skill for the exact sequence.

- [ ] **Step 3: Smoke-test staging**

Visit the staging URL (`stg-bigbrotherjunkies.com` or whatever the current staging domain is — see `memory/project_vercel.md` for the Vercel project name `bbj-next`). Run the same visual checklist from Task 17, Step 2.

- [ ] **Step 4: Trigger a webhook to confirm ISR**

In WP admin on staging, edit a recent post or post a feed update. Wait ~5 seconds, reload the staging homepage. The new content should appear (proves the existing `feed-update` / `post` cache tags still revalidate the homepage with the new combined payload shape).

- [ ] **Step 5: Verify caching is unchanged**

Open the staging homepage in DevTools Network tab. Look for the page request response header `x-vercel-cache: HIT` (or MISS on first load, then HIT on subsequent). Confirm no `cache-control: no-store` or `force-dynamic` markers in the response.

- [ ] **Step 6: Done — write update notes**

If the user asks for staging notes, follow the "Write me some staging notes" pattern from `MEMORY.md` and save to `.claude/update-history/staging-update-2026-05-09.md`.

---

## Self-Review

**Spec coverage:**
- StatusStrip ✅ (Task 6)
- HouseStrip ✅ (Task 7)
- HousePulse ✅ (Task 8)
- ParamountPlusCard ✅ (Task 9)
- SubscribeWidget reuse ✅ (Tasks 14, 15)
- StickyAdSlot ✅ (Task 10)
- Hero h1→h2 ✅ (Task 11)
- SeasonStats refresh ✅ (Task 12)
- Sidebar.jsx restructure ✅ (Task 13)
- WP plugin extension (housePulse + currentSeason) ✅ (Tasks 2, 3, 4)
- home.js plumbing ✅ (Task 5)
- page.jsx wiring ✅ (Task 14)
- Other-page migration ✅ (Task 15)
- Cleanup of unused widgets ✅ (Task 16)
- Verification ✅ (Task 17)
- Staging deploy ✅ (Task 18)
- CSS port ✅ (Task 1)

**Caching guarantees:**
- No new ISR cache tags ✅
- No new server fetches per render ✅
- No `force-dynamic` ✅
- No `cookies()`/`headers()`/`draftMode()` in layout ✅
- One H1 per page ✅

**Type/name consistency:**
- `housePulse.active` / `housePulse.buckets` / `housePulse.total` used consistently across Tasks 2, 5, 8 ✅
- `currentSeason.number` / `currentSeason.full_name` used consistently across Tasks 3, 5, 6 ✅
- `tickerItems` shape `{ id, title, permalink }` from Task 14 matches what StatusStrip consumes in Task 6 ✅
- `houseboard.{hoh,pov,nominees,have_nots}` data shape unchanged from existing endpoint, used in HouseStrip (Task 7) ✅

No placeholders. No "TODO" or "fill in details". No "similar to Task N" without code.

---

## Execution

Plan complete and saved to `docs/superpowers/plans/2026-05-09-v2-homepage-match.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task with two-stage review between tasks. Best for keeping context clean across the 18 tasks.

2. **Inline Execution** — execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
