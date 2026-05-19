# Content Engine — Design Document

**Date:** 2026-03-01
**Status:** Approved
**Scope:** Phase 1 — unified content creation, AI enhancement, Facebook posting, news aggregation, scheduling

---

## Overview

A content engine built into the BBJ admin panel that unifies three content sources (image paste, news aggregation, template generation) into a single pipeline ending at Facebook posting, site publishing, or scheduled queue. All AI calls proxy through the WordPress backend via the Anthropic API.

## Architecture

### Admin Panel Structure

New admin tab "Content Engine" (permission: `content_engine`) with sub-views:

```
Content Engine
├── Create Post        — Image paste, AI caption, write from scratch
├── News Feed          — Aggregated BB news, "Scan & Create"
├── Generate           — Template engine (versus, rankings, trivia, on this day)
├── Queue              — Scheduled posts calendar/list, drag-drop reorder
└── Post Log           — History of all posted content
```

### Data Flow

All three content sources funnel into a shared draft editor:

```
[Image Paste + AI Caption]  ──┐
[News Scan & AI Rewrite]    ──┤──→  Draft Editor  ──→  Post to Facebook
[Template Generator]        ──┘     - Edit text       Publish to WP Site
                                    - Attach image     Schedule for Later
                                    - Pick FB page
                                    - Pick destination
```

### System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   ADMIN PANEL (Next.js)                     │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Create   │  │  News    │  │ Generate │  │  Queue    │  │
│  │  Post     │  │  Feed    │  │          │  │           │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬─────┘  │
│       │              │             │               │        │
│       └──────────────┴─────────────┘               │        │
│                      │                             │        │
│              ┌───────▼────────┐            ┌──────▼──────┐ │
│              │  Draft Editor  │            │  Calendar/  │ │
│              │  Component     │            │  List View  │ │
│              └───────┬────────┘            └─────────────┘ │
└──────────────────────┼──────────────────────────────────────┘
                       │ adminFetch()
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               WORDPRESS PLUGIN (PHP)                        │
│                                                             │
│  ┌──────────────────┐  ┌─────────────────┐                 │
│  │ ContentEngine    │  │ Facebook        │                 │
│  │ Routes.php       │  │ Routes.php      │                 │
│  │ - CRUD drafts    │  │ - Post to page  │                 │
│  │ - Queue mgmt     │  │ - Get pages     │                 │
│  │ - Post log       │  │ - Token mgmt    │                 │
│  └──────────────────┘  └─────────────────┘                 │
│                                                             │
│  ┌──────────────────┐  ┌─────────────────┐                 │
│  │ AI Routes.php    │  │ NewsAggregator  │                 │
│  │ - Caption gen    │  │ Routes.php      │                 │
│  │ - Article rewrite│  │ - Fetch feeds   │                 │
│  │ - Template enhance│ │ - Scan article  │                 │
│  └──────────────────┘  └─────────────────┘                 │
│                                                             │
│  ┌──────────────────┐                                      │
│  │ WP Cron Jobs     │                                      │
│  │ - News refresh   │  (every 30-60 min)                   │
│  │ - Scheduled posts │  (fires at scheduled time)          │
│  └──────────────────┘                                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
              ┌───────────┼───────────┐
              ▼           ▼           ▼
        ┌──────────┐ ┌────────┐ ┌──────────┐
        │ Anthropic│ │Facebook│ │ RSS/News │
        │ API      │ │Graph   │ │ Sources  │
        │          │ │API     │ │          │
        └──────────┘ └────────┘ └──────────┘
