# Season Hub Page Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the season page into an SEO content hub with sticky jump nav, winner spotlight, eviction order, related articles, feed updates, FAQ with schema, and auto-linking in blog posts.

**Architecture:** Server-rendered page with all content in the DOM for Google. Two small client components (sticky jump nav, FAQ accordion). New API endpoints for posts-by-category and season description. Auto-linking utility runs server-side on blog post content.

**Tech Stack:** Next.js 15 App Router, React Server Components, WordPress REST API, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-04-04-season-hub-redesign.md`

---

## File Structure

### New Files (Frontend)
| File | Purpose |
|------|---------|
| `src/app/bigbrother-seasons/[slug]/components/SeasonJumpNav.jsx` | Client — sticky nav with scroll-spy |
| `src/app/bigbrother-seasons/[slug]/components/SeasonOverview.jsx` | Server — description paragraph with auto-fallback |
| `src/app/bigbrother-seasons/[slug]/components/WinnerSpotlight.jsx` | Server — winner/runner-up/AFP cards |
| `src/app/bigbrother-seasons/[slug]/components/EvictionOrder.jsx` | Server — eviction order table |
| `src/app/bigbrother-seasons/[slug]/components/SeasonArticles.jsx` | Server — related blog posts |
| `src/app/bigbrother-seasons/[slug]/components/SeasonFeedUpdates.jsx` | Server — recent feed updates |
| `src/app/bigbrother-seasons/[slug]/components/SeasonFAQ.jsx` | Client — collapsible FAQ accordion |
| `src/app/bigbrother-seasons/[slug]/components/SeasonFAQSchema.jsx` | Server — FAQPage JSON-LD |
| `src/lib/utils/autoLink.js` | Server utility — auto-link season mentions in HTML |

### Modified Files (Frontend)
| File | Change |
|------|--------|
| `src/app/bigbrother-seasons/[slug]/page.jsx` | Add new sections, fetch article/feed data, add jump nav |
| `src/app/bigbrother-seasons/[slug]/components/index.js` | Export new components |
| `src/app/bigbrother-seasons/[slug]/components/SeasonInfoSidebar.jsx` | Add "More Seasons" nav |
| `src/lib/api/seasons.js` | Add `getSeasonArticles()` function |
| `src/app/[slug]/page.jsx` | Apply `autoLinkEntities()` to post content |

### Modified Files (WordPress Plugin)
| File | Change |
|------|--------|
| `bigbrotherjunkies-data/src/Api/SeasonRoutes.php` | Add `description` field to formatSeason, add category lookup endpoint |

---

## Task 1: Add Season Description to Backend API

**Files:**
- Modify: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\SeasonRoutes.php`

- [ ] **Step 1: Add description field to formatSeasonFull**

In `SeasonRoutes.php`, find the `formatSeasonFull` method. Add `description` to the returned array by reading from post meta:

```php
// Inside formatSeasonFull, after other fields:
'description' => get_post_meta($post->ID, '_bbj_season_description', true) ?: '',
```

- [ ] **Step 2: Add category lookup to the season by-slug response**

In the `getSeasonBySlug` method, after fetching the season data, look up the matching blog category by slug and add it to the response:

```php
// After the season data is formatted, before returning the response:
$categoryTerm = get_term_by('slug', $slug, 'category');
$categoryId = $categoryTerm ? (int) $categoryTerm->term_id : null;
$articleCount = $categoryId ? (int) wp_count_posts_in_category($categoryId) : 0;

// Add to the response array:
'category_id' => $categoryId,
'article_count' => $articleCount,
```

Note: `wp_count_posts_in_category` may not exist. Use this instead:

```php
$articleCount = 0;
if ($categoryId) {
    $articleCount = (int) get_term($categoryId)->count;
}
```

- [ ] **Step 3: Add description to the updateSeason handler**

In the admin season update handler, accept and save the `description` field:

```php
if (isset($params['description'])) {
    update_post_meta($postId, '_bbj_season_description', sanitize_textarea_field($params['description']));
}
```

- [ ] **Step 4: Test the API response**

Run: `curl -s "https://bigbrotherjunkies.com/wp-json/bbjd/v1/seasons/by-slug/big-brother-27" | jq '.season.description, .category_id, .article_count'`

Expected: Empty string for description (not yet written), a category_id number, and an article count.

- [ ] **Step 5: Deploy plugin to staging and commit**

```bash
bash /c/xampp/htdocs/bbj-app/.claude/scripts/deploy-plugin.sh --staging
```

---

## Task 2: Season Overview Component

**Files:**
- Create: `src/app/bigbrother-seasons/[slug]/components/SeasonOverview.jsx`

- [ ] **Step 1: Create SeasonOverview component**

