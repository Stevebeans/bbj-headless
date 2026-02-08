# BBJ Next.js Roadmap

**Last Updated:** February 7, 2026 (Added MetaBox removal plan, custom email system spec)
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
- [x] User comment history on profile (Feb 2026 - via `/users/[username]`)
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
- [x] Notification system complete (Feb 2026)
  - Bell in header with unread count badge
  - Dropdown shows recent notifications with mark all read
  - Full `/notifications` page with filters (all/unread) and pagination
  - Avatar link in header goes to notifications instead of settings
  - User setting to toggle reply notifications (Settings → Notifications)
  - Thread subscriptions: bell icon on posts to get ALL new comments
  - New notification type: `thread` for subscription notifications
  - Subscription management in Settings page (view/unsubscribe)
  - 90-day retention with weekly cron cleanup (`NotificationCleanup.php`)
  - New table: `bbj_post_subscriptions` for thread subscriptions

### 1.2 Ad System & Monetization

- [x] "Go Ad-Free" CTAs near all ad slots
- [x] Ad blocker detection with placeholder messaging
  - Show "Support BBJ - Go Premium" in blocked ad spaces
- [x] Ensure ad slots don't cause layout shift (CLS)
- [x] Track ad blocker usage in GA4 (Feb 6)
  - GA4 custom event `ad_blocker_detected` fires on detection
  - Backend queries GA4 Data API for ad blocker stats
  - Ad Blocker widget in admin Stats tab shows % and daily trend
- [x] Premium badge/indicator for ad-free users (Feb 2026)
  - Header shows "Thank you for your support!" with star icon
  - SupporterBadge component (yellow for supporter, gold with crown for lifetime)
  - Displays on public user profiles
  - [ ] Add to comments (next to rank badge)
  - [ ] Add to leaderboards (when built)

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
- [x] Premium/Membership info `/become-supporter` (complete with Stripe/PayPal checkout)

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
- [ ] **Polish Notifications tab** - Wire up to custom email system (see 7.1)
- [x] **Polish Premium tab** - Wired up to Stripe/PayPal billing system (see 4.2)
- [x] Comment history (Feb 2026 - via public profile page)
- [ ] Saved/bookmarked content
- [ ] Account linking (Google, email)
- [x] **Rank progression display** - Shows current rank, progress bars for comments/karma toward next rank (implemented in Premium tab)
- [x] **Public User Profile Page** `/users/[username]` (Feb 2026)
  - User avatar, display name, username, bio
  - Rank badge and supporter badge (supporter/lifetime)
  - Favorite player card (links to player profile)
  - Paginated comment history with vote scores
  - Member since date, online status
  - Follow/unfollow functionality
  - "View Public Profile" link in settings

### 4.2 Premium Billing System ✅

**Status:** Complete (Feb 2, 2026) - Pending live testing with real Stripe/PayPal credentials

**What was built:**

- [x] **Billing API** (`src/lib/api/billing.js`)
  - getPlans, getSubscription, createStripeCheckout, createPayPalOrder
  - capturePayPalOrder, createPayPalSubscription, getPortalUrl, cancelSubscription

- [x] **Checkout Flow** (`/become-supporter`)
  - Plan cards: Monthly ($6.95), Season Pass ($35/yr - popular badge), Lifetime ($99)
  - Stripe Checkout redirect flow (no SDK needed)
  - PayPal SDK dynamic loading with buttons
  - Auth check - shows login prompt for unauthenticated users
  - Supporter check - shows "Thank you" message for existing supporters

- [x] **Success/Cancel Pages** (`/checkout/success`, `/checkout/cancel`)
  - Success page captures PayPal orders and shows subscription details
  - Cancel page with retry button

- [x] **Settings Integration** (`/settings?tab=premium`)
  - Subscription details display (plan, price, next billing date)
  - "Manage Subscription" button → Stripe Customer Portal
  - Cancel button with confirmation modal (for PayPal customers)
  - Handles cancel_at_period_end state gracefully

