# Season Hub Page Redesign

**Date:** 2026-04-04
**Status:** Design
**Goal:** Transform the season page from a data dashboard into a comprehensive SEO content hub that ranks for season-specific keywords like "Big Brother 27", "BB27 eviction order", "who won Big Brother 27".

---

## Overview

The current season page at `/bigbrother-seasons/[slug]` displays cast grid, live now status, leaderboards, and season info sidebar. It's functional but has no indexable text content — no blog posts, no written summary, no FAQ, no eviction order. Google sees a page of player names and stats with very little to rank.

The redesign adds six new content sections while keeping everything that exists. A sticky jump nav provides tab-like UX without hiding content from crawlers.

## Architecture

### Page Type

Server Component (async). The page fetches all data server-side and renders the full DOM. No client-side data fetching for the main content — everything is in the initial HTML for Google.

The sticky jump nav and FAQ accordion are the only client-side interactive pieces (small client components embedded within the server page).

### URL Structure

No change: `/bigbrother-seasons/[slug]` (e.g., `/bigbrother-seasons/big-brother-27`).

This matches the existing WordPress permalink and is already indexed by Google. The slug contains the target keyword ("big-brother-27").

### Layout

Three-column layout (same as current):
- **Main content** (left, flex-grow): All content sections stacked vertically
- **Season info sidebar** (middle on xl, 288px): Season info, live now, leaderboards, season nav
- **Site sidebar** (right): Ads, widgets (existing `<Sidebar />` component)

### Sticky Jump Nav

A horizontal nav bar that sticks below the season header as the user scrolls. Each item is an anchor link to a section on the page. Uses `IntersectionObserver` to highlight the active section.

```
[Overview] [Cast] [Eviction Order] [Articles (161)] [Feed Updates] [FAQ]
```

This is a small client component (`SeasonJumpNav`) that wraps anchor links with scroll-spy behavior.

## Content Sections (in order)

### 1. Season Overview

A paragraph of editorial text describing the season. Stored as a new meta field (`_bbj_season_description`) on the season post in WordPress.

**Data source:** New field `description` in the season API response.
**Fallback:** If empty, auto-generate a basic summary from existing data: "{name} premiered on {start_date} with {player_count} houseguests competing for the ${prize} grand prize. The season lasted {total_days} days."

### 2. Winner / AFP Spotlight

Three cards displayed in a row: Winner, Runner-Up, America's Favorite Player.

**Data source:** Already available in the player data returned by `getSeasonBySlug()`. Players have `finish_place` (1 = winner, 2 = runner-up) and `game_status` flags. AFP needs a status flag or a new field `is_afp` on the season-player relationship.

**AFP field:** Add `is_afp` (tinyint) to the `bbj_player_season` table, managed alongside other status flags in the season editor. If not yet available, check for a player whose `finish_place = 3` or has a custom meta field.

**Cards show:** Player photo, name, status label, and vote details if available (e.g., "6-1 Jury Vote").

**For upcoming/active seasons:** This section is hidden until the season concludes (check `season.status === 'completed'`).

### 3. Cast Grid

Existing `PlayerGrid` component. No changes needed — it already displays all players with status badges, photos, and links to player profiles.

### 4. Eviction Order

A table showing every evicted houseguest in order of elimination.

**Data source:** The player data already contains `evicted_date` and `finish_place`. Filter to evicted/jury/winner/runner-up players, sort by `finish_place` descending (first evicted = highest finish_place number).

**Columns:** #, Photo (small), Houseguest Name (linked to profile), Evicted Date, Day #, Finish Place.

**For active seasons:** Shows evictions so far, with remaining players listed as "Still in the house" at the bottom.

New component: `EvictionOrder` (server component, no interactivity needed).

### 5. Related Articles

Blog posts tagged with the season's WordPress category.

**Data source:** New API call — fetch posts by category. BB27 has category term_id 5944 with 161 posts. The mapping from season to category needs to be established:
- Option A: Store the WP category ID as a meta field on the season post (`_bbj_season_category_id`)
- Option B: Match by slug convention (season slug `big-brother-27` → category slug `big-brother-27`)

**Recommendation:** Option B (slug matching). Zero config, works automatically for every season. Fall back to option A if slugs don't match.