```jsx
/**
 * Season overview paragraph — editorial description with auto-generated fallback
 */
export function SeasonOverview({ season, playerCount }) {
  const description = season.description || generateFallback(season, playerCount);

  return (
    <section id="overview" className="v2-primary-container-inner p-4 rounded-lg">
      <h2 className="text-sm font-bold text-primary-500 uppercase tracking-wide mb-2">
        Season Overview
      </h2>
      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
        {description}
      </p>
    </section>
  );
}

function generateFallback(season, playerCount) {
  const start = season.start_date
    ? new Date(season.start_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "TBD";
  const end = season.end_date
    ? new Date(season.end_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "TBD";

  let text = `${season.name} premiered on ${start} with ${playerCount} houseguests.`;

  if (season.total_days > 0) {
    text += ` The season lasted ${season.total_days} days, concluding on ${end}.`;
  }

  if (season.winner) {
    text += ` ${season.winner.name} was crowned the winner`;
    if (season.runner_up) {
      text += `, defeating ${season.runner_up.name} in the final vote`;
    }
    text += ".";
  }

  if (season.afp) {
    text += ` ${season.afp.name} was named America's Favorite Player.`;
  }

  return text;
}
```

- [ ] **Step 2: Verify it renders**

Import in `page.jsx` (temporary) to confirm it renders with BB27 data. Check both the editorial (empty → fallback) and visual output.

- [ ] **Step 3: Commit**

```bash
git add src/app/bigbrother-seasons/\[slug\]/components/SeasonOverview.jsx
git commit -m "feat(season-hub): add SeasonOverview component with auto-fallback"
```

---

## Task 2.5: Add Description Textarea to Season Editor

**Files:**
- Modify: `src/app/bigbrother-seasons/[slug]/edit/components/BasicInfoSection.jsx`

- [ ] **Step 1: Add description textarea**

In `BasicInfoSection.jsx`, find the existing form fields. Add a description textarea after the season name/dates fields:

```jsx
{/* Season Description (for hub page) */}
<div className="space-y-1">
  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
    Season Description
  </label>
  <textarea
    value={form.description || ""}
    onChange={(e) => onChange({ ...form, description: e.target.value })}
    rows={3}
    placeholder="Write a summary of this season for the hub page. Leave blank for auto-generated."
    className="input w-full text-sm"
  />
  <p className="text-xs text-gray-400">
    Appears at the top of the season hub page. If blank, a summary is auto-generated from season data.
  </p>
</div>
```

- [ ] **Step 2: Verify the edit page saves and loads description**

Visit `/bigbrother-seasons/big-brother-27/edit`, type a description, save. Refresh — it should persist. Check the API response includes the `description` field.

- [ ] **Step 3: Commit**

```bash
git add src/app/bigbrother-seasons/\[slug\]/edit/components/BasicInfoSection.jsx
git commit -m "feat(season-hub): add description textarea to season editor"
```

---

## Task 3: Winner / AFP Spotlight Component

**Files:**
- Create: `src/app/bigbrother-seasons/[slug]/components/WinnerSpotlight.jsx`

- [ ] **Step 1: Create WinnerSpotlight component**

```jsx
import Image from "next/image";
import Link from "next/link";

/**
 * Winner, Runner-Up, and AFP spotlight cards
 * Only shown for completed seasons
 */