- [x] **WordPress Admin** (`ApiSettingsPage.php`)
  - New admin page for Stripe/PayPal API credentials
  - Test/Live mode toggle for both providers
  - Webhook secret configuration
  - Credentials stored in WordPress options (not wp-config.php)

- [x] **Backend Services** (already existed, updated)
  - `StripeService.php` - Updated to read from ApiSettingsPage settings
  - `PayPalService.php` - Updated to read from ApiSettingsPage settings
  - Webhook handlers for both providers (role assignment automatic)

- [x] **Header Supporter Recognition**
  - Shows "Thank you for your support!" with star for supporters
  - Based on user roles: administrator, editor, supporter, lifetime

- [x] **Billing FAQ** - Added 5 billing questions to Settings Help tab

**Files:**

- `src/lib/api/billing.js` - API client
- `src/app/become-supporter/page.jsx` - Checkout page
- `src/app/checkout/success/page.jsx` - Success page
- `src/app/checkout/cancel/page.jsx` - Cancel page
- `src/app/settings/page.jsx` - PremiumTab with subscription management
- `src/components/layout/Header.jsx` - Supporter recognition
- `wp-plugin/.../Admin/Pages/ApiSettingsPage.php` - API credentials admin
- `wp-plugin/.../Billing/StripeService.php` - Stripe integration
- `wp-plugin/.../Billing/PayPalService.php` - PayPal integration
- `wp-plugin/.../Api/BillingRoutes.php` - REST endpoints

**To test in production:**

1. Add live Stripe/PayPal credentials in WP Admin → BBJ Data → API Settings
2. Configure Stripe webhook to point to `/wp-json/bbjd/v1/billing/webhook/stripe`
3. Test checkout flow with real payment methods

**Future improvements:**

- [ ] Invoice history display
- [ ] Upgrade/downgrade between plans
- [ ] Payment method management (add/remove cards)

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

### 5.6 Remove MetaBox Dependency

**Goal:** Eliminate MetaBox plugin entirely. Currently using boss's premium license — want full independence.

**What MetaBox does today:** Provides wp-admin forms for editing players, seasons, and spoiler bar. Data already lives in custom tables (`wp_bbj_players`, `wp_bbj_seasons`, `wp_bbj_player_season_new`, `wp_bbj_play_season_rel`). Templates and API routes query tables directly via `$wpdb` — MetaBox is only the admin UI layer.

**What needs replacing:**

| Admin Form | Fields | Current Table |
|------------|--------|---------------|
| **Player Editor** | first_name, last_name, nickname, gender, DOB, occupation, profile_picture, banner, social links (FB/IG/Twitter/TikTok) | `wp_bbj_players` |
| **Season Editor** | full_name, abbreviation, season_number, start_date, end_date, season_picture, banner | `wp_bbj_seasons` |
| **Spoiler Bar Manager** | Per-season player status: HoH, PoV, Jury, Nominees (1-3), Evicted, Winner, Have-Nots | `wp_bbj_player_season_new` |
| **Player-Season Links** | player, season, winner, runner_up, afp, evicted, jury | `wp_bbj_play_season_rel` |
| **Site Settings** | current_season, current_category | `bbj_settings` option |

**Implementation plan:**

- [ ] **Player management page** in Next.js admin dashboard — CRUD form with image upload for all player fields
- [ ] **Season management page** in Next.js admin dashboard — CRUD form with image upload
- [ ] **Spoiler bar admin** — visual drag-and-drop or checkbox UI for assigning player statuses per season
- [ ] **Player-season relationship editor** — assign winner/runner-up/AFP/jury/evicted per season
- [ ] **Site settings** — current season selector (move to existing admin Settings tab or WP admin)
- [ ] **API endpoints** — admin CRUD routes for all of the above (some already exist in PlayerRoutes/SeasonRoutes)
- [ ] **Remove MetaBox filters** from bbj-v2 plugin (`rwmb_meta_boxes` hooks in Players.php, Seasons.php, PlayerSeasonLink.php)
- [ ] **Remove MetaBox field definitions** from theme (`includes/MB/` directory — 11 files)
- [ ] **Deactivate MetaBox** plugin on staging, test everything still works
- [ ] **Deactivate MetaBox** on production

