# BBJ App - Next.js PWA

## Overview

Next.js 15 PWA for Big Brother Junkies. Headless architecture using WordPress as the CMS/API backend.

**Important:** This project uses **JavaScript** (.js/.jsx), NOT TypeScript. User preference.

## CRITICAL: MCP MySQL Database Configuration

**For this project (bbj-app), ONLY use the `duesaptjae` database.**

### Database Rules

| Database | Usage | Rule |
|----------|-------|------|
| `duesaptjae` | BBJ Live (production) | **USE THIS** - All queries for this project |
| `ca_db` | Different work project | **DO NOT USE** - Completely off-limits |
| `bbj_db` | Local BBJ dev | Ignore for now |

### Query Format
```sql
-- Correct: Query live BBJ database
SELECT * FROM duesaptjae.wp_posts LIMIT 10;
SELECT * FROM duesaptjae.wp_bbj_players;

-- NEVER do this (wrong project):
SELECT * FROM ca_db.wp_posts;
```

## Structure

This build will be taking a lot of data from my wordpress theme at `C:\xampp\htdocs\bbj\wp-content\themes\BBJ` and likely a lot of data from both plugins at:
`C:\xampp\htdocs\bbj\wp-content\plugins\bbj-tools` and `C:\xampp\htdocs\bbj\wp-content\plugins\bbj-v2`. Anything NEW that is created in PHP data (APIs, etc) I want to be placed in the latest plugin: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data` as I would like to just upload -data to my server and use that for all the NEXT.js calls

### IMPORTANT: Plugin Edit Location

**ALWAYS edit the WordPress plugin directly at:**
```
C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\
```

**DO NOT use** `C:\xampp\htdocs\bbj-app\wp-plugin\` - this folder is deprecated and not used by WordPress. The symlink has been removed.

## Working Style

- **Ask questions and make suggestions** - Proactively ask clarifying questions and suggest improvements or alternatives
- **Performance is priority #1** - This build targets ultimate performance. Always consider the fastest, most efficient approach
- **Use latest tech** - Prefer modern APIs, newest stable packages, and cutting-edge best practices
- **Challenge assumptions** - If there's a better way, speak up

## Git Workflow - Worktrees

**When starting a new feature/project, ask the user if they want to create a git worktree instead of just a branch.**

Worktrees allow running multiple branches simultaneously on different ports, which is useful for:
- Testing features in parallel
- Running multiple Claude instances on different features
- A/B comparisons between branches

Current worktree setup:
| Folder | Branch | Port |
|--------|--------|------|
| `bbj-app` | `main` | 3000 |
| `bbj-app-ads` | `feature/ad-go-ad-free-cta` | 3010 |
| `bbj-app-comments` | `feature/comment-system-v2` | 3011 |
| `bbj-app-pages` | `adding-pages` | 3012 |

To create a new worktree:
```bash
git worktree add ../bbj-app-{name} {branch-name}
cp .env.local ../bbj-app-{name}/.env.local
cd ../bbj-app-{name} && npm install
npm run dev -- -p {port}
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL (Frontend)                    │
│                                                         │
│   Next.js App Router                                    │
│   - Static pages (on-demand revalidation)               │
│   - Edge-cached globally                                │
│   - PWA with push notifications                         │
│                                                         │
└─────────────────────────────────────────────────────────┘
                          │
                          │ REST API / GraphQL
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 WORDPRESS (Backend API)                  │
│                                                         │
│   - Content management (wp-admin)                       │
│   - User authentication (JWT + Google OAuth)            │
│   - Custom REST endpoints                               │
│   - Database (players, seasons, posts, feed updates)    │
│                                                         │
│   Location: ../bbj/ (sibling folder)                    │
└─────────────────────────────────────────────────────────┘
```

## Key Principle: On-Demand Static Regeneration

The site is **100% static** until content changes. No polling, no timed revalidation.

**Rebuild triggers (via webhook to /api/revalidate):**

- Blog post published/updated → rebuild home + post page
- Spoiler bar updated → rebuild spoiler bar
- Feed update posted → rebuild feed section
- Comment posted → rebuild post page

## Current Status

### Built & Working

| Page                  | Status                        |
| --------------------- | ----------------------------- |
| `/` (home)            | ✅ Fetches posts from WP API  |
| `/posts/[slug]`       | ✅ Dynamic post pages working |
| `/api/revalidate`     | ✅ Webhook endpoint ready     |
| Spoiler bar component | ✅ Working                    |
| Header/Footer         | ✅ Working                    |

### Placeholder Pages (need building)

| Page              | Status      |
| ----------------- | ----------- |
| `/players`        | Placeholder |
| `/feed-updates`   | Placeholder |
| `/login`          | Placeholder |
| `/contact`        | Placeholder |
| `/privacy-policy` | Placeholder |

### Not Yet Created

- `/players/[slug]` - Single player page
- `/seasons/[slug]` - Single season page
- `/register` - Registration page
- Service worker for PWA
- Push notifications

## API Endpoints

### WordPress REST API

Base URL: `https://bigbrotherjunkies.com/wp-json`