```

---

## Database Schema

### `bbj_content_queue` — All content lives here

```sql
CREATE TABLE bbj_content_queue (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  status ENUM('draft', 'scheduled', 'posted', 'failed') DEFAULT 'draft',
  source ENUM('manual', 'image_paste', 'news_scan', 'template', 'on_this_day') DEFAULT 'manual',
  content_type ENUM('facebook_post', 'blog_post', 'both') DEFAULT 'facebook_post',

  -- Content
  title VARCHAR(255) DEFAULT NULL,
  body TEXT NOT NULL,
  image_url VARCHAR(500) DEFAULT NULL,
  image_data LONGBLOB DEFAULT NULL,

  -- Destination
  target_page VARCHAR(50) DEFAULT NULL,        -- page ID (e.g., '124791417569701')
  target_page_name VARCHAR(100) DEFAULT NULL,  -- display name (e.g., 'The Reality Junkies')
  wp_post_id BIGINT DEFAULT NULL,              -- if published to WP site

  -- Scheduling
  scheduled_at DATETIME DEFAULT NULL,
  posted_at DATETIME DEFAULT NULL,

  -- Facebook response
  fb_post_id VARCHAR(100) DEFAULT NULL,

  -- Metadata
  template_type VARCHAR(50) DEFAULT NULL,      -- 'versus', 'ranking', 'trivia', etc.
  source_url VARCHAR(500) DEFAULT NULL,        -- original news article URL
  ai_variations TEXT DEFAULT NULL,             -- JSON array of AI-generated alternatives
  author_id BIGINT UNSIGNED DEFAULT NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_status (status),
  INDEX idx_scheduled (status, scheduled_at),
  INDEX idx_source (source),
  INDEX idx_target_page (target_page)
);
```

### `bbj_news_feed` — Cached news articles

```sql
CREATE TABLE bbj_news_feed (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  url VARCHAR(500) NOT NULL UNIQUE,
  source_name VARCHAR(100) DEFAULT NULL,       -- 'TMZ', 'Entertainment Weekly', etc.
  excerpt TEXT DEFAULT NULL,
  thumbnail VARCHAR(500) DEFAULT NULL,
  published_at DATETIME DEFAULT NULL,
  fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  used TINYINT(1) DEFAULT 0,                   -- 1 if already turned into a post
  INDEX idx_published (published_at DESC),
  INDEX idx_used (used)
);
```

### `bbj_content_engine_settings` — Stored in `bbjd_api_settings` option

```php
[
  'anthropic_api_key' => 'sk-ant-...',
  'facebook_pages' => [
    [
      'id' => '124791417569701',
      'name' => 'The Reality Junkies',
      'token' => 'EAAS...',
    ],
    [
      'id' => '163069360412016',
      'name' => 'Big Brother Junkies',
      'token' => 'EAAS...',
    ],
  ],
  'news_sources' => [
    ['name' => 'Google News - Big Brother', 'url' => 'https://news.google.com/rss/search?q=Big+Brother+CBS'],
    ['name' => 'Reality Blurred', 'url' => 'https://www.realityblurred.com/feed/'],
    // more RSS feeds
  ],
  'default_posting_times' => ['09:00', '12:00', '18:00'],
  'news_refresh_interval' => 30,  // minutes
]
```

---

## API Endpoints

### ContentEngineRoutes.php

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bbjd/v1/content-engine/drafts` | List drafts (paginated) |
| POST | `/bbjd/v1/content-engine/drafts` | Create new draft |
| PUT | `/bbjd/v1/content-engine/drafts/{id}` | Update draft |
| DELETE | `/bbjd/v1/content-engine/drafts/{id}` | Delete draft |
| GET | `/bbjd/v1/content-engine/queue` | Get scheduled posts |
| POST | `/bbjd/v1/content-engine/queue/{id}/reschedule` | Change scheduled time |
| POST | `/bbjd/v1/content-engine/queue/{id}/reorder` | Reorder in queue |
| GET | `/bbjd/v1/content-engine/log` | Post history (paginated) |
| GET | `/bbjd/v1/content-engine/settings` | Get content engine settings |
| POST | `/bbjd/v1/content-engine/settings` | Update settings |

### FacebookRoutes.php

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bbjd/v1/facebook/pages` | List configured pages |
| POST | `/bbjd/v1/facebook/post` | Post to a Facebook page |
| POST | `/bbjd/v1/facebook/post-photo` | Post photo + caption to page |

### AIRoutes.php

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/bbjd/v1/ai/caption` | Generate caption from image (base64) |
| POST | `/bbjd/v1/ai/rewrite` | Rewrite article in BBJ voice |
| POST | `/bbjd/v1/ai/enhance` | Enhance template-generated text |