**References still using MetaBox (to clean up):**
- `bbj-v2/includes/PostTypes/Players.php` — `rwmb_meta_boxes` filter
- `bbj-v2/includes/PostTypes/Seasons.php` — `rwmb_meta_boxes` filter
- `bbj-v2/includes/PostTypes/PlayerSeasonLink.php` — `rwmb_meta_boxes` filter
- `bbj-tools/lib/meta-boxes.php` — player-season relationships
- Theme `includes/MB/` — 11 field group definition files (mostly commented out)

**Note:** The new `bigbrotherjunkies-data` plugin already has `PlayerRoutes.php` and `SeasonRoutes.php` with some CRUD endpoints. These just need admin form UIs built on top.

### 5.7 Admin Dashboard Redesign

- [ ] Modern dashboard layout with better visual hierarchy
- [ ] Collapsible sidebar navigation (not just cards)
- [ ] Real-time activity feed (recent comments, new users, reports)
- [ ] Quick action buttons (approve/reject reports, pin comments)
- [ ] Better stats with sparklines/mini charts
- [ ] User search with quick actions (ban, promote, view profile)
- [ ] Mobile-responsive admin UI
- [ ] Dark mode polish

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

### 7.1 Custom Email System (replacing MailPoet)

**Goal:** Self-contained email system using a third-party transactional API for delivery. We own the list, templates, and logic. They handle sending and report back stats.

**Why:** MailPoet costs $21.25/month for only 576 active subscribers, caused a recursive crawler loop that pegged the production server at 100% CPU, and adds PHP overhead on every page load. A custom system is cheaper, lighter, and gives us full control.

**Subscriber stats (as of Feb 2026):** 576 subscribed, 7,299 unconfirmed, 48,153 unsubscribed, 235 bounced

**Cost comparison at ~600 subscribers, 2-3 posts/day in summer (~90 emails/day = ~54K/month):**
- MailPoet: $21.25/month (current)
- Mailgun: ~$8/month (Flex plan, $0.80/1K after 1K free)
- Resend: Free tier covers it (3K/month free, then $20/100K)
- Amazon SES: ~$5.40/month ($0.10/1K)

**Database tables:**
- [ ] `bbj_email_subscribers` — id, user_id (nullable for non-registered), email, status (subscribed/unconfirmed/unsubscribed/bounced), confirmed_at, subscribed_at, unsubscribed_at, source (registration/widget/import)
- [ ] `bbj_email_preferences` — subscriber_id, frequency (instant/daily_digest/weekly), notify_posts (bool), notify_feed_updates (bool), notify_announcements (bool)
- [ ] `bbj_email_sends` — id, subscriber_id, email_type (post_notification/digest/welcome/reconfirmation), external_id (Mailgun/Resend message ID), sent_at, opened_at, clicked_at, bounced_at
- [ ] `bbj_email_templates` — id, name, subject_template, body_template (HTML with merge tags)

**Backend (WP Plugin):**
- [ ] `EmailService.php` — subscribe, unsubscribe, confirm, bulk send, handle webhooks
- [ ] `EmailSender.php` — adapter interface for Mailgun/Resend/SES (swap providers without changing logic)
- [ ] `EmailRoutes.php` — REST endpoints: subscribe, unsubscribe, confirm, preferences, webhook receiver
- [ ] `EmailCron.php` — daily digest compiler, weekly summary compiler, re-confirmation campaigns for inactive subscribers
- [ ] Admin settings page for API keys + provider selection
- [ ] Migration script to import active MailPoet subscribers into new tables

**Frontend (Next.js):**
- [ ] Subscribe widget (email input in sidebar/footer)
- [ ] Settings → Notifications tab wired to real subscription preferences
- [ ] Unsubscribe page with one-click + optional feedback
- [ ] Email preference center page (choose frequency, content types)

**Webhook flow (stats reporting back):**
- [ ] Provider POSTs open/click/bounce/unsubscribe events to `/bbjd/v1/email/webhook`
- [ ] Update `bbj_email_sends` with timestamps for each event
- [ ] Admin dashboard widget: open rate, click rate, bounce rate, unsubscribe trend
- [ ] Auto-flag subscribers who haven't opened in 90 days