export function WinnerSpotlight({ season, players }) {
  if (season.status !== "completed") return null;

  const winner = players.find((p) => p.finish_place === 1);
  const runnerUp = players.find((p) => p.finish_place === 2);
  const afp = season.afp
    ? players.find((p) => p.player_id === season.afp.id || p.id === season.afp.id)
    : null;

  if (!winner) return null;

  const cards = [
    { player: winner, label: "Winner", gradient: "from-emerald-600 to-emerald-700", icon: "👑" },
    runnerUp && { player: runnerUp, label: "Runner-Up", gradient: "from-sky-500 to-sky-600", icon: null },
    afp && { player: afp, label: "America's Favorite", gradient: "from-pink-500 to-pink-600", icon: "⭐" },
  ].filter(Boolean);

  return (
    <section id="winners" className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {cards.map(({ player, label, gradient, icon }) => (
        <Link
          key={player.id}
          href={player.permalink || `/bigbrother-players/${player.slug || ""}`}
          className={`bg-gradient-to-br ${gradient} rounded-lg p-4 text-center text-white hover:opacity-90 transition`}
        >
          <div className="text-[10px] uppercase tracking-wide opacity-80">{label}</div>
          {player.photo ? (
            <Image
              src={player.photo}
              alt={player.name}
              width={56}
              height={56}
              className="rounded-full mx-auto mt-2 object-cover border-2 border-white/30"
            />
          ) : (
            <div className="w-14 h-14 rounded-full mx-auto mt-2 bg-white/20 flex items-center justify-center text-xl">
              {icon || "?"}
            </div>
          )}
          <div className="font-bold text-sm mt-2">{player.name}</div>
        </Link>
      ))}
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/bigbrother-seasons/\[slug\]/components/WinnerSpotlight.jsx
git commit -m "feat(season-hub): add WinnerSpotlight component"
```

---

## Task 4: Eviction Order Component

**Files:**
- Create: `src/app/bigbrother-seasons/[slug]/components/EvictionOrder.jsx`

- [ ] **Step 1: Create EvictionOrder component**

```jsx
import Image from "next/image";
import Link from "next/link";

/**
 * Eviction order table — shows houseguests in order of elimination
 */
export function EvictionOrder({ players, season }) {
  // Get all players who have a finish_place (evicted, jury, runner-up, winner)
  const ordered = players
    .filter((p) => p.finish_place !== null && p.finish_place !== undefined)
    .sort((a, b) => a.finish_place - b.finish_place);

  // Players still in the house (no finish_place) — for active seasons
  const stillPlaying = players.filter(
    (p) => p.finish_place === null || p.finish_place === undefined
  );

  if (ordered.length === 0 && stillPlaying.length === 0) return null;

  const seasonStart = season.start_date ? new Date(season.start_date) : null;

  return (
    <section id="eviction-order" className="v2-primary-container-inner p-4 rounded-lg">
      <h2 className="text-sm font-bold text-primary-500 uppercase tracking-wide mb-3">
        Eviction Order
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
              <th className="py-2 px-2 font-semibold text-gray-500 dark:text-gray-400 w-8">#</th>
              <th className="py-2 px-2 font-semibold text-gray-500 dark:text-gray-400">Houseguest</th>
              <th className="py-2 px-2 font-semibold text-gray-500 dark:text-gray-400 hidden sm:table-cell">Date</th>
              <th className="py-2 px-2 font-semibold text-gray-500 dark:text-gray-400 hidden sm:table-cell">Day</th>
              <th className="py-2 px-2 font-semibold text-gray-500 dark:text-gray-400">Place</th>
            </tr>
          </thead>
          <tbody>
            {/* Winner first (finish_place = 1) down to last evicted */}
            {ordered.map((player, idx) => {
              const evictedDate = player.evicted_date
                ? new Date(player.evicted_date)
                : null;
              const dayNum =
                evictedDate && seasonStart
                  ? Math.ceil((evictedDate - seasonStart) / (1000 * 60 * 60 * 24)) + 1
                  : null;

              const placeLabel = getPlaceLabel(player.finish_place, ordered.length);

              return (
                <tr
                  key={player.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition"
                >
                  <td className="py-2 px-2 text-gray-400 tabular-nums">{idx + 1}</td>
                  <td className="py-2 px-2">
                    <Link
                      href={player.permalink || "#"}
                      className="flex items-center gap-2 hover:text-primary-500 transition"
                    >
                      {player.photo && (
                        <Image
                          src={player.photo}
                          alt={player.name}
                          width={28}
                          height={28}
                          className={`rounded-full object-cover ${
                            player.game_status?.evicted ? "grayscale opacity-70" : ""
                          }`}
                        />
                      )}
                      <span className="font-medium">{player.name}</span>
                    </Link>
                  </td>
                  <td className="py-2 px-2 text-gray-500 hidden sm:table-cell">
                    {evictedDate
                      ? evictedDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      : "—"}
                  </td>
                  <td className="py-2 px-2 text-gray-500 hidden sm:table-cell tabular-nums">
                    {dayNum ? `Day ${dayNum}` : "—"}
                  </td>
                  <td className="py-2 px-2">
                    <span className={getPlaceColor(player.finish_place)}>
                      {placeLabel}
                    </span>
                  </td>
                </tr>
              );
            })}
            {/* Still playing — for active seasons */}
            {season.is_active &&
              stillPlaying.map((player) => (
                <tr
                  key={player.id}
                  className="border-b border-gray-100 dark:border-gray-800"
                >
                  <td className="py-2 px-2 text-gray-300">—</td>
                  <td className="py-2 px-2">
                    <Link
                      href={player.permalink || "#"}
                      className="flex items-center gap-2 hover:text-primary-500 transition"
                    >
                      {player.photo && (
                        <Image
                          src={player.photo}
                          alt={player.name}
                          width={28}
                          height={28}
                          className="rounded-full object-cover"
                        />
                      )}
                      <span className="font-medium">{player.name}</span>
                    </Link>
                  </td>
                  <td className="py-2 px-2 text-green-600 hidden sm:table-cell" colSpan={2}>
                    Still in the house
                  </td>
                  <td className="py-2 px-2 text-green-600">Active</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function getPlaceLabel(place, totalPlayers) {
  if (place === 1) return "Winner";
  if (place === 2) return "Runner-Up";
  const suffix = ["th", "st", "nd", "rd"];
  const v = place % 100;
  return `${place}${suffix[(v - 20) % 10] || suffix[v] || suffix[0]} Place`;
}

function getPlaceColor(place) {
  if (place === 1) return "text-emerald-600 font-semibold";
  if (place === 2) return "text-sky-500 font-medium";
  return "text-gray-500";
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/bigbrother-seasons/\[slug\]/components/EvictionOrder.jsx
git commit -m "feat(season-hub): add EvictionOrder table component"
```

---

## Task 5: Season Articles Component + API

**Files:**
- Create: `src/app/bigbrother-seasons/[slug]/components/SeasonArticles.jsx`
- Modify: `src/lib/api/seasons.js`

- [ ] **Step 1: Add getSeasonArticles to seasons.js**

```js
/**
 * Get blog posts for a season by category ID
 * Uses standard WP REST API to fetch posts by category
 * @param {number} categoryId - WordPress category term ID
 * @param {number} perPage - Number of posts to fetch (default 6)
 * @returns {Promise<Object>} { posts, total }
 */
export async function getSeasonArticles(categoryId, perPage = 6) {
  if (!categoryId) return { posts: [], total: 0 };

  try {
    const params = new URLSearchParams({
      categories: String(categoryId),
      per_page: String(perPage),
      _embed: "wp:featuredmedia",
      orderby: "date",
      order: "desc",
    });

    const response = await wpRestFetch(`/posts?${params.toString()}`, {
      tags: ["posts", `season-articles-${categoryId}`],
      revalidate: 3600,
    });

    // wpRestFetch returns the array directly, total comes from headers
    // but we won't have headers here, so we use the array length
    const posts = (Array.isArray(response) ? response : []).map((post) => ({
      id: post.id,
      title: post.title?.rendered || "",
      slug: post.slug,
      date: post.date,
      excerpt: post.excerpt?.rendered || "",
      comment_count: post.comment_count || 0,
      featured_image:
        post._embedded?.["wp:featuredmedia"]?.[0]?.media_details?.sizes?.thumbnail?.source_url ||
        post._embedded?.["wp:featuredmedia"]?.[0]?.source_url ||
        null,
    }));

    return { posts, total: posts.length };
  } catch (error) {
    console.error("Failed to fetch season articles:", error);
    return { posts: [], total: 0 };
  }
}
```

Also add the import for `wpRestFetch` at the top of `seasons.js`:

```js
import { bbjdFetch, wpRestFetch } from "./wordpress";
```

(Check that `wpRestFetch` is exported from `wordpress.js` — if not, use `wpFetch` with the full `/wp/v2/posts` path.)

- [ ] **Step 2: Create SeasonArticles component**

```jsx
import Image from "next/image";
import Link from "next/link";

/**
 * Related blog posts for a season
 */
export function SeasonArticles({ posts, totalCount, seasonSlug }) {
  if (!posts || posts.length === 0) return null;

  return (
    <section id="articles" className="v2-primary-container-inner p-4 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-primary-500 uppercase tracking-wide">
          Articles
        </h2>
        {totalCount > 0 && (
          <span className="text-xs text-gray-400">{totalCount} posts</span>
        )}
      </div>
      <div className="space-y-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/${post.slug}`}
            className="flex gap-3 p-2 -mx-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            <div className="w-20 h-14 bg-gray-100 dark:bg-gray-800 rounded flex-shrink-0 overflow-hidden">
              {post.featured_image ? (
                <Image
                  src={post.featured_image}
                  alt=""
                  width={80}
                  height={56}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">
                  {"📝"}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3
                className="text-sm font-medium line-clamp-2"
                dangerouslySetInnerHTML={{ __html: post.title }}
              />
              <p className="text-xs text-gray-400 mt-1">
                {new Date(post.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
                {post.comment_count > 0 && ` · ${post.comment_count} comments`}
              </p>
            </div>
          </Link>
        ))}
      </div>
      {totalCount > posts.length && (
        <div className="mt-3 text-center">
          <Link
            href={`/category/${seasonSlug}`}
            className="text-sm font-semibold text-primary-500 hover:text-primary-600 transition"
          >
            View all {totalCount} articles →
          </Link>
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/api/seasons.js src/app/bigbrother-seasons/\[slug\]/components/SeasonArticles.jsx
git commit -m "feat(season-hub): add SeasonArticles component and API"
```

---

## Task 6: Season Feed Updates Component

**Files:**
- Create: `src/app/bigbrother-seasons/[slug]/components/SeasonFeedUpdates.jsx`
- Modify: `src/lib/api/feed-updates.js` (if date-range filter doesn't exist)

- [ ] **Step 1: Check existing feed updates API**

Read `src/lib/api/feed-updates.js` to see if there's a way to fetch feed updates filtered by date range. The function `getFeedUpdatesByDate(date)` fetches a single day. We need recent feed updates for a season.

If no season-range function exists, use `bbjdFetch` directly:

```js
// In seasons.js or inline in the page
export async function getSeasonFeedUpdates(startDate, endDate, perPage = 5) {
  try {
    const params = new URLSearchParams({
      after: startDate,
      before: endDate,
      per_page: String(perPage),
    });
    return bbjdFetch(`/feed-updates?${params.toString()}`, {
      tags: ["feed-updates"],
      revalidate: 60,
    });
  } catch (error) {
    console.error("Failed to fetch season feed updates:", error);
    return { updates: [], total: 0 };
  }
}
```

- [ ] **Step 2: Create SeasonFeedUpdates component**

```jsx
import Link from "next/link";

/**
 * Recent live feed updates for a season
 */
export function SeasonFeedUpdates({ updates, seasonSlug }) {
  if (!updates || updates.length === 0) return null;

  return (
    <section id="feed-updates" className="v2-primary-container-inner p-4 rounded-lg">
      <h2 className="text-sm font-bold text-primary-500 uppercase tracking-wide mb-3">
        Live Feed Updates
      </h2>
      <div className="space-y-3">
        {updates.map((update) => (
          <Link
            key={update.id}
            href={`/feed-updates/${update.slug}`}
            className="block border-l-3 border-secondary-500 pl-3 py-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-r transition"
          >
            <div className="text-sm font-medium line-clamp-1">{update.title}</div>
            <div className="text-xs text-gray-400 mt-0.5">
              {update.date &&
                new Date(update.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              {update.time && ` · ${update.time}`}
            </div>
            {update.excerpt && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{update.excerpt}</p>
            )}
          </Link>
        ))}
      </div>
      <div className="mt-3 text-center">
        <Link
          href={`/feed-updates?season=${seasonSlug}`}
          className="text-sm font-semibold text-primary-500 hover:text-primary-600 transition"
        >
          View all feed updates →
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/bigbrother-seasons/\[slug\]/components/SeasonFeedUpdates.jsx src/lib/api/seasons.js
git commit -m "feat(season-hub): add SeasonFeedUpdates component"
```

---

## Task 7: FAQ Component + Schema

**Files:**
- Create: `src/app/bigbrother-seasons/[slug]/components/SeasonFAQ.jsx`
- Create: `src/app/bigbrother-seasons/[slug]/components/SeasonFAQSchema.jsx`

- [ ] **Step 1: Create SeasonFAQ client component**

```jsx
"use client";

import { useState } from "react";

/**
 * Collapsible FAQ accordion — auto-generated from season data
 */
export function SeasonFAQ({ questions }) {
  const [openIndex, setOpenIndex] = useState(null);

  if (!questions || questions.length === 0) return null;

  return (
    <section id="faq" className="v2-primary-container-inner p-4 rounded-lg">
      <h2 className="text-sm font-bold text-primary-500 uppercase tracking-wide mb-3">
        Frequently Asked Questions
      </h2>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {questions.map((q, i) => (
          <div key={i} className="py-3">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full text-left flex items-center justify-between gap-2"
            >
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {q.question}
              </span>
              <span className="text-gray-400 flex-shrink-0">
                {openIndex === i ? "▴" : "▾"}
              </span>
            </button>
            {openIndex === i && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                {q.answer}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create SeasonFAQSchema server component**

```jsx
/**
 * FAQPage JSON-LD schema for Google featured snippets
 */
export function SeasonFAQSchema({ questions }) {
  if (!questions || questions.length === 0) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
```

- [ ] **Step 3: Create FAQ question generator utility**

Add this to the page.jsx file or as a helper. It generates FAQ Q&A pairs from season data:

```js
function generateFAQs(season, players) {
  const faqs = [];
  const abbr = season.abbreviation || season.name;

  if (season.status === "completed") {
    if (season.winner) {
      faqs.push({
        question: `Who won ${season.name}?`,
        answer: `${season.winner.name} won ${season.name}${
          season.runner_up ? `, defeating ${season.runner_up.name} in the final jury vote` : ""
        }${season.end_date ? ` on ${new Date(season.end_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}.`,
      });
    }

    if (season.afp) {
      faqs.push({
        question: `Who was America's Favorite Player on ${abbr}?`,
        answer: `${season.afp.name} was voted America's Favorite Player on ${season.name}.`,
      });
    }
  }

  if (season.start_date && season.end_date) {
    const start = new Date(season.start_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const end = new Date(season.end_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    faqs.push({
      question: `When did ${season.name} air?`,
      answer: `${season.name} premiered on ${start} and concluded on ${end}, lasting ${season.total_days} days.`,
    });
  }

  if (players.length > 0) {
    faqs.push({
      question: `How many houseguests were on ${abbr}?`,
      answer: `${season.name} featured ${players.length} houseguests.`,
    });
  }

  // For upcoming seasons
  if (season.status === "upcoming") {
    if (season.start_date) {
      faqs.push({
        question: `When does ${season.name} start?`,
        answer: `${season.name} is scheduled to premiere on ${new Date(season.start_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`,
      });
    }
    faqs.push({
      question: `How to watch ${season.name}?`,
      answer: `${season.name} airs on CBS and is available for streaming on Paramount+. Live feeds are available through Paramount+ with the Live Feeds add-on.`,
    });
  }

  return faqs;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/bigbrother-seasons/\[slug\]/components/SeasonFAQ.jsx src/app/bigbrother-seasons/\[slug\]/components/SeasonFAQSchema.jsx
git commit -m "feat(season-hub): add FAQ accordion and FAQPage schema"
```

---

## Task 8: Sticky Jump Nav Component

**Files:**
- Create: `src/app/bigbrother-seasons/[slug]/components/SeasonJumpNav.jsx`

- [ ] **Step 1: Create SeasonJumpNav client component**

```jsx
"use client";

import { useState, useEffect } from "react";

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "winners", label: "Winners" },
  { id: "cast", label: "Cast" },
  { id: "eviction-order", label: "Eviction Order" },
  { id: "articles", label: "Articles" },
  { id: "feed-updates", label: "Feed Updates" },
  { id: "faq", label: "FAQ" },
];

/**
 * Sticky horizontal nav with scroll-spy — highlights active section
 */
export function SeasonJumpNav({ articleCount }) {
  const [activeId, setActiveId] = useState("overview");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0.1 }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  function scrollTo(id) {
    const el = document.getElementById(id);
    if (el) {
      const offset = 100; // account for sticky header + this nav
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }

  return (
    <nav className="sticky top-[64px] z-20 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 -mx-4 px-4 overflow-x-auto">
      <div className="flex gap-1 py-2 min-w-max">
        {SECTIONS.map(({ id, label }) => {
          const displayLabel =
            id === "articles" && articleCount
              ? `${label} (${articleCount})`
              : label;

          return (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition whitespace-nowrap ${
                activeId === id
                  ? "bg-primary-500 text-white"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {displayLabel}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/bigbrother-seasons/\[slug\]/components/SeasonJumpNav.jsx
git commit -m "feat(season-hub): add sticky SeasonJumpNav with scroll-spy"
```

---

## Task 9: More Seasons Nav in Sidebar

**Files:**
- Modify: `src/app/bigbrother-seasons/[slug]/components/SeasonInfoSidebar.jsx`

- [ ] **Step 1: Add More Seasons card to SeasonInfoSidebar**

At the bottom of the `SeasonInfoSidebar` component, after the leaderboards section, add:

```jsx
{/* More Seasons */}
<div className="v2-sidebar-container p-4">
  <h2 className="v2-ad-subheader">More Seasons</h2>
  <div className="flex items-center justify-between mt-3">
    {season.season_number > 1 && (
      <a
        href={`/bigbrother-seasons/big-brother-${season.season_number - 1}`}
        className="text-sm text-primary-500 hover:text-primary-600 transition"
      >
        ← BB{season.season_number - 1}
      </a>
    )}
    <span className="flex-1" />
    <a
      href={`/bigbrother-seasons/big-brother-${Number(season.season_number) + 1}`}
      className="text-sm text-primary-500 hover:text-primary-600 transition"
    >
      BB{Number(season.season_number) + 1} →
    </a>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/app/bigbrother-seasons/\[slug\]/components/SeasonInfoSidebar.jsx
git commit -m "feat(season-hub): add More Seasons nav to sidebar"
```

---

## Task 10: Wire Everything Into the Season Page

**Files:**
- Modify: `src/app/bigbrother-seasons/[slug]/page.jsx`
- Modify: `src/app/bigbrother-seasons/[slug]/components/index.js`

- [ ] **Step 1: Update the components index**

```js
export { SeasonHeader } from "./SeasonHeader";
export { PlayerGrid } from "./PlayerGrid";
export { LiveNowSection } from "./LiveNowSection";
export { Leaderboards } from "./Leaderboards";
export { SeasonJsonLd } from "./SeasonJsonLd";
export { SeasonInfoSidebar } from "./SeasonInfoSidebar";
export { SeasonJumpNav } from "./SeasonJumpNav";
export { SeasonOverview } from "./SeasonOverview";
export { WinnerSpotlight } from "./WinnerSpotlight";
export { EvictionOrder } from "./EvictionOrder";
export { SeasonArticles } from "./SeasonArticles";
export { SeasonFeedUpdates } from "./SeasonFeedUpdates";
export { SeasonFAQ } from "./SeasonFAQ";
export { SeasonFAQSchema } from "./SeasonFAQSchema";
```

- [ ] **Step 2: Rewrite page.jsx with all sections**

Replace the content of `src/app/bigbrother-seasons/[slug]/page.jsx` with the full hub layout:

```jsx
import { getSeasonBySlug, getSeasonArticles } from "@/lib/api/seasons";
import { notFound } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import {
  SeasonHeader,
  PlayerGrid,
  LiveNowSection,
  Leaderboards,
  SeasonJsonLd,
  SeasonInfoSidebar,
  SeasonJumpNav,
  SeasonOverview,
  WinnerSpotlight,
  EvictionOrder,
  SeasonArticles,
  SeasonFeedUpdates,
  SeasonFAQ,
  SeasonFAQSchema,
} from "./components";
import { bbjdFetch } from "@/lib/api/wordpress";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://bigbrotherjunkies.com";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { season } = await getSeasonBySlug(slug);

  if (!season) return { title: "Season Not Found" };

  const title = `${season.name} - Cast, Spoilers, Eviction Order | Big Brother Junkies`;
  const description = season.description ||
    `Complete guide to ${season.name}: cast, spoilers, eviction order, competition results, and live feed updates.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/bigbrother-seasons/${slug}`,
      type: "website",
      images: season.cover_image ? [{ url: season.cover_image, width: 1200, height: 630, alt: season.name }] : [],
    },
    twitter: { card: "summary_large_image", title, description, images: season.cover_image ? [season.cover_image] : [] },
    alternates: { canonical: `${SITE_URL}/bigbrother-seasons/${slug}` },
  };
}

export default async function SeasonPage({ params }) {
  const { slug } = await params;
  const { season, players, count } = await getSeasonBySlug(slug);

  if (!season) notFound();

  // Fetch related articles if category exists
  const { posts: articles, total: articleCount } = season.category_id
    ? await getSeasonArticles(season.category_id, 6)
    : { posts: [], total: season.article_count || 0 };

  // Fetch recent feed updates for the season
  let feedUpdates = [];
  if (season.start_date && season.end_date) {
    try {
      const feedParams = new URLSearchParams({
        after: season.start_date,
        before: season.end_date,
        per_page: "5",
      });
      const feedData = await bbjdFetch(`/feed-updates?${feedParams.toString()}`, {
        tags: ["feed-updates"],
        revalidate: 60,
      });
      feedUpdates = feedData.updates || feedData.feed_updates || [];
    } catch (e) {
      console.error("Failed to fetch season feed updates:", e);
    }
  }

  // Separate players by status
  const activePlayers = players.filter((p) => p.game_status && !p.game_status.evicted && !p.game_status.jury);
  const juryPlayers = players.filter((p) => p.game_status?.jury && !p.game_status?.evicted);
  const evictedPlayers = players.filter((p) => p.game_status?.evicted && !p.game_status?.jury);

  // Live now data
  const currentHoH = players.find((p) => p.game_status?.hoh);
  const currentPoV = players.find((p) => p.game_status?.pov);
  const nominees = players.filter((p) => p.game_status?.nom);

  // Leaderboard data
  const leaderboardStats = {
    hoh: [...players].filter((p) => p.stats.hoh > 0).sort((a, b) => b.stats.hoh - a.stats.hoh).slice(0, 5),
    pov: [...players].filter((p) => p.stats.pov > 0).sort((a, b) => b.stats.pov - a.stats.pov).slice(0, 5),
    nom: [...players].filter((p) => p.stats.nom > 0).sort((a, b) => b.stats.nom - a.stats.nom).slice(0, 5),
    votes: [...players].filter((p) => p.stats.votes_received > 0).sort((a, b) => b.stats.votes_received - a.stats.votes_received).slice(0, 5),
  };

  // Generate FAQ
  const faqs = generateFAQs(season, players);

  return (
    <>
      <SeasonJsonLd season={season} siteUrl={SITE_URL} />
      <SeasonFAQSchema questions={faqs} />

      <main className="v2-primary-container">
        <div className="flex w-full flex-col mb-4 xl:flex-row xl:gap-4 dark:text-gray-200">
          {/* Main Content */}
          <section id="main-left" className="flex-grow space-y-4">
            <article className="v2-primary-container-inner rounded-lg overflow-hidden">
              <SeasonHeader season={season} playerCount={count} slug={slug} />

              <div className="p-4 space-y-4">
                {/* Sticky Jump Nav */}
                <SeasonJumpNav articleCount={articleCount} />

                {/* 1. Season Overview */}
                <SeasonOverview season={season} playerCount={count} />

                {/* 2. Winner/AFP Spotlight */}
                <WinnerSpotlight season={season} players={players} />

                {/* 3. Live Now (active seasons only) */}
                {season.is_active && (
                  <LiveNowSection
                    hoh={currentHoH}
                    pov={currentPoV}
                    nominees={nominees}
                    juryCount={juryPlayers.length}
                    evictedCount={evictedPlayers.length}
                    season={season}
                  />
                )}

                {/* 4. Cast Grid */}
                <div id="cast">
                  <PlayerGrid players={players} seasonIsActive={season.is_active} />
                </div>

                {/* 5. Eviction Order */}
                <EvictionOrder players={players} season={season} />

                {/* Leaderboards (mobile/tablet only — desktop shows in sidebar) */}
                <div className="xl:hidden">
                  <Leaderboards stats={leaderboardStats} />
                </div>

                {/* 6. Related Articles */}
                <SeasonArticles
                  posts={articles}
                  totalCount={articleCount}
                  seasonSlug={slug}
                />

                {/* 7. Feed Updates */}
                <SeasonFeedUpdates updates={feedUpdates} seasonSlug={slug} />

                {/* 8. FAQ */}
                <SeasonFAQ questions={faqs} />
              </div>
            </article>
          </section>

          {/* Season Info Sidebar */}
          <SeasonInfoSidebar
            season={season}
            juryCount={juryPlayers.length}
            evictedCount={evictedPlayers.length}
            leaderboardStats={leaderboardStats}
          />

          {/* Site Sidebar */}
          <Sidebar />
        </div>
      </main>
    </>
  );
}

function generateFAQs(season, players) {
  const faqs = [];
  const abbr = season.abbreviation || season.name;

  if (season.status === "completed") {
    if (season.winner) {
      faqs.push({
        question: `Who won ${season.name}?`,
        answer: `${season.winner.name} won ${season.name}${season.runner_up ? `, defeating ${season.runner_up.name} in the final jury vote` : ""}${season.end_date ? ` on ${new Date(season.end_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}` : ""}.`,
      });
    }
    if (season.afp) {
      faqs.push({
        question: `Who was America's Favorite Player on ${abbr}?`,
        answer: `${season.afp.name} was voted America's Favorite Player on ${season.name}.`,
      });
    }
  }

  if (season.start_date && season.end_date) {
    const start = new Date(season.start_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    const end = new Date(season.end_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    faqs.push({
      question: `When did ${season.name} air?`,
      answer: `${season.name} premiered on ${start} and concluded on ${end}, lasting ${season.total_days} days.`,
    });
  }

  if (players.length > 0) {
    faqs.push({
      question: `How many houseguests were on ${abbr}?`,
      answer: `${season.name} featured ${players.length} houseguests.`,
    });
  }

  if (season.status === "upcoming") {
    if (season.start_date) {
      faqs.push({
        question: `When does ${season.name} start?`,
        answer: `${season.name} is scheduled to premiere on ${new Date(season.start_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`,
      });
    }
    faqs.push({
      question: `How to watch ${season.name}?`,
      answer: `${season.name} airs on CBS and is available for streaming on Paramount+. Live feeds are available through Paramount+ with the Live Feeds add-on.`,
    });
  }

  return faqs;
}
```

- [ ] **Step 3: Test locally**

Run: `npm run dev` and visit `http://localhost:3000/bigbrother-seasons/big-brother-27`

Verify all sections render: overview, winner spotlight, cast grid, eviction order, articles, feed updates, FAQ. Verify the jump nav highlights correctly on scroll.

- [ ] **Step 4: Commit**

```bash
git add src/app/bigbrother-seasons/\[slug\]/page.jsx src/app/bigbrother-seasons/\[slug\]/components/index.js
git commit -m "feat(season-hub): wire all sections into season page"
```

---

## Task 11: Auto-Link Season Mentions in Blog Posts

**Files:**
- Create: `src/lib/utils/autoLink.js`
- Modify: `src/app/[slug]/page.jsx`

- [ ] **Step 1: Create autoLink utility**

```js
/**
 * Auto-link entity mentions in HTML content
 * Links first occurrence of each entity name, skipping existing links and headings
 *
 * @param {string} html - Post HTML content
 * @param {Array<{name: string, url: string}>} entities - Entities to link
 * @returns {string} HTML with auto-linked entities
 */
export function autoLinkEntities(html, entities) {
  if (!html || !entities || entities.length === 0) return html;

  let result = html;

  for (const { name, url } of entities) {
    // Skip if this entity is already linked somewhere in the content
    if (result.includes(`href="${url}"`)) continue;

    // Match first occurrence NOT inside an <a> tag or heading tag
    // Strategy: split by tags, only replace in text nodes outside links/headings
    const regex = new RegExp(
      `(?<![\\w-])${escapeRegex(name)}(?![\\w-])`,
      "i"
    );

    // Simple approach: find first occurrence, check it's not inside a tag
    const match = regex.exec(result);
    if (!match) continue;

    // Check if this match is inside an <a> or <h1-h6> tag
    const before = result.substring(0, match.index);
    if (isInsideTag(before, ["a", "h1", "h2", "h3", "h4", "h5", "h6"])) continue;

    // Replace first occurrence only
    const link = `<a href="${url}" class="auto-link">${match[0]}</a>`;
    result = result.substring(0, match.index) + link + result.substring(match.index + match[0].length);
  }

  return result;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Check if a position is inside an unclosed HTML tag
 */
function isInsideTag(textBefore, tagNames) {
  for (const tag of tagNames) {
    const openPattern = new RegExp(`<${tag}[\\s>]`, "gi");
    const closePattern = new RegExp(`</${tag}>`, "gi");

    let openCount = 0;
    let closeCount = 0;

    let m;
    while ((m = openPattern.exec(textBefore)) !== null) openCount++;
    while ((m = closePattern.exec(textBefore)) !== null) closeCount++;

    if (openCount > closeCount) return true;
  }
  return false;
}

/**
 * Build entity map from seasons data
 * @param {Array} seasons - Array of season objects with name, abbreviation, slug
 * @returns {Array<{name: string, url: string}>}
 */
export function buildSeasonEntityMap(seasons) {
  const entities = [];

  for (const season of seasons) {
    const url = `/bigbrother-seasons/${season.slug}`;

    // Full name: "Big Brother 27"
    if (season.name) {
      entities.push({ name: season.name, url });
    }

    // Abbreviation: "BB27"
    if (season.abbreviation && season.abbreviation !== season.name) {
      entities.push({ name: season.abbreviation, url });
    }
  }

  // Sort by name length descending so longer names match first
  // ("Big Brother 27" before "Big Brother 2")
  entities.sort((a, b) => b.name.length - a.name.length);

  return entities;
}
```

- [ ] **Step 2: Apply auto-linking in blog post page**

In `src/app/[slug]/page.jsx`, import and apply the auto-linker to post content before rendering. Find where `content.content` is passed to `ContentWithAds` or `dangerouslySetInnerHTML`:

```js
import { autoLinkEntities, buildSeasonEntityMap } from "@/lib/utils/autoLink";
import { getSeasons } from "@/lib/api/seasons";

// Inside the page component, after fetching the post:
const { seasons } = await getSeasons();
const entities = buildSeasonEntityMap(seasons);
const linkedContent = autoLinkEntities(content.content, entities);

// Then use linkedContent instead of content.content when rendering
```

Replace `content.content` with `linkedContent` where it's passed to `ContentWithAds` or `dangerouslySetInnerHTML`.

- [ ] **Step 3: Test with a BB27 post**

Visit a blog post that mentions "Big Brother 27" in the body text. Verify:
1. First mention of "Big Brother 27" is linked to `/bigbrother-seasons/big-brother-27`
2. Only first occurrence is linked (not every mention)
3. Mentions already inside `<a>` tags are not double-linked
4. Mentions inside headings are not linked

- [ ] **Step 4: Commit**

```bash
git add src/lib/utils/autoLink.js src/app/\[slug\]/page.jsx
git commit -m "feat(seo): auto-link season mentions in blog posts"
```

---

## Task 12: Update Meta Description + Final Polish

**Files:**
- Modify: `src/app/bigbrother-seasons/[slug]/page.jsx` (metadata already updated in Task 10)

- [ ] **Step 1: Verify SEO metadata**

Check that `generateMetadata` returns keyword-rich title and description:
- Title format: `Big Brother 27 - Cast, Spoilers, Eviction Order | Big Brother Junkies`
- Description includes: season name, cast, spoilers, eviction order, live feed updates

- [ ] **Step 2: Verify all section IDs match jump nav**

Each section must have an `id` attribute matching the `SECTIONS` array in `SeasonJumpNav`:
- `id="overview"` on SeasonOverview
- `id="winners"` on WinnerSpotlight
- `id="cast"` wrapper div
- `id="eviction-order"` on EvictionOrder
- `id="articles"` on SeasonArticles
- `id="feed-updates"` on SeasonFeedUpdates
- `id="faq"` on SeasonFAQ

- [ ] **Step 3: Full page test**

Visit `http://localhost:3000/bigbrother-seasons/big-brother-27` and verify:
1. All 7 content sections render with real BB27 data
2. Sticky jump nav highlights correctly on scroll
3. Click each nav item — smooth scrolls to section
4. Winner/AFP spotlight shows Ashley, Vince, Keanu
5. Eviction order table shows all houseguests sorted by finish place
6. Articles section shows 6 recent posts with thumbnails
7. Feed updates section shows recent updates
8. FAQ accordion opens/closes, answers are accurate
9. More Seasons nav in sidebar shows BB26/BB28 links
10. View page source — all content is in the initial HTML (SSR)
11. Check for FAQPage JSON-LD in `<script type="application/ld+json">`

- [ ] **Step 4: Final commit and push to staging**

```bash
git add -A
git commit -m "feat(season-hub): complete season hub redesign with SEO content sections"
git push
bash /c/xampp/htdocs/bbj-app/.claude/scripts/deploy-plugin.sh --staging
```
