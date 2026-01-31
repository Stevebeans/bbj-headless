# BBJ Next.js Roadmap

**Last Updated:** January 30, 2026 (Feed Updates system complete)
**Target Launch:** Before BB28 (July 2026)
**Status:** Off-season development

---

## Phase 1: Core User Experience (Priority: High)

These directly impact user engagement and revenue.

### 1.1 Comment System Enhancements

- [x] Finish comment section UI/UX
- [x] Add reply threading with proper indentation (3 levels deep)
- [x] Implement @mentions with autocomplete (Jan 2026)
  - User search API with indexed `bbj_active_users` table (only real commenters, not spam)
  - Autocomplete dropdown with avatar, display name, rank badge
  - Keyboard navigation (Arrow keys, Enter, Escape)
  - Client-side caching with localStorage
- [x] Add comment reactions (beyond just voting) - emoji reactions added
- [x] "Staff pick" / Pinned comments (Jan 2026)
  - Pin/unpin endpoints for moderators
  - StaffPickBadge component with star icon
  - Pinned comments float to top
- [x] Comment sorting options (newest, oldest, most voted)
- [ ] User comment history on profile
- [x] Gamification - User rank system (Newbie → Legend based on comments + karma)
- [x] Online status indicator (green dot) with session heartbeat
- [x] Author profile modal with stats, recent comments, follow system
- [x] Media attachments (image upload + Giphy integration)
- [x] Voting system (upvote/downvote)
- [x] Comment permalinks with highlight animation (Jan 2026)
  - Share button copies `?comment=123` URL
  - Scroll-to-comment on page load
  - Yellow fade highlight animation
- [x] Reply/mention notification backend (Jan 2026)
  - NotificationService creates notifications for mentions and replies
  - `bbj_notifications` table with type, actor, comment, post references
- [ ] Notification bell UI (frontend to view/manage notifications)

### 1.2 Ad System & Monetization

- [x] "Go Ad-Free" CTAs near all ad slots
- [x] Ad blocker detection with placeholder messaging
  - Show "Support BBJ - Go Premium" in blocked ad spaces
- [x] Ensure ad slots don't cause layout shift (CLS)
- [ ] Track ad blocker usage in GA4
  - Send custom event when blocker detected
  - Add GA4 query section in WP plugin to pull analytics
  - Consider frontend-only approach (GA4 API direct) vs backend proxy
- [ ] Premium badge/indicator for ad-free users
  - Revisit when user profile system (Phase 4) is built out
  - Will appear: comments, header, profile cards, leaderboards

### 1.3 Login & Registration

- [x] Complete login page UI
- [x] Google OAuth integration (tie to existing accounts)
- [x] Email/password registration
- [x] "Link Google account" for existing email users
- [x] Password reset flow (`/reset-password` with token validation)
- [x] Remember me / Keep me logged in (localStorage vs sessionStorage + 14 day vs 1 day token expiration)
- [x] Session management (token storage based on remember preference)

### 1.4 UX Polish & Performance

- [x] Skeleton loading states throughout the app (reusable components in `components/ui/Skeleton.jsx`)
- [x] Image optimization audit (ensure all use Next.js Image) - all using `next/image` with `fill` or explicit dimensions
- [x] Error boundaries for graceful error handling (`app/error.jsx`)
- [x] Custom 404 page with search functionality (`app/not-found.jsx`)
- [x] RSS feed for power users and aggregators (`/feed`)

---

## Phase 2: Content Pages (Priority: High)

Pages that need to exist for site parity with current WordPress site.

### 2.1 Player System

- [x] **Player Directory** `/directory`
  - Grid view with player cards
  - Filter by season, gender, achievements (winner/AFP/etc)
  - Search functionality
  - Sort by name, season
  - Pagination with per-page options

- [x] **Player Profile** `/players/[slug]`
  - Bio, photo, stats
  - Season appearances with results (Winner, Runner Up, AFP, Jury, Evicted)
  - Competition wins (HoH, PoV, etc.)
  - Social media links
  - Related posts/feed updates
  - Castmates section with season dropdown
  - JSON-LD structured data for rich snippets
  - [x] **Add `finish_place` field to database** - Track exact placement (1st, 2nd, 3rd, etc.) for display in player hero badges (added to `wp_bbj_v2_player_season` table)