**Subscriber lifecycle automation:**
- [ ] Welcome email on subscribe (with confirmation link)
- [ ] Re-confirmation email after 90 days inactive ("Still want to hear from us?")
- [ ] Auto-unsubscribe after re-confirmation ignored for 14 days
- [ ] Bounce handling: soft bounce → retry 3x, hard bounce → auto-unsubscribe

**Post-launch:**
- [ ] Deactivate MailPoet plugin on production (save CPU + $21.25/month)
- [ ] Clean up MailPoet database tables

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

**Completed:** Phase 3 (Feed Updates) ✅, Phase 4.2 (Premium Billing) ✅, Phase 4.1 (User Profiles) ✅

---

## Upcoming Timeline

### Immediate Next Steps (Quick Fixes) ✅

1. ~~**Nav bar order** - Change to: Home, Contact, Feed-Updates, Directory~~
2. ~~**Breadcrumb fix** - Remove `/article/` or handle uncategorized posts better~~
3. ~~**Season leaderboard progress bar** - Fix name truncation causing bar shift~~
4. ~~**Hide push notification setting** - Until mobile app is ready~~
5. ~~**Test subscribed threads** - Verify functionality works~~

### Pre-Launch Polish

6. ~~**Move JWT auth to cookies** - Migrated JWT from localStorage to httpOnly cookies for flash-free SSR (Feb 3)~~
7. **Polish remaining 4.1 items** - Saved/bookmarked content, account linking
7. **Polish remaining 4.2 items** - Invoice history, upgrade/downgrade, payment methods
8. **Finish 1.2** - GA4 ad blocker tracking
9. ~~**Home page layout** - Moved widgets to sidebar, feed updates full-width with card styling~~
10. ~~**Feed Updates page enhancements** - Sidebar, pagination, per-page setting, pill styling for update types (Feb 4)~~
11. ~~**Page Speed Insights** - Lighthouse fixes for accessibility, contrast, touch targets (Feb 3 & 5, score: 97)~~

### Pre-Launch Checklist

12. **Full user test as non-admin** - Create a fresh account (not admin), purchase a premium membership, and test the entire flow as a real user: registration, login, commenting, voting, notifications, billing, ad-free experience, settings, etc. Must feel right before launch.
13. **Push to Vercel production** - Ensure all ad blocks imported to DB
14. **Switch DNS** - Point bigbrotherjunkies.com to Vercel (requires Vercel Pro plan)
15. **Set up staging** - Map staging.bigbrotherjunkies.com for testing

### Post-DNS Switch

15. Live testing with real domain
16. Break off new features to staging workflow

---

## Site Audit (BBJ Live vs Next.js)

_Go page by page on live site to identify gaps_

### Home Page

- [x] Moved widgets (houseboard, stats, recent comments, social, watch live) to right sidebar. Feed updates now full-width with card styling (left accent border, shadow, spacing). More Stories section matches.

### Posts/Articles

- [x] Breadcrumb fixed - removed `/article/` prefix, handles uncategorized posts

### Feed Updates

- [ ] Add sidebar to /feed-updates page. Make it pagination. Let premium people set a default in settings how many feed updates per page they want while others do say 20-30
      Maybe make 'feed update' versus 'Live Show Update' a pill look

### Players

- [ ] Looks good

### Seasons

- [x] Fixed progress bar in leaderboards - name truncation no longer shifts bar

### Header/Navigation

- [x] Nav bar reordered: Home, Contact, Feed-Updates, Directory

### Footer

- [ ] Looks good

### Sidebar

- [ ] See Feed Update section

### Comments

- [ ] Looks good

### User Account

- [x] Push notification setting hidden until mobile app ready
- [x] Subscribed threads tested and working
- [ ] Wire newsletter toggle to custom email system (see Phase 7.1)

### Mobile Experience

- [ ] Run Page Speed Insights and do fixes to get better scores

### Other Pages

- [ ] _audit notes here_

---

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
