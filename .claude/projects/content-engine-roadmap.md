# Content Engine & Revenue Roadmap

## Overview

Big Brother Junkies (160k Facebook followers) needs a sustainable content pipeline during the BB off-season. The goal is ~$50/day in revenue across Facebook, site traffic, and affiliate income without burning hours on manual content creation. A second brand, **TheRealityJunkies.com (TRJ)**, will cover Survivor, The Challenge, The Traitors, and other reality shows year-round, giving us full calendar coverage.

---

## Two Brands, One Ecosystem

### Big Brother Junkies (BBJ)

- **Facebook**: 160k followers, BB-only content, protect engagement rate at all costs
- **Site**: Existing Next.js site with player database, currently being rebuilt
- **Off-season strategy**: AI-generated debate/nostalgia/trivia posts pulled from the player CSV database

### The Reality Junkies (TRJ) -- NEW

- **Domain**: therealityjunkies.com (already owned)
- **Facebook**: New page, generic reality TV branding
- **Site**: Build from scratch (can reuse the Next.js patterns and admin tooling from BBJ)
- **Content scope**: Survivor, The Challenge, The Traitors, Love Island, Amazing Race, and anything else airing
- **Staffing**: Recruit writers to scale content without Steve doing everything manually
- **Show calendar coverage**:
  - Survivor: Sept-Dec, Feb-May
  - The Challenge: scattered, usually fall/spring
  - The Traitors: Jan-March
  - Love Island: summer
  - Amazing Race: varies

### Cross-Promotion Between BBJ and TRJ

- Needs brainstorming, but guiding principles:
  - BBJ stays pure BB. Never flood it with non-BB content.
  - Low-frequency cross-promotion on BBJ during off-season (once every 1-2 weeks max): "Off-season boredom? We're covering Survivor over at @TheRealityJunkies"
  - BBJ site sidebar/footer links to TRJ
  - TRJ site links back to BBJ for BB-specific content
  - Shared admin tooling so Steve manages both from one place
  - Potential shared writers who cover multiple shows
  - TODO: figure out deeper coordination (shared articles? crossover content like "BB players who went on The Challenge"? unified newsletter?)

---

## Phase 1: The Content Engine (Ship As One Unit)

Everything below is one interconnected system — image posting, content generation, news aggregation, AI enhancement, Facebook API, and scheduling all ship together.

### 1A. Image Upload + AI Caption + Facebook Post Pipeline

The daily driver tool. Lives in the admin panel.

#### Workflow

1. Steve sees a good post on IG while scrolling
2. Opens admin panel, **pastes the image directly** (clipboard paste, not file picker -- copy image from IG on desktop/mobile, Ctrl+V or paste into the admin area)
3. Image preview appears alongside a text area
4. Hits **"Generate Caption"**
   - Sends the image to the Anthropic API (Claude vision)
   - Claude analyzes the image, cross-references with the player database if it recognizes BB players
   - Returns 2-3 caption options tailored for Facebook engagement
5. Steve picks one, edits it if needed, or writes his own from scratch
6. Selects which Facebook page to post to (BBJ or TRJ)
7. Hits **"Post to Facebook"** -- posts immediately via Facebook Graph API
8. Or hits **"Schedule"** -- picks a date/time and it queues up

#### Technical Notes

- Facebook Graph API: `/{page-id}/photos` endpoint, multipart form data with `message` param
- Need a Page Access Token with `pages_manage_posts` and `pages_read_engagement` permissions
- Anthropic API: send image as base64 with a system prompt that includes context about BB players and engagement-focused captioning
- Clipboard paste: use the browser Clipboard API (`navigator.clipboard.read()`) to handle pasted images directly
- Store posted content in a log so we can track what's been shared and avoid duplicates

### 1B. News Aggregator + AI Rewrite Pipeline

Curate Big Brother news from around the web and turn it into BBJ content with one click.

#### Workflow

