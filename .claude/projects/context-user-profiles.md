# Context: Public User Profiles

**Status:** Complete (Feb 2, 2026)
**Branch:** Merged to main

## What Was Built

Public-facing user profile page at `/users/[username]` showing a user's community presence on BBJ.

## Architecture

### Backend (WordPress Plugin)

**File:** `UserProfileRoutes.php`

Three new/enhanced endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/bbjd/v1/users/by-username/{username}` | GET | Look up user by username (delegates to getProfile) |
| `/bbjd/v1/users/{user_id}/profile` | GET | Enhanced with username, favorite_player, is_supporter, supporter_type |
| `/bbjd/v1/users/{user_id}/comments` | GET | Paginated comment history with vote scores, reply counts |

**Supporter detection logic:**
- Reads `bbjd_ad_settings` → `global_hidden_roles` to determine supporter roles
- Checks `user->roles` intersection
- `lifetime` role = lifetime type, other supporter roles = supporter type
- Admins/editors are supporters but don't show the badge

**Favorite player:**
- Stored in user meta as `bbj_favorite_player_id`
- `getPlayerById()` helper fetches player name, nickname, photo, seasons, permalink
- Same pattern as SettingsRoutes uses

### Frontend (Next.js)

**API Client:** `src/lib/api/users.js`
- `getUserProfileByUsername(username)` - server-side via bbjdFetch
- `getUserComments(userId, page, perPage)` - client-side for pagination
- `followUser(userId)` / `unfollowUser(userId)` - client-side with auth

**Components:** `src/components/users/`

| Component | Type | Purpose |
|-----------|------|---------|
| UserProfileHero | Client | Avatar, name, badges, stats, follow button |
| SupporterBadge | Client | Yellow (supporter) or gold+crown (lifetime) badge |
| FavoritePlayerCard | Server | Player photo, name, nickname, seasons, links to profile |
| CommentHistoryList | Client | Paginated list with Load More, handles API calls |
| CommentHistoryItem | Client | Single comment: post link, preview, time, votes, replies |
| UserProfileSkeleton | Server | Loading state matching page layout |

**Page:** `src/app/users/[username]/page.jsx`
- Server component with `generateMetadata` for SEO
- ISR with 60s revalidation
- `dynamicParams = true` for on-demand generation
- Fetches profile + initial comments server-side
- 404 handling via `notFound()`

**Also added:** "View Public Profile" link in Settings page → Account Information section

## Page Layout

```
Hero (gradient header, avatar, name, @username, rank badge, supporter badge, stats, follow)
Bio section (if exists)
Favorite Player card (if set, links to /bigbrother-players/[slug])
Comment History (paginated, 10 per page, Load More)
Sidebar
```

## Key Patterns Used

- Server component page with client component children (Hero, CommentHistoryList)
- Initial data fetched server-side, pagination client-side
- Reuses existing RankBadge and OnlineIndicator from comments system
- Follows same layout pattern as player profile page (v2-primary-container + Sidebar)
- Index barrel export file for clean imports

## Dependencies

- `RankBadge` from `components/comments`
- `OnlineIndicator` from `components/comments`
- `Sidebar` from `components/layout`
- `bbjdFetch` from `lib/api/wordpress`
- `useAuth` from `context/AuthContext`
- `react-icons/fa` for icons
