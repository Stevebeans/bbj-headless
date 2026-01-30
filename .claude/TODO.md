# BBJ Next.js Site - Todo Checklist

## Pages to Build

### Currently Placeholder (need real implementation)
- [ ] `/players` - Player listing page (fetch from `/bbj/v1/players`)
- [ ] `/feed-updates` - Live feed updates page
- [ ] `/login` - Login form (connect to JWT auth)
- [ ] `/register` - Registration form
- [ ] `/contact` - Contact form
- [ ] `/privacy-policy` - Privacy policy content

### Not Yet Created
- [ ] `/players/[slug]` - Single player page
- [ ] `/seasons` - Seasons listing page
- [ ] `/seasons/[slug]` - Single season page
- [ ] `/user-dashboard` - User settings/dashboard
- [ ] `/logout` - Logout handler
- [ ] `/search` - Search results page
- [ ] `/page/[num]` - Paginated posts archive

## Components to Build

### Feed Updates
- [ ] `FeedUpdateCard.jsx` - Individual feed update display
- [ ] `FeedUpdateList.jsx` - Feed updates container with infinite scroll or pagination
- [ ] Feed update voting system

### Players
- [ ] `PlayerCard.jsx` - Player card for listings
- [ ] `PlayerProfile.jsx` - Full player profile display
- [ ] `SeasonRoster.jsx` - Season's player grid

### Auth
- [ ] `LoginForm.jsx` - Email/password login
- [ ] `RegisterForm.jsx` - Registration form
- [ ] `GoogleLoginButton.jsx` - Google OAuth button
- [ ] `AuthProvider.jsx` - Auth context/state management
- [ ] `ProtectedRoute.jsx` - Route protection wrapper

### Comments
- [ ] `CommentList.jsx` - Comments display
- [ ] `CommentForm.jsx` - Add comment form
- [ ] `CommentReply.jsx` - Reply to comment

### Ads
- [ ] Connect `AdPlaceholder` to actual ad API (`/bbjd/v1/ad/{slot}`)
- [ ] Ad script injection from `/bbjd/v1/ad-scripts`
- [ ] User role check for ad-free experience

### Search
- [ ] `SearchBar.jsx` - Functional search with dropdown results
- [ ] Search API integration

## Features to Implement

### Authentication
- [ ] JWT token storage (httpOnly cookies)
- [ ] Login/logout flow
- [ ] Google OAuth integration
- [ ] Protected routes
- [ ] User session persistence

### PWA
- [ ] Service worker setup (next-pwa or serwist)
- [ ] Offline support
- [ ] Push notifications for spoiler alerts
- [ ] App manifest updates

### Real-time Features
- [ ] Live feed update polling or WebSocket
- [ ] Comment real-time updates
- [ ] Spoiler bar live updates

### SEO & Performance
- [ ] JSON-LD structured data for posts
- [ ] Open Graph meta tags
- [ ] Twitter card meta tags
- [ ] Sitemap generation
- [ ] robots.txt

### WordPress Integration
- [ ] Webhook handlers for all content types
- [ ] Comment posting to WP
- [ ] User sync with WP

## Styling & Polish

### Dark Mode
- [x] Theme toggle in header
- [x] localStorage persistence
- [x] All components dark-mode friendly
- [ ] System preference detection on first visit

### Responsive
- [x] Mobile menu
- [x] Responsive header
- [x] Responsive footer
- [x] Responsive sidebar
- [ ] Test all breakpoints thoroughly

### Accessibility
- [ ] Keyboard navigation audit
- [ ] Screen reader testing
- [ ] Focus states on all interactive elements
- [ ] ARIA labels audit

## API Endpoints to Use

### Posts & Content
- [x] `GET /wp/v2/posts` - Blog posts
- [ ] `GET /wp/v2/comments` - Comments
- [ ] `POST /wp/v2/comments` - Post comment

### BBJ Custom
- [x] `GET /bbj/v1/next_spoiler_bar` - Spoiler bar data
- [ ] `GET /bbj/v1/feed-update` - Feed updates
- [ ] `POST /bbj/v1/feed-update` - Post feed update (admin)
- [ ] `GET /bbj/v1/players` - Player data
- [ ] `GET /bbj/v1/seasons` - Season data

### Auth
- [ ] `POST /jwt-auth/v1/token` - JWT login
- [ ] `POST /bbjd/v1/auth/google` - Google OAuth

### Ads
- [ ] `GET /bbjd/v1/ad/{slot}` - Get ad for slot
- [ ] `GET /bbjd/v1/ads?slots=a,b,c` - Batch ad fetch
- [ ] `GET /bbjd/v1/ad-scripts` - Ad network scripts
- [ ] `GET /bbjd/v1/ads/should-show` - Check if user sees ads

## Revalidation Webhook Types
- [x] `post` - Blog post changes
- [ ] `spoiler-bar` - Spoiler bar updates
- [ ] `feed-update` - Feed update posted
- [ ] `comment` - Comment posted
- [ ] `player` - Player data changes
- [ ] `all` - Full site rebuild

## Notes

- Site should remain 100% static until webhook triggers rebuild
- Thursday nights = peak traffic (2-3k concurrent)
- All times are Pacific (BB Time)
- JavaScript only, no TypeScript