- [ ] **Player Comparison Pages** `/players/compare/[player1]-vs-[player2]`
  - Auto-generated head-to-head comparisons
  - Stats comparison table
  - SEO-optimized for "Player X vs Player Y" searches
  - Track analytics on which comparisons are popular

### 2.2 Season System

- [x] **Season Directory** `/directory?tab=seasons`
  - All seasons table with dates, winner, AFP, runner-up
  - Admin edit links

- [x] **Season Profile** `/bigbrother-seasons/[slug]`
  - Cast grid with status indicators (PlayerGrid component)
  - Season header with key info (SeasonHeader)
  - Live Now section for current season (LiveNowSection)
  - Competition leaderboards (Leaderboards)
  - Season info sidebar (SeasonInfoSidebar)
  - JSON-LD structured data (SeasonJsonLd)
  - [ ] Week-by-week breakdown (future enhancement)

### 2.3 Stats Page

- [x] **Stats Tab** `/directory?tab=stats` (basic implementation)
  - Overview stats (total players, seasons, gender breakdown)
  - Sample competition stats
  - Premium-locked advanced stats section
- [ ] **Stats Hub** `/stats` (full standalone page - future)
  - All-time competition wins leaderboard
  - Most days played
  - Nominations survived
  - Interactive filters

### 2.4 Player Map

- [ ] **Interactive Map** `/directory?tab=map`
  - Map visualization of player hometowns (data ready: lat/lng imported)
  - Click markers to see player info
  - Filter by season, winner status, etc.
  - Heat map option showing player density by region
  - Current placeholder: "Coming Soon" message

### 2.5 Static Pages

- [x] Privacy Policy `/privacy-policy` (WordPress page via `[slug]`)
- [x] Terms of Service `/terms` (WordPress page via `[slug]`)
- [x] Contact `/contact` (full Next.js page with form + reCAPTCHA)
- [x] About `/about` (WordPress page via `[slug]`)
- [ ] Advertise `/advertise` (needs custom design)
- [ ] Premium/Membership info `/premium` (needs custom design, tie to Stripe)

---

## Phase 3: Feed Updates & Live Coverage (Priority: High for July)

The core differentiator during the season.

### 3.1 Feed Updates Hub ✅

**Status:** Complete (Jan 30, 2026)

- [x] **Feed Updates Page** `/feed-updates`
  - Chronological feed display with archive
  - Date range filtering (today, yesterday, week, month, year)
  - Search within updates
  - Sort options (newest, oldest, highest rated, lowest rated)
  - Pagination with load more

- [x] **Single Feed Update Page** `/feed-updates/[slug]`
  - Full content display with sidebar
  - Voting (upvote/downvote)
  - Comment section integration
  - SEO-friendly auto-generated titles ("BB27 Feed Update - Jan 30, 3:45 PM PT")

- [x] **Home Page Integration**
  - Recent comments preview (last 3 replies per update)
  - Quick Reply for premium/supporter users
  - Comment count display

- [x] **Supporter/Premium Features**
  - Quick Reply from home page (supporters only)
  - `is_supporter` flag based on Supporter Roles setting in WP admin
  - Upsell tooltip for non-supporters

- [ ] **Future Premium QOL Features**
  - Auto-refresh toggle (WebSocket or polling)
  - Desktop notifications for new updates
  - "Unread" indicator
  - Bookmark/save updates
  - Custom filters (hide spoilers, show game-only)

### 3.2 Feed Updater Widget ✅

**Status:** Complete (Jan 30, 2026)

- [x] Floating updater bar for staff (appears on all pages when logged in with updater role)
- [x] Quick post interface with rich text
- [x] Mode toggle (Feed Update vs Show Update)
- [x] Image upload support
- [x] Social crossposting checkboxes:
  - [x] Bluesky (with season hashtag)
  - [x] Facebook
- [x] Auto-include current season hashtag
- [x] Social config check (shows disabled state when not configured)
- [x] Success/error feedback with social posting results