| Endpoint                   | Method   | Description       |
| -------------------------- | -------- | ----------------- |
| `/wp/v2/posts`             | GET      | Blog posts        |
| `/wp/v2/comments`          | GET/POST | Comments          |
| `/bbj/v1/next_spoiler_bar` | GET      | Spoiler bar data  |
| `/bbj/v1/feed-update`      | GET/POST | Live feed updates |
| `/bbj/v1/players`          | GET      | Player data       |
| `/bbj/v1/seasons`          | GET      | Season data       |
| `/jwt-auth/v1/token`       | POST     | JWT login         |
| `/bbjd/v1/auth/google`     | POST     | Google OAuth      |

### Ad System API (bbjd/v1)

| Endpoint                   | Method | Description                                                    |
| -------------------------- | ------ | -------------------------------------------------------------- |
| `/bbjd/v1/ad/{slot}`       | GET    | Get ad for specific slot (e.g., `sidebar-top`, `in-content-1`) |
| `/bbjd/v1/ads?slots=a,b,c` | GET    | Get multiple slots at once                                     |
| `/bbjd/v1/ad-scripts`      | GET    | Get header/footer ad network scripts                           |
| `/bbjd/v1/ads/should-show` | GET    | Check if current user should see ads                           |

**Ad API Response Format:**

```javascript
// GET /bbjd/v1/ad/sidebar-top
{
  show: true,              // Whether to display ad
  slot: "sidebar-top",
  content: "<div>...</div>",
  desktop_content: "...",
  mobile_content: "..."
}

// When user role is hidden from ads:
{ show: false, reason: "user_role" }

// When slot not found:
{ show: false, reason: "slot_not_found" }
```

### Home Page API (bbjd/v1)

| Endpoint                 | Method | Description                                |
| ------------------------ | ------ | ------------------------------------------ |
| `/bbjd/v1/hero-post`     | GET    | Get featured/hero post for homepage        |
| `/bbjd/v1/feed-updates`  | GET    | Get live feed updates (per_page param)     |
| `/bbjd/v1/houseboard`    | GET    | Get HoH, PoV, Nominees, Have Nots          |
| `/bbjd/v1/season-stats`  | GET    | Get season progress and player standings   |

### Search API (bbjd/v1)

| Endpoint                     | Method | Description                                |
| ---------------------------- | ------ | ------------------------------------------ |
| `/bbjd/v1/search?query=term` | GET    | Search across all content types            |

**Search API Response Format:**

```javascript
// GET /bbjd/v1/search?query=janelle
{
  general: [        // Posts & Pages
    { id, title, permalink, excerpt, date }
  ],
  players: [        // Big Brother Players
    { id, title, permalink, player_image, abbreviation }
  ],
  seasons: [        // Big Brother Seasons
    { id, title, permalink }
  ],
  feed_updates: [   // Live Feed Updates
    { id, title, permalink, excerpt, thumbnail, date, time }
  ]
}
```

### Revalidation Webhook

```
POST /api/revalidate
Body: { secret: "xxx", type: "post", slug: "post-slug" }

Types: post, spoiler-bar, feed-update, comment, player, all
```

## Color Palette

```javascript
colors: {
  primary: {
    400: "#4D6D88",    // primarySoft
    500: "#35546e",    // primary500 (main blue)
    600: "#2D4B65",    // primaryHard
  },
  secondary: {
    400: "#ffd970",    // secondSoft
    500: "#FFBF0F",    // second500 (main yellow)
    600: "#FA910A",    // secondHard (orange)
  },
  accent: {
    red: "#E55C41",    // thirdColor
  }
}
```

### Houseguest Status Colors

Used for spoiler bar, player cards, and any status indicators throughout the site.

