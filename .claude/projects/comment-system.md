# Comment System Project

**Status:** Phase 1 Complete (Initial Build)
**Last Updated:** January 2026

## Overview

Custom comment system replacing WPDiscuz with voting, user ranks, and moderation features.

## Architecture

### Frontend (Next.js)
- `src/components/comments/` - All comment UI components
  - `CommentSection.jsx` - Main container with pagination & sorting
  - `CommentCard.jsx` - Individual comment with voting, replies, edit/delete
  - `CommentForm.jsx` - Authenticated comment posting
  - `VoteButtons.jsx` - Upvote/downvote with optimistic UI
  - `RankBadge.jsx` - User rank display (Newbie → Diamond)
  - `ReportModal.jsx` - Report inappropriate comments
- `src/lib/api/comments.js` - API helper functions
- `src/app/admin/comments/page.jsx` - Moderation queue

### Backend (WordPress Plugin)
Location: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\`

- `Comments/CommentSchema.php` - Database table definitions
- `Comments/CommentMigrator.php` - Migration from WPDiscuz
- `Comments/RankCalculator.php` - User rank calculation (Option B: comments + karma)
- `Api/CommentRoutes.php` - Public REST endpoints
- `Api/AdminRoutes.php` - Admin/moderation endpoints

### Database Tables
- `wp_bbj_comment_votes` - Vote storage (user_id, comment_id, vote_type)
- `wp_bbj_comment_reports` - Report queue
- `wp_bbj_comment_blacklist` - Banned words/users

## User Ranks

Based on comment count + karma (upvotes received - downvotes received):

| Rank | Comments | Karma | Badge Color |
|------|----------|-------|-------------|
| Newbie | 0-9 | - | Gray |
| Bronze | 10+ | 25+ | Amber |
| Silver | 50+ | 100+ | Slate |
| Gold | 150+ | 300+ | Yellow |
| Platinum | 500+ | 1000+ | Cyan |
| Diamond | 1000+ | 2500+ | Purple |

Special ranks (override): Admin, Big Boss, Moderator, VIP

## API Endpoints

### Public (`/wp-json/bbjd/v1/`)
- `GET /comments/{post_id}` - Get comments with pagination
- `POST /comments` - Post new comment (auth required)
- `POST /comments/{id}/vote` - Vote on comment (auth required)
- `POST /comments/{id}/report` - Report comment (auth required)
- `PUT /comments/{id}` - Edit comment (author only)
- `DELETE /comments/{id}` - Delete comment (author/mod)

### Admin (`/wp-json/bbjd/v1/admin/`)
- `GET /reports` - Pending reports queue
- `POST /comments/{id}/approve` - Approve reported comment
- `POST /comments/{id}/spam` - Mark as spam
- `GET /settings` - Get permission settings
- `POST /settings` - Update permission settings
- `POST /migrate/create-tables` - Create database tables
- `POST /migrate/wpdiscuz-votes` - Migrate old votes

## Migration Status

- [x] Database tables created (Jan 2026)
- [x] WPDiscuz votes migrated (130,523 logged-in user votes)
- [ ] User rank recalculation (run after migration)

---

## Bugs

<!-- Add bugs here as you find them -->

| # | Description | Priority | Status |
|---|-------------|----------|--------|
| 1 | _Example: Vote count not updating on reply comments_ | Medium | Open |

---

## Feature Improvements

<!-- Add feature requests/improvements here -->

| # | Description | Priority | Status |
|---|-------------|----------|--------|
| 1 | Add "load more replies" for deeply nested threads | Low | Backlog |
| 2 | Email notifications for replies to your comments | Medium | Backlog |
| 3 | Highlight OP (original poster) comments in thread | Low | Backlog |
| 4 | Add comment sorting by "controversial" | Low | Backlog |
| 5 | Inline image/GIF support in comments | Low | Backlog |

---

## Testing Checklist

- [ ] Post a new comment (logged in)
- [ ] Reply to a comment (test 3-level depth limit)
- [ ] Upvote/downvote a comment
- [ ] Edit your own comment
- [ ] Delete your own comment
- [ ] Report someone else's comment
- [ ] Admin: View reports queue
- [ ] Admin: Approve/delete reported comment
- [ ] Verify rank badge displays correctly
- [ ] Test pagination on post with many comments
- [ ] Test sorting (newest, oldest, popular)

---

## Notes

- Guest voting disabled - must be logged in
- Max reply depth: 3 levels
- Comments use WordPress native `wp_comments` table
- Votes stored separately in `wp_bbj_comment_votes`
- CORS configured in Plugin.php for localhost:3000 development