### NewsAggregatorRoutes.php

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bbjd/v1/news/feed` | Get cached news articles |
| POST | `/bbjd/v1/news/scan` | Fetch + parse a specific article URL |
| POST | `/bbjd/v1/news/refresh` | Force refresh all RSS feeds |
| GET | `/bbjd/v1/news/sources` | List configured news sources |

---

## Frontend Components

### Admin Tab: `/admin/content-engine/page.jsx`

Client component with sub-navigation tabs (Create, News, Generate, Queue, Log).

### Create Post View

```
┌─────────────────────────────────────────────────────────┐
│  [Paste Image Area]              │  Caption / Text      │
│  ┌───────────────────────┐       │  ┌─────────────────┐ │
│  │                       │       │  │                 │ │
│  │   Drop or paste       │       │  │  Write or edit  │ │
│  │   image here          │       │  │  your caption   │ │
│  │                       │       │  │                 │ │
│  └───────────────────────┘       │  └─────────────────┘ │
│                                  │                      │
│  [Generate Caption]              │  AI Suggestions:     │
│                                  │  ○ Option 1...       │
│                                  │  ○ Option 2...       │
│                                  │  ○ Option 3...       │
│                                  │                      │
│  ─────────────────────────────────────────────────────  │
│  Target: [BBJ ▼] [TRJ ▼] [Survivor ▼]                 │
│  Action: [Post Now]  [Schedule ▼]  [Save Draft]        │
│          [Also publish as blog post ☐]                  │
└─────────────────────────────────────────────────────────┘
```

### News Feed View

```
┌─────────────────────────────────────────────────────────┐
│  BB News Feed                    [Refresh] [Sources ⚙]  │
│  ─────────────────────────────────────────────────────  │
│  ┌─────┐  Headline from TMZ               2 hours ago  │
│  │ img │  Brief excerpt of the article...              │
│  └─────┘  [Scan & Create]  [Open Original]             │
│                                                         │
│  ┌─────┐  Headline from People             5 hours ago  │
│  │ img │  Brief excerpt of the article...              │
│  └─────┘  [Scan & Create]  [Open Original]             │
│                                                         │
│  ┌─────┐  Headline from EW               1 day ago     │
│  │ img │  Brief excerpt of the article... ✓ Used       │
│  └─────┘  [View Post]                                   │
└─────────────────────────────────────────────────────────┘
```

### Generate View

```
┌─────────────────────────────────────────────────────────┐
│  Template: [Versus Matchup ▼]                           │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Who wins in a Final 2:                          │   │
│  │  Janelle Pierzina (BB6, BB7, BB14, BB22)         │   │
│  │  vs                                              │   │
│  │  Danielle Reyes (BB3, BB7)?                      │   │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  [Regenerate]  [Enhance with AI]  [Edit & Post →]      │
│                                                         │
│  AI Variations:                                         │
│  ○ "The ultimate battle of BB legends..."              │
│  ○ "Two queens, one crown..."                          │
│  ○ "If these two sat next to each other..."            │
└─────────────────────────────────────────────────────────┘
```

### Queue View

```
┌─────────────────────────────────────────────────────────┐
│  Content Queue              [Calendar ▣] [List ☰]       │
│  Filter: [All Pages ▼]                                  │
│  ─────────────────────────────────────────────────────  │
│  TODAY - March 2                                        │
│  ┌──────────────────────────────────────────────┐       │
│  │ 9:00 AM  │ 🖼 Versus: Dan vs Derrick  │ BBJ │ [⋮] │
│  │ 12:00 PM │ 📰 BB27 cast rumors recap  │ BBJ │ [⋮] │
│  │ 6:00 PM  │ 🖼 IG repost + caption     │ TRJ │ [⋮] │
│  └──────────────────────────────────────────────┘       │
│  TOMORROW - March 3                                     │
│  ┌──────────────────────────────────────────────┐       │
│  │ 9:00 AM  │ 🎲 Trivia question          │ BBJ │ [⋮] │
│  └──────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## AI Integration Details

### Anthropic API Proxy

All AI calls go through the WP backend. The Anthropic API key is stored in plugin settings and never exposed to the browser.

**Caption Generation Prompt:**
```
You are a social media manager for Big Brother Junkies, a fan page with 160k+ followers.
Analyze this image and generate 3 engaging Facebook caption options.

Context: {player database context if BB players detected}

Rules:
- Conversational, fan-to-fan tone
- Ask a question or pose a debate to drive comments
- Keep it under 280 characters for optimal engagement
- Use emojis sparingly (1-2 max)
- Never use hashtags on Facebook (they hurt reach)
```

**Article Rewrite Prompt:**
```
You are writing for Big Brother Junkies. Rewrite this news article as a BBJ blog post.

Original article: {article text}

Rules:
- Add fan perspective and opinion
- Reference relevant BB history/players when applicable
- Keep the key facts but make it feel like a fan site, not a news wire
- Include a discussion question at the end
- 300-500 words
```