**Files:**

- `src/components/feed-updates/FloatingUpdater.jsx` - Floating bar UI
- `src/components/feed-updates/FeedUpdatesArchive.jsx` - Archive with filters
- `src/components/feed-updates/FeedUpdateCard.jsx` - Card for archive (with voting)
- `src/components/home/FeedUpdateCard.jsx` - Card for home (with quick reply)
- `src/app/feed-updates/page.jsx` - Archive page
- `src/app/feed-updates/[slug]/page.jsx` - Single update page
- `wp-plugin/.../Api/FeedUpdateRoutes.php` - CRUD, voting, social posting
- `wp-plugin/.../Api/HomeRoutes.php` - Feed updates list with recent_comments
- `wp-plugin/.../FeedUpdates/BlueskyClient.php` - Bluesky API integration
- `wp-plugin/.../FeedUpdates/FacebookClient.php` - Facebook API integration

---

## Phase 4: User Profiles & Stripe (Priority: Medium)

### 4.1 User Profile Page

- [x] Settings page with tabs (Profile, Notifications, Premium, Help) - `/settings`
- [x] Avatar linked to settings page in header
- [x] **Save functionality for profile fields** (display name, avatar, bio, favorite player)
- [x] **Settings API endpoint** `/bbjd/v1/settings` for fetching/updating user settings
- [x] Email change with verification flow
- [x] Notification settings with premium lock for feed updates
- [x] Help/FAQ tab with dynamic rank information
- [ ] **Polish Notifications tab** - Wire up to MailPoet once integrated (see 7.1)
- [ ] **Polish Premium tab** - Wire up to Stripe once integrated (see 4.2)
- [ ] Comment history
- [ ] Saved/bookmarked content
- [ ] Account linking (Google, email)
- [x] **Rank progression display** - Shows current rank, progress bars for comments/karma toward next rank (implemented in Premium tab)
- [ ] **Public User Profile Page** `/users/[username]` - Public-facing profile page showing:
  - User avatar, display name, bio
  - Rank badge and karma score
  - Favorite player (if set)
  - Comment history (public comments only)
  - Member since date
  - Premium badge (if supporter)

### 4.2 Stripe Integration

- [ ] Subscription management in profile
- [ ] Plan selection (monthly/annual) with annual discount
- [ ] Payment method management
- [ ] Cancel/pause subscription
- [ ] Invoice history
- [ ] Upgrade/downgrade flows

### 4.3 Premium Tiers & Gifting

- [ ] Tiered premium: Basic (ad-free) vs. VIP (all features)
- [ ] Gift subscriptions system
- [ ] "Top Gifters" leaderboard (prominent but not distracting)
- [ ] Gift redemption flow

---

## Phase 5: Admin & Staff Tools (Priority: Medium)

### 5.1 Simplified Post Creator

- [ ] Streamlined "New Post" interface for co-writers
- [ ] Auto-select current season category
- [ ] **Required** featured image with preview
- [ ] Simple rich text editor (not full Gutenberg)
- [ ] Draft/publish workflow
- [ ] SEO fields (title, description) with helpers

### 5.2 Player Photo Tool ✅

**Status:** Complete and working! (Jan 25, 2026)

**What was built:**

