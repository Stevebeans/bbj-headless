# BBJ App - Next.js PWA

## Overview
Next.js 15 PWA for Big Brother Junkies. Headless architecture using WordPress as the CMS/API backend.

**Important:** This project uses **JavaScript** (.js/.jsx), NOT TypeScript. User preference.

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
| Page | Status |
|------|--------|
| `/` (home) | ✅ Fetches posts from WP API |
| `/posts/[slug]` | ✅ Dynamic post pages working |
| `/api/revalidate` | ✅ Webhook endpoint ready |
| Spoiler bar component | ✅ Working |
| Header/Footer | ✅ Working |

### Placeholder Pages (need building)
| Page | Status |
|------|--------|
| `/players` | Placeholder |
| `/feed-updates` | Placeholder |
| `/login` | Placeholder |
| `/contact` | Placeholder |
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

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/wp/v2/posts` | GET | Blog posts |
| `/wp/v2/comments` | GET/POST | Comments |
| `/bbj/v1/next_spoiler_bar` | GET | Spoiler bar data |
| `/bbj/v1/feed-update` | GET/POST | Live feed updates |
| `/bbj/v1/players` | GET | Player data |
| `/bbj/v1/seasons` | GET | Season data |
| `/jwt-auth/v1/token` | POST | JWT login |
| `/bbjd/v1/auth/google` | POST | Google OAuth |

### Ad System API (bbjd/v1)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/bbjd/v1/ad/{slot}` | GET | Get ad for specific slot (e.g., `sidebar-top`, `in-content-1`) |
| `/bbjd/v1/ads?slots=a,b,c` | GET | Get multiple slots at once |
| `/bbjd/v1/ad-scripts` | GET | Get header/footer ad network scripts |
| `/bbjd/v1/ads/should-show` | GET | Check if current user should see ads |

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

## Typography

| Font | Usage | CSS Class |
|------|-------|-----------|
| Roboto | Body text | `font-sans` |
| Oswald | Headings, nav | `font-osw` |
| Yanone Kaffeesatz | Primary headers | `font-display` |
| Caveat | Handwritten accents | `font-hand` |

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

| Class | Usage |
|-------|-------|
| `.btn-primary` | Primary blue button |
| `.btn-secondary` | Yellow button |
| `.card` | White card with shadow |
| `.section-header` | Section title styling |
| `.link` | Styled link |
| `.input` | Form input styling |

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

## Key Notes

- **JavaScript only** - no TypeScript
- All times are Pacific (America/Los_Angeles) - "BB Time"
- Spoiler bar shows player status for current season
- Feed updates are the core real-time content during the season
- Thursday nights = peak traffic (2-3k concurrent during live shows)
- Site should remain 100% static, only rebuild via webhook triggers
- PWA features (service worker, push notifications) not yet implemented

## Next Steps to Build

1. **Players page** - Fetch from `/bbj/v1/players`, create player cards
2. **Feed updates page** - Real-time feed display
3. **Login/Register** - Connect to JWT auth endpoints
4. **PWA service worker** - Add next-pwa or serwist
5. **Push notifications** - For spoiler alerts
6. **WordPress webhooks** - Trigger revalidation on content save