**Template Enhancement Prompt:**
```
Enhance this social media post for maximum Facebook engagement.
Keep the core concept but make it more natural and engaging.
Return 3 variations.

Original: {template output}
Context: This is for a Big Brother fan page with 160k followers.
```

---

## Facebook Posting

### Post Types

| Type | API Endpoint | Params |
|------|-------------|--------|
| Text only | `POST /{page-id}/feed` | `message` |
| Photo + caption | `POST /{page-id}/photos` | `message`, `source` (image) |
| Link share | `POST /{page-id}/feed` | `message`, `link` |

### Token Management

- Page tokens stored encrypted in `bbjd_api_settings`
- Page tokens derived from long-lived user tokens are permanent (don't expire)
- Settings page shows token status per page
- Manual token refresh button if needed

### Scheduled Posting

- When user clicks "Schedule", draft moves to `scheduled` status with `scheduled_at` timestamp
- WP cron checks every minute for posts where `scheduled_at <= NOW()` and `status = 'scheduled'`
- On trigger: calls Facebook API, updates status to `posted` or `failed`, stores `fb_post_id`

---

## News Aggregation

### RSS Feed Processing

- WP cron job runs every 30 minutes (configurable)
- Fetches all configured RSS feeds
- Parses items: title, URL, excerpt, thumbnail, published date
- Deduplicates by URL
- Stores in `bbj_news_feed` table
- Marks old articles (>7 days) for cleanup

### "Scan & Create" Flow

1. User clicks "Scan & Create" on a news item
2. Backend fetches the full article HTML from the source URL
3. Strips HTML, extracts main content (using readability-style parsing)
4. Sends article text + BBJ voice prompt to Anthropic API
5. Returns rewritten article as a draft in the content editor
6. User edits, then posts to Facebook and/or publishes as WP blog post

---

## Template Engine

### Templates Pull from Player Database

Each template type has query requirements:

| Template | Data Needed |
|----------|-------------|
| Versus | 2 random players with comparable stats |
| Rankings | 4 players matching a criteria (comp beasts, social players, etc.) |
| Hot Take | 2 players where one is ranked higher but the other has an argument |
| Trivia | Season metadata (dates, stats, records) |
| Scenario | 6 random active-status players from different seasons |
| On This Day | Season premiere/finale dates matching today's date |
| This or That | 2 players or 2 seasons for binary choice |

### Player Data Source

- Primary: `bbj_players` database table (already exists via PlayerRoutes)
- Supplemental: local Player CSV data for enrichment
- Needs: play style tags, alliance data, season metadata for richer templates

---

## Permission

New permission `content_engine` added to `AdminRoutes::DEFAULT_PERMISSIONS`.

Default roles: `['administrator', 'editor', 'second_in_command']`

---

## Settings Page (within Content Engine)

- Anthropic API key input
- Facebook pages: add/remove pages with tokens, test connection button
- News sources: add/remove RSS feed URLs
- Default posting times
- News refresh interval
- Template preferences (enable/disable specific template types)

---

## File Changes Summary

### WordPress Plugin (bigbrotherjunkies-data)

| File | Action |
|------|--------|
| `src/Api/ContentEngineRoutes.php` | New — drafts, queue, log, settings CRUD |
| `src/Api/FacebookRoutes.php` | New — post to page, page list |
| `src/Api/AIRoutes.php` | New — caption, rewrite, enhance |
| `src/Api/NewsAggregatorRoutes.php` | New — feed, scan, refresh |
| `src/Api/AdminRoutes.php` | Modified — add `content_engine` permission |
| `Plugin.php` | Modified — register new route classes + cron jobs |
| `src/Database/Migrations/` | New — create `bbj_content_queue` and `bbj_news_feed` tables |

### Next.js Frontend (bbj-app)

| File | Action |
|------|--------|
| `src/app/admin/content-engine/page.jsx` | New — main content engine tab |
| `src/app/admin/layout.jsx` | Modified — add Content Engine tab to TABS |
| `src/lib/api/admin.js` | Modified — add content engine API functions |
| `src/components/admin/content-engine/CreatePost.jsx` | New — image paste + caption UI |
| `src/components/admin/content-engine/NewsFeed.jsx` | New — news aggregator UI |
| `src/components/admin/content-engine/Generator.jsx` | New — template engine UI |
| `src/components/admin/content-engine/Queue.jsx` | New — scheduler/calendar UI |
| `src/components/admin/content-engine/PostLog.jsx` | New — post history UI |
| `src/components/admin/content-engine/DraftEditor.jsx` | New — shared editor component |
