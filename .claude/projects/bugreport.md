# Comment System v2 - Bug Report

**Last Updated:** January 17, 2026

---

## Active Bugs

*None currently!*

---

## Fixed Bugs

### Image Upload
**Status:** Fixed (Jan 17, 2026)
**Root Cause:** Database tables not created on production
**Steve Note:** "I forgot to create the database tables on live. This is working properly."

### Reactions Display
**Status:** Fixed (Jan 17, 2026)
**Root Cause:** Database tables not created on production
**Steve Note:** "Works!"

### Giphy Selection
**Status:** Fixed (Jan 17, 2026)
**Root Cause:** Database tables not created on production
**Steve Note:** "Works"

### Reply Threading - Replies Showing at Top
**Status:** Fixed (Jan 17, 2026)
**Fix:** Updated `handleNewComment` in CommentSection.jsx to check `parent_id` before adding to top-level list.

### Reply Edit
**Status:** Working

---

## Working Features

- Comment posting
- Comment voting (up/down)
- Reply to comments (nested)
- Edit own comments
- Delete own comments
- Report comments
- Giphy search, trending & selection
- Image upload (JPG/GIF, 2MB max)
- Emoji reactions (like, love, haha, wow, sad, angry)
- Login/Auth flow
- Online status indicators

---

## Needs Testing

- [ ] Delete comment cascade (votes, reactions, media cleanup)
- [ ] Report notification emails (when threshold reached)

---

## Notes

- **Database migration required** - New tables must be created via Dev Tools page after plugin upload
- **Giphy API key** - Set in Settings > Auth Settings
- **CORS ports** - 3010, 3011, 3012 added to allowed origins