1. Admin panel shows a feed of recent BB-related news (pulled from RSS feeds, Google News)
2. Steve browses headlines, sees something worth covering
3. Hits **"Scan & Create"**
   - Backend fetches the article content
   - Sends it to Anthropic API: "Rewrite this news story in the voice of Big Brother Junkies, summarize the key points, add fan perspective"
   - Returns a draft post ready for editing
4. Steve edits the draft, adds their own take
5. Can publish as a **site blog post** (WordPress) AND/OR generate a **Facebook caption** from it
6. Schedule or post immediately

#### News Sources

- RSS feeds: TMZ, Entertainment Weekly, People, Reality Blurred, Parade, US Weekly
- Google News API or RSS for "Big Brother" + "Big Brother CBS" queries
- Twitter/X search (optional, later phase)
- Configurable source list in admin settings

#### Technical Notes

- Cron job or scheduled task to refresh news feed every 30-60 minutes
- Store fetched articles in a custom table to avoid re-fetching
- Deduplication by URL and headline similarity
- AI rewrite uses article text + BBJ voice prompt + player database context
- Output can go two directions: Facebook post OR WordPress blog post (or both)

### 1C. AI Content Generator (Off-Season Engine)

Template-based post generator that pulls from the BB player CSV database. Keeps BBJ active year-round without Steve manually coming up with content.

### Post Types / Templates

- **Versus matchups**: "Who wins in a Final 2: [Player A, Season X] vs [Player B, Season Y]?"
- **Rankings**: "Rank these 4 comp beasts from best to worst: [4 random players with high comp wins]"
- **Hot takes**: "Unpopular opinion: [Player] was actually a better player than [Higher-ranked Player]. Change my mind."
- **Trivia**: "Which season had the most unanimous jury vote?"
- **Scenarios**: "You're HOH with these 6 left: [6 random players from different seasons]. Who are you nominating?"
- **"On This Day"**: Date-based lookup of BB premieres, finales, notable episodes. Auto-generates nostalgia posts.
- **This or That**: Simple binary choices that drive comments

### How It Works in the Admin Panel

1. Select a post type from a dropdown
2. System pulls random players/data from the CSV based on template requirements
3. Raw template output appears in a text area
4. Option to hit "Enhance with AI" to send it through Anthropic API for a more natural rewrite (returns 2-3 variations)
5. Edit, approve, schedule or post immediately
6. "Regenerate" button to get a fresh random pull if the first one is weak

### Data Requirements

- Player CSV needs richer tagging: comp wins, placement, play style (floater, comp beast, social player, villain, hero), season, notable alliances, showmances
- Season metadata: premiere dates, finale dates, twist names, notable episodes
- Alliance data: name, members, season, how it ended

---

### 1D. Content Queue & Scheduler

Batch a week of content in one sitting instead of posting manually every day.

### Features