**Display:** Show 6 most recent posts with thumbnail, title, date, comment count. "View all {count} articles →" link goes to `/category/big-brother-27` (a category archive page — may need to be built if it doesn't exist yet).

**API:** Use the existing WP REST API: `GET /wp/v2/posts?categories={id}&per_page=6&_embed`. We already have `bbjdFetch` for custom endpoints, but the standard WP endpoint works fine here since this is public read-only data. Alternatively, add a convenience endpoint to the bbjd plugin.

New component: `SeasonArticles` (server component).

### 6. Live Feed Updates

Recent feed updates from the season.

**Data source:** The feed updates API (`/bbjd/v1/feed-updates`) already exists. Need to filter by season — feed updates are published during a season's date range. Filter by date: `after={season.start_date}&before={season.end_date}`.

**Display:** Show 5 most recent feed updates with the yellow left-border style. Title, timestamp, excerpt. "View all feed updates →" links to `/feed-updates?season=big-brother-27`.

New component: `SeasonFeedUpdates` (server component).

### 7. FAQ Section

Auto-generated FAQ based on season data. Collapsible accordion UI with `FAQPage` JSON-LD schema for Google featured snippets.

**Questions (auto-generated from data):**
- "Who won {season.name}?" → "{winner.name} won {season.name}, defeating {runner_up.name} in a {vote_count} jury vote on {season.end_date}."
- "When did {season.name} air?" → "{season.name} premiered on {start_date} and concluded on {end_date}, lasting {total_days} days."
- "Who was America's Favorite Player on {abbreviation}?" → "{afp.name} was voted America's Favorite Player."
- "How many houseguests were on {abbreviation}?" → "{season.name} featured {player_count} houseguests."
- "What was the {abbreviation} jury vote?" → "{winner.name} won with a {vote} jury vote against {runner_up.name}."

**For upcoming seasons:** Show different questions: "When does {name} start?", "How to watch {name}?", "Who is in the {name} cast?"

**Schema:** `FAQPage` JSON-LD added to the page head alongside the existing `SeasonJsonLd`.

New components: `SeasonFAQ` (client component for accordion) and `SeasonFAQSchema` (server component for JSON-LD).

## Sidebar Additions

### More Seasons Nav

Add a "More Seasons" card to the `SeasonInfoSidebar` with previous/next season links:

```
← Big Brother 26    Big Brother 28 →
```

**Data source:** Calculate from `season.season_number ± 1`. Build the slug as `big-brother-{n}`. For celebrity/OTT seasons, this won't work perfectly — but for the main US seasons (which are all numbered), it's fine.

## Data Changes

### WordPress Plugin (Backend)

**New meta field:** `_bbj_season_description` (text) — editable in the Next.js season editor (`/bigbrother-seasons/[slug]/edit`).

**API change:** Add `description` to the season object returned by `SeasonRoutes::formatSeason()`. Read from `_bbj_season_description` post meta. Falls back to auto-generated text if empty.

**Category lookup:** Add a method or endpoint to resolve a season's blog category. Query `wp_terms` for a term matching the season slug in the `category` taxonomy. Return the `term_id` and post count.

### Season Editor (Frontend)

Add a "Season Description" textarea to the season edit page (`/bigbrother-seasons/[slug]/edit`). This is the overview paragraph that appears at the top of the hub. Hint text: "Write a summary of this season for the hub page. Leave blank for auto-generated."

## New Components

| Component | Type | Location | Purpose |
|-----------|------|----------|---------|
| `SeasonJumpNav` | Client | `bigbrother-seasons/[slug]/components/` | Sticky nav with scroll-spy |
| `EvictionOrder` | Server | same | Eviction order table |
| `SeasonArticles` | Server | same | Related blog posts grid |
| `SeasonFeedUpdates` | Server | same | Recent feed updates list |
| `SeasonFAQ` | Client | same | Collapsible FAQ accordion |
| `SeasonFAQSchema` | Server | same | FAQPage JSON-LD |
| `WinnerSpotlight` | Server | same | Winner/Runner-Up/AFP cards |
| `SeasonOverview` | Server | same | Description paragraph with fallback |

## SEO Impact

### Structured Data
- Existing: `SeasonJsonLd` (WebPage schema)
- Added: `FAQPage` schema for FAQ section
- Added: `ItemList` schema for eviction order (optional, helps with rich results)

### Internal Linking
- Each player in cast grid/eviction order links to their profile page
- Each article links to its post page
- Each feed update links to its detail page
- Previous/next season links in sidebar
- "View all articles" links to category archive

### Indexable Content
The page goes from ~200 words (player names and stats) to ~1000+ words (overview, FAQ answers, article titles/excerpts, feed update excerpts). This is the primary SEO improvement.

### Target Keywords per Season
- "{Season Name}" (e.g., "Big Brother 27")
- "{Season} spoilers"
- "{Season} eviction order"
- "Who won {Season}"
- "{Season} cast"
- "{Abbreviation} live feed updates"

## Auto-Linking: Season & Player Mentions in Articles

When rendering blog post content, automatically link mentions of season names and player names to their hub/profile pages. This creates a dense internal linking web — every article becomes a source of link equity to hub pages and player profiles.

### How It Works

Post content comes from WordPress as HTML. Before rendering, run a text replacement pass that wraps known entity names in links:

- "Big Brother 27" → `<a href="/bigbrother-seasons/big-brother-27">Big Brother 27</a>`
- "BB27" → `<a href="/bigbrother-seasons/big-brother-27">BB27</a>`
- "Ashley Hollis" → `<a href="/bigbrother-players/ashley-hollis">Ashley Hollis</a>`

### Implementation

A server-side utility function `autoLinkEntities(html, entities)` that:
1. Takes the post HTML content and a list of known entities (seasons + players)
2. Replaces first occurrence of each entity name with a link (not every occurrence — that's spammy)
3. Skips text already inside `<a>` tags (don't nest links)
4. Skips text inside headings (don't pollute heading text with links)
5. Returns the modified HTML

### Entity Data Source

Fetch the entity list at build/render time:
- Seasons: `getSeasons()` returns all seasons with slugs and names
- Players for current/recent seasons: fetch from the season API

Cache this list aggressively — it rarely changes. Store as a static map: `{ "Big Brother 27": "/bigbrother-seasons/big-brother-27", "BB27": "/bigbrother-seasons/big-brother-27", ... }`

### Where It Runs

In the blog post page component (`src/app/[slug]/page.jsx`), apply `autoLinkEntities()` to the post content before rendering with `dangerouslySetInnerHTML`. This is server-side only — no client JS cost.

### Scope

Start with seasons only (simpler, higher SEO value). Add player auto-linking as a follow-up — there are hundreds of players and the name collision risk is higher (common first names, etc.).

## Performance Considerations

- All new sections are server-rendered (no client-side data fetching waterfall)
- Articles and feed updates are limited to 6 and 5 items respectively
- Images use `next/image` with lazy loading for below-fold content
- FAQ accordion is a lightweight client component (just toggle visibility)
- Sticky nav uses `IntersectionObserver` (no scroll event listeners)
- Revalidation: Tagged with `seasons`, `season-{slug}`, `players`, and `posts` tags. Publishes/updates trigger revalidation via the webhook.