| Status | Tailwind Class | Hex | Usage |
|--------|----------------|-----|-------|
| **HoH** | `emerald-600` | #059669 | Head of Household - power/winning |
| **Winner** | `emerald-600` | #059669 | Season winner - same as HoH |
| **PoV** | `yellow-500` | #EAB308 | Power of Veto - golden medallion |
| **Nominated** | `red-500` | #EF4444 | On the block - danger |
| **Active** | `slate-200/700` | #E2E8F0 | Still in the game, no special status |
| **Safe** | `green-100/400` | #DCFCE7 | Safe for the week |
| **Jury** | `indigo-500` | #6366F1 | Jury member - dignified purple |
| **Evicted** | `slate-400` | #94A3B8 | Out of the game - muted grey |
| **Have-Not** | `amber-700` | #B45309 | Have-not status - uncomfortable |
| **Runner-up** | `sky-500` | #0EA5E9 | Second place - silver/blue |
| **AFP** | `pink-500` | #EC4899 | America's Favorite Player |

**Image effects for eliminated players:**
- Evicted: `grayscale opacity-70`
- Jury: `grayscale-[50%] opacity-80`

## Typography

| Font              | Usage               | CSS Class      |
| ----------------- | ------------------- | -------------- |
| Roboto            | Body text           | `font-sans`    |
| Oswald            | Headings, nav       | `font-osw`     |
| Yanone Kaffeesatz | Primary headers     | `font-display` |
| Caveat            | Handwritten accents | `font-hand`    |

## Actual Folder Structure (Current)

```
src/
├── app/
│   ├── layout.jsx              # Root layout (header, footer, fonts)
│   ├── page.jsx                # Home page (fetches posts)
│   ├── posts/
│   │   └── [slug]/page.jsx     # Single post (working)
│   ├── players/page.jsx        # Placeholder
│   ├── feed-updates/page.jsx   # Placeholder
│   ├── login/page.jsx          # Placeholder
│   ├── contact/page.jsx        # Placeholder
│   ├── privacy-policy/page.jsx # Placeholder
│   └── api/
│       └── revalidate/route.js # Webhook endpoint
│
├── components/
│   ├── layout/
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   ├── spoiler-bar/
│   │   └── SpoilerBar.jsx
│   └── posts/
│       └── PostCard.jsx
│
├── lib/
│   └── api/
│       ├── wordpress.js        # WP REST client
│       ├── posts.js            # Post fetching
│       └── spoiler-bar.js      # Spoiler bar data
│
└── styles/
    └── globals.css             # Tailwind + component classes
```

## CSS Utility Classes

Defined in `globals.css`:

| Class             | Usage                  |
| ----------------- | ---------------------- |
| `.btn-primary`    | Primary blue button    |
| `.btn-secondary`  | Yellow button          |
| `.card`           | White card with shadow |
| `.section-header` | Section title styling  |
| `.link`           | Styled link            |
| `.input`          | Form input styling     |

## Data Models

### Post

```javascript
{
  id: number,
  slug: string,
  title: string,
  excerpt: string,
  content: string,
  date: string,
  author: { name: string, avatar: string },
  featuredImage: string | null,
  categories: string[],
  commentCount: number
}
```

### SpoilerPlayer

```javascript
{
  player_id: number,
  name: string,
  nickname: string,
  photo: string,
  status: 'winner' | 'runner_up' | 'afp' | 'jury' | 'evicted' | 'active',
  season_id: number
}
```

## Authentication Flow

1. **Email/Password Login:**

   - POST to `/jwt-auth/v1/token`
   - Store JWT in httpOnly cookie
   - Validate on protected routes

2. **Google OAuth:**
   - Use Google Identity Services on frontend
   - Send credential to `/bbjd/v1/auth/google`
   - Backend verifies, creates/links user, returns JWT

Auth system is built in WordPress (`../bbj/wp-content/plugins/bigbrotherjunkies-data/src/Auth/`)

## Development Commands

```bash
npm run dev      # Development server with hot reload (localhost:3000)
npm run build    # Production build (Vercel runs this)
npm run start    # Serve production build locally
npm run lint     # ESLint
```

## Environment Variables