- Calendar/list view of upcoming scheduled posts across both pages (BBJ + TRJ)
- Drag and drop to reorder
- Inline editing
- Optimal posting times (start with 9am, 12pm, 6pm EST, refine based on analytics later)
- Visual indicator of content type mix (so you're not posting 5 trivia questions in a row)
- Filter by page (BBJ vs TRJ)

---

## Phase 2: Multi-Show Database (for TRJ)

Extend the player database pattern to other shows. Same schema concept, show-specific attributes.

### Survivor

- Fields: name, season, tribe(s), placement, immunity wins, idols found, fire-making result, FTC votes, play style

### The Challenge

- Fields: name, seasons, finals appearances, daily wins, eliminations won, political game rating, partner/team history

### The Traitors

- Fields: name, season, faithful/traitor, round eliminated, murders committed (if traitor), banishments survived

### Admin Panel

- Show switcher dropdown: "Generating content for: [Big Brother | Survivor | The Challenge | ...]"
- Same template engine, same caption tools, different data source
- Same Facebook posting pipeline, just targeting TRJ page instead of BBJ

---

## Revenue Strategy

### Target: ~$50/day average across both brands

**Revenue Stream 1: Site Traffic from Facebook ($20-30/day)**

- Every discussion post links back to the site (BBJ or TRJ)
- Build listicle/ranking pages specifically designed as Facebook traffic landing pages
- Display ads via Mediavine or AdSense
- Goal: 2,000-3,000 daily pageviews combined

**Revenue Stream 2: Facebook In-Stream Ads ($10-20/day)**

- Requires video content over 1 minute
- Build an ffmpeg-based video generator in admin panel
- Slideshow-style "Top 5" and "VS" videos using player photos + text overlays
- Low production value is fine (think Reddit story style)
- This is a later phase but the biggest revenue lever on Facebook

**Revenue Stream 3: Affiliate Income ($5-10/day)**

- Paramount+ affiliate links (BB live feeds, Survivor streaming)
- Peacock for The Traitors, other streaming services as relevant
- Amazon affiliate for reality TV merch and books
- Smart link insertion: when a post mentions a current season, auto-suggest the relevant affiliate link

**Revenue Stream 4: TRJ Writers**

- Recruit writers (paid per article or rev-share) to scale content on TRJ
- More content = more site traffic = more ad revenue
- Writers also create social posts which feed the Facebook pipeline
- Start with 1-2 Survivor writers, expand as revenue justifies it

---

## TheRealityJunkies.com -- Site Build Notes

- Fresh Next.js site, can reuse patterns and components from BBJ rebuild
- Shared admin panel architecture (or unified admin that manages both sites)
- Multi-show contestant database from day one
- Blog/article section for writer contributions
- Writer portal: login, submit drafts, editorial workflow
- SEO play: target "[Show Name] + [player name/season]" queries
- Social sharing optimized (Open Graph tags, preview images)
- TODO: design, branding, content structure -- needs its own planning session

---

## Build Order

### Phase 1: Content Engine (ship as one unit)
All of these are interconnected and release together.

| Task                                                        | Complexity |
| ----------------------------------------------------------- | ---------- |
| Image paste + AI caption + Facebook post pipeline in admin  | Medium     |
| News aggregator + AI rewrite pipeline                       | Medium     |
| Template-based content generator pulling from BB player CSV | Medium     |
| Anthropic API integration (captions, rewrites, enhancement) | Low        |
| Facebook Graph API integration (post + schedule)            | Medium     |
| Content queue/scheduler UI                                  | Medium     |
| "On This Day" date-based content generator                  | Low        |

### Phase 1.5: Meta Pixel (do ASAP — before ad spend)
| Task                                                        | Complexity |
| ----------------------------------------------------------- | ---------- |
| Install Meta Pixel on BBJ site (and TRJ when built)         | Low        |
| Set up custom events (page view, post read, comment, signup)| Low        |
| Build custom audiences for retargeting (site visitors, engagers) | Low   |

> **Why now:** If running Meta Ads for BB season news/promotion, the pixel needs time to collect data and build audiences BEFORE ad spend starts. Every day without it is wasted audience data. Install it even before the content engine ships.

### Phase 2: Multi-show expansion
| Task                                                        | Complexity |
| ----------------------------------------------------------- | ---------- |
| Multi-show database schema (start with Survivor)            | Low-Medium |
| TRJ site scaffolding (Next.js, reuse BBJ patterns)          | Medium     |

### Phase 3: Writer system
| Task                                                        | Complexity |
| ----------------------------------------------------------- | ---------- |
| Simple post editor (WYSIWYG, required category, no blocks)  | Medium     |
| Writer portal / editorial workflow                          | Medium     |

### Later / As Needed
| Task                                                        | Complexity |
| ----------------------------------------------------------- | ---------- |
| Analytics dashboard (Facebook Insights pull)                | Medium     |
| Content recycling (resurface old high-performing posts)     | Low        |

---

## Open Questions / Needs Brainstorming

- How exactly should BBJ and TRJ cross-promote without annoying either audience?
- Shared content opportunities (e.g., "BB players on The Challenge" crossover articles)?
- Unified newsletter covering both brands, or separate?
- Writer compensation model for TRJ (flat rate per article? rev share? volunteer/fan contributors?)
- Should TRJ Facebook page be a single page or eventually split into show-specific pages?
- Video content strategy: what's the minimum viable video that performs on Facebook?
- Can the admin panel eventually serve both sites from one interface?