- [x] "Player Photos" tab on season edit page (`/bigbrother-seasons/[slug]/edit#photos`)
- [x] Auto-search UI: click "Search" → shows 3 photo options from BB Wiki/Wikipedia
- [x] Next.js API routes (`/api/admin/search-player-photos`, `/api/admin/save-player-photo`, `/api/admin/proxy-image`)
- [x] Image proxy to bypass Fandom hotlink protection
- [x] WordPress backend downloads image, crops to 375x375, converts to WebP
- [x] Source badges show where each photo came from
- [x] Tab hash persistence (URL updates with #photos, #info, etc.)

**Technical approach:**

- Uses Fandom (Big Brother Wiki) and Wikipedia MediaWiki APIs instead of Google Custom Search
- Image proxy fetches images server-side to bypass hotlink protection
- Google Custom Search API was abandoned (broken for new users as of Jan 2026)

**Files:**

- `src/app/api/admin/search-player-photos/route.js` - Queries Fandom/Wikipedia APIs
- `src/app/api/admin/save-player-photo/route.js` - Proxies save to WordPress
- `src/app/api/admin/proxy-image/route.js` - Bypasses hotlink protection
- `src/lib/api/playerPhotos.js` - Client-side API functions
- `src/app/bigbrother-seasons/[slug]/edit/components/PlayerPhotosSection.jsx` - UI component
- `wp-plugin/.../PlayerPhotoRoutes.php`, `PlayerPhotoFetcher.php` - WordPress backend

**Future improvements:**

- [ ] Bulk photo search with progress indicator
- [ ] Better image preview before saving
- [ ] Face detection to auto-crop centered on face

### 5.3 Player Edit Screen

- [ ] Player edit interface (before import)

### 5.4 Data Import Tools ✅

**Status:** Core functionality complete (Jan 25, 2026)

**What was built:**

- [x] CSV data files created: `players.md` (BB1-BB27), `cities_with_coords.csv` (geo coordinates)
- [x] Import page (`ImportPage.php`) reads CSV files, merges geo data
- [x] Season import with duplicate detection (skips existing seasons)
- [x] Player import with name matching (creates new or links existing to seasons)
- [x] Update tool (`DevToolsPage.php`) populates hometown/finish_place on existing records
- [x] Name alias mapping for nickname discrepancies (Bunky/Bill, Nakomis/Jennifer, JC/Joseph, etc.)
- [x] Database migrations for hometown columns and finish_place column

**Files:**

- `.claude/data/players.md` - All BB1-BB27 players with hometown, finish_place, evicted_date
- `.claude/data/cities_with_coords.csv` - Lat/lng for all player hometowns
- `wp-plugin/.../Admin/Pages/ImportPage.php` - Import logic with preview
- `wp-plugin/.../Admin/Pages/DevToolsPage.php` - Migrations + update existing records

**Production deployment:**

- Upload CSV files to `wp-content/uploads/bbj-import/players.md` and `cities_with_coords.csv`
- Run Import page to add missing seasons/players
- Run "Update Player Data from CSV" to populate hometown/finish_place

**Future improvements:**

- [ ] Bulk photo import integration
- [ ] Validation preview before import
- [ ] Progress indicator for large imports

### 5.5 Database Cleanup Tools

- [ ] Spam user cleanup script
  - Identify users with 0 posts, 0 comments, suspicious email patterns
  - Flag bot-like registration patterns (rapid signups, similar IPs)
  - Preview before delete (dry run mode)
  - Bulk delete with logging
- [ ] Orphaned data cleanup (comments without posts, votes without comments)
- [ ] Scheduled maintenance cron job option

---

## Phase 6: Premium & Community Features (Priority: Medium)

Ideas to keep premium users engaged year-round.

### 6.1 Community Features

- [ ] User predictions/brackets for each season
- [ ] Prediction leaderboards
- [ ] Discussion threads (beyond post comments)
- [ ] Premium-only Discord integration?
- [ ] "Ask Me Anything" events with former houseguests
- [ ] Watch party coordination
- [ ] User flair system (pick favorite player/season badges)

### 6.2 Engagement Ideas

- [ ] Off-season content (rankings, retrospectives, "where are they now")
- [ ] "Remember this?" automated throwbacks (historic moments on anniversaries)
- [ ] Season retrospectives (evergreen SEO content)
- [ ] Fantasy Big Brother leagues
- [ ] Premium early access to predictions/analysis
- [ ] Exclusive podcasts or video content
- [ ] Monthly premium newsletter with insider info

### 6.3 Gamification

- [ ] User levels/ranks based on activity
- [ ] Achievement badges
- [ ] Comment streaks
- [ ] Prediction accuracy tracking
- [ ] "Superfan" verification

---

## Phase 7: PWA & Notifications (Priority: Medium-High for July)

### 7.1 MailPoet & Newsletter Integration

- [ ] **MailPoet API integration in Settings page**
  - Newsletter toggle in Notifications tab should subscribe/unsubscribe from MailPoet list
  - Check actual subscription status when loading settings (not just user meta)
  - Use MailPoet PHP API for subscribe/unsubscribe operations
- [ ] MailPoet integration for subscription boxes site-wide
- [ ] Remove dependency on form plugins
- [ ] Subscription preferences in user profile (instant, daily digest, weekly summary)
- [ ] Welcome email sequence for new subscribers
- [ ] Design new email templates (current ones are outdated)
- [ ] Set up Post Notification automations for each frequency

### 7.2 Service Worker

- [ ] Implement next-pwa or serwist
- [ ] Offline page support
- [ ] Cache strategy for static content
- [ ] Background sync for comments/actions

### 7.3 Push Notifications

- [ ] Opt-in flow for notifications
- [ ] Spoiler alert notifications
- [ ] New post notifications
- [ ] Feed update alerts (premium)
- [ ] Comment reply notifications
- [ ] Granular notification preferences

---

## Phase 8: Future Expansion

### 8.1 Multi-Show Strategy

**Decision needed:** New site vs. CPT on BBJ

**Option A: Separate Sites**

- Pros: Clean branding, dedicated audiences
- Cons: More maintenance, split SEO authority

**Option B: CPT on BBJ**

- Pros: Shared infrastructure, cross-promotion
- Cons: Brand confusion, "junkies" in URL for other shows

**Option C: Umbrella Brand**

- Create parent brand (e.g., "Reality Junkies Network")
- BBJ becomes a sub-brand
- Easier expansion path

### 8.2 Shows to Consider

- Survivor
- The Challenge
- Love Island
- The Traitors
- Amazing Race

### 8.3 Writer Recruitment

- [ ] Define compensation structure
- [ ] Create writer guidelines/style guide
- [ ] Build writer onboarding flow
- [ ] Consider freelance vs. revenue share model

---

## Ideas Under Consideration

Items not yet committed to the roadmap.

### Maybe Later

- **Spoiler tagging system** - User-enforced spoiler tags in comments
- **Merch integration** - If you have/want merch, integrate store

### Integrated into Roadmap

The following suggestions have been added to their respective phases:

- Phase 1: Skeleton loading, image optimization, error boundaries, 404 page, RSS feed
- Phase 2: Structured data for players, auto-generated comparison pages
- Phase 4: Tiered premium, annual discount, gift subscriptions with leaderboard
- Phase 6: User flair, "Remember this?" throwbacks, season retrospectives, AMAs

---

## Current Focus

**Completed:** Phase 3 (Feed Updates) ✅

**Next up:** Phase 4 (User Profiles & Stripe) → Finish 2.5 (Advertise/Premium pages) + Stripe integration and billing system in user setting page → Phase 7 (PWA)

## Timeline Suggestion

| Phase   | Target    | Notes                            |
| ------- | --------- | -------------------------------- | --- |
| Phase 1 | Feb 2026  | Core UX - comments, auth, ads    |
| Phase 2 | Mar 2026  | Content pages - players, seasons |
| Phase 3 | Apr 2026  | Feed updates system              | Th  |
| Phase 4 | May 2026  | User profiles, Stripe            |
| Phase 5 | May 2026  | Admin tools                      |
| Phase 6 | Ongoing   | Community features               |
| Phase 7 | June 2026 | PWA ready for BB28               |
| Phase 8 | Post-BB28 | Expansion planning               |

---

## Notes

- **JavaScript only** - No TypeScript per user preference
- **Performance first** - Static generation, on-demand revalidation
- **Mobile-first** - High mobile traffic expected
- **BB Time** - All times in Pacific timezone
- **On-demand ISR** - All dynamic pages (posts, players, seasons, feed updates) build on first visit, not at deploy time. This reduced Vercel build time from ~10 minutes to ~48 seconds and avoids WordPress API rate limiting (429 errors).
- **Deployment** - Use `/full-push` command to push to git/Vercel AND deploy WordPress plugin to production via SSH

---

## Progress Tracking

Use checkboxes above to track completion. Update "Last Updated" date when making changes.

---

Comment section

I am going to use this section to build out replies to Claude so keep it active. I'll clear out it when I have a new comment

(cleared)