```env
# .env.local
WORDPRESS_API_URL=https://bigbrotherjunkies.com/wp-json
NEXT_PUBLIC_SITE_URL=http://localhost:3000
REVALIDATION_SECRET=your-secret-here
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## Reference Files (WordPress)

When implementing features, reference the WordPress installation:

- Colors: `../bbj/wp-content/themes/BBJ/tailwind.config.js`
- Components: `../bbj/wp-content/themes/BBJ/template-parts/`
- API endpoints: `../bbj/wp-content/plugins/bbj-v2/includes/Routes/`
- Auth system: `../bbj/wp-content/plugins/bigbrotherjunkies-data/src/Auth/`

## SEO Guidelines

**This site relies heavily on search traffic. Follow these rules strictly.**

### Timestamps & Dates

| Element | Treatment | Why |
|---------|-----------|-----|
| BB Time (header/nav) | `data-nosnippet` attribute | Prevents Google from misreading as article date |
| Blog post dates | JSON-LD `datePublished` + `dateModified` | Proper structured data for search results |
| Feed update dates | JSON-LD `datePublished` + `dateModified` | Shows in search as "X hours ago" |
| Comment dates | `data-nosnippet` or exclude from schema | Don't confuse with article dates |

### Structured Data (JSON-LD)

Always include on content pages:

```javascript
// Blog posts - use BlogPosting schema
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "Post Title",
  "datePublished": "2024-07-15T10:30:00-07:00",  // ISO 8601 with timezone
  "dateModified": "2024-07-15T14:20:00-07:00",
  "author": { "@type": "Person", "name": "Author Name" },
  "image": "https://...",
  "description": "..."
}

// Feed updates - use LiveBlogPosting for the container
{
  "@context": "https://schema.org",
  "@type": "LiveBlogPosting",
  "liveBlogUpdate": [...]
}
```

### Meta Tags

Every page needs:
- `<title>` - Unique, descriptive, 50-60 chars
- `<meta name="description">` - Unique, 150-160 chars
- `<link rel="canonical">` - Prevent duplicate content
- Open Graph tags for social sharing

### Images

- Always use descriptive `alt` text
- Use Next.js `<Image>` for automatic optimization
- Include `width` and `height` to prevent CLS
- Use WebP format (Next.js does this automatically)

### Performance (Core Web Vitals)

- **LCP**: Use `priority` on above-fold images (logo, hero)
- **CLS**: Always specify image dimensions, avoid layout shifts
- **INP**: Keep JavaScript minimal, use React Server Components

### What NOT to Do

- Never use `<time>` elements for non-content dates without `data-nosnippet`
- Never duplicate title/description across pages
- Never block Googlebot from static assets
- Never use hidden text or keyword stuffing
- Never forget trailing slashes consistency (pick one, stick with it)

### Sitemap & Robots

- Sitemap auto-generated at `/sitemap.xml`
- Robots.txt should allow all crawlers for public content
- Use `noindex` only for user dashboard, login, etc.

## Development Standards

### Required for All Components

| Standard | Implementation |
|----------|----------------|
| **Skeleton loading** | Use skeleton states for async data |
| **Image optimization** | Always use `next/image` with width/height |
| **Error boundaries** | Wrap components that fetch data |
| **Reusable code** | Extract common patterns into shared components |

### Performance Targets

- LCP < 2.5s
- CLS < 0.1
- INP < 200ms

### Code Patterns

```jsx
// Always use skeleton loading for async content
{isLoading ? <Skeleton /> : <Content />}

// Always use Next.js Image
import Image from 'next/image';
<Image src={url} alt="descriptive text" width={300} height={200} />

// Wrap data-fetching components in error boundaries
<ErrorBoundary fallback={<ErrorState />}>
  <DataComponent />
</ErrorBoundary>
```

## Key Notes

- **JavaScript only** - no TypeScript
- All times are Pacific (America/Los_Angeles) - "BB Time"
- Spoiler bar shows player status for current season
- Feed updates are the core real-time content during the season
- Thursday nights = peak traffic (2-3k concurrent during live shows)
- Site should remain 100% static, only rebuild via webhook triggers
- PWA features (service worker, push notifications) not yet implemented

## Roadmap

**Full roadmap:** `.claude/projects/roadmap.md`

**Target:** Launch before BB28 (July 2026)

### Current Phase: Core User Experience

| Priority | Feature | Status |
|----------|---------|--------|
| High | Comment system enhancements | In Progress |
| High | Ad system & "Go Ad-Free" CTAs | Not Started |
| High | Login/Registration with Google OAuth | Not Started |
| High | Mailpoet subscription integration | Not Started |

### Next Up: Content Pages

- Player Directory & Profiles
- Season Directory & Profiles
- Stats Page
- Feed Updates Hub

See roadmap for full breakdown and timeline.
