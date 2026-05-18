# Pre-Prod Checklist

**Plan saved 2026-05-16.** Pick up when you return.

After all 4 are done → real prod push → then iterate on premium, notifications, and the rest.

---

## 1. Finalize post page

Single blog post view. Already pretty good — likely just visual refinement, not a rewrite.

### Done 2026-05-16 (top area only — body untouched per ask)
- [x] New `PostHeader.jsx` — kicker (red dot + categories) + Yanone title (text-3xl md:text-4xl, font-bold) + byline strip (avatar + author + Published/read time/comments link) + share buttons
- [x] New `ShareButtons.jsx` (client component) — X / FB / Reddit / Copy Link with copy-confirm checkmark
- [x] Stripped comment-badge overlay from `PostHero.jsx`; image now renders clean BELOW the byline
- [x] Added `.bbj-share-btn` utility class to globals
- [x] Article wrapper gets `p-5 md:p-[22px]` to match site-wide v2 card style
- [x] `PostMeta.jsx` is now orphaned but left in place (not deleted)
- [x] Pages (about/contact/etc.) keep the simpler layout — `PostHeader` is posts-only

### Next session — in-post Feed Updates component
**Component:** `src/components/posts/FeedUpdates.jsx` (singular — DIFFERENT from `src/components/home/FeedUpdatesSection.jsx`).
**Renders when:** post has `liveFeedThread` flag → `getFeedUpdatesByDate(content.date)` is fetched server-side and passed in.
**Used inside:** the post body wrapper in `src/app/[slug]/page.jsx`, after `ContentWithAds`.

Suggestions to consider:
- Visual style currently uses the old `.feed-updates` CSS-from-WP-block in `globals.css` (lines 366+). Probably wants to be brought in line with the homepage feed-update card design we built (time rail | dot | card with `font-display` title + line-clamp content + `@author-slug · replies · Join the thread`).
- Could reuse `FeedUpdateCard` from `src/components/home/` if the data shape matches (check `getFeedUpdatesByDate` response). May need a small data adapter.
- Currently has its own ad interval (`AD_INTERVAL = 5`) — keep consistent with what we did on homepage (after card 4 + card 12 for 15+).
- Date header `Live Feed Updates For {dateFormatted}` could use the new `<SectionHeader>` for consistency.

### Still TODO on post page (for whenever)
- [ ] Decide if body content needs visual changes (prose styling, in-content ads, related posts card, comments section)
- [ ] Author bio box at bottom (v2 has one — see `single.php` lines 144-163)
- [ ] Tag chips at bottom (v2 has them — `single.php` lines 130-138)
- [ ] "Keep Reading" related posts card matching v2 (`single.php` lines 179-208)

## 2. Clean up player profile page

`/players/[slug]` — currently a placeholder per CLAUDE.md status table. Build it out.

- [ ] Reference v2 PHP `single-bigbrother-players.php` + `css/single-bigbrother-players.css`
- [ ] API client probably exists — check `src/lib/api/players.js`
- [ ] Reuse `<SectionHeader>` + paper bg / container patterns
- [ ] Existing notes: `.claude/projects/player-profile.md`, `player-profile-todo.md`

## 3. Clean up season profile page

`/seasons/[slug]` — not yet created per CLAUDE.md. Build it.

- [ ] Reference v2 PHP `single-bigbrother-seasons.php` + `css/single-bigbrother-seasons.css`
- [ ] Need to scaffold route + data fetching
- [ ] Existing notes: `.claude/projects/season-profile.md`, `bb-seasons.md`

## 4. Live feed update hub

`/live-feed-updates` — exists, needs polish/QA.

- [ ] Run through the page as a user; flag anything broken
- [ ] Audit visuals against the homepage Feed Updates redesign (today's work)
- [ ] Make sure pagination/filtering works
- [ ] Existing notes: `.claude/projects/feed-update.md`

---

## Then

- Prod push (real one — not yet, holding pending the above)
- Iterate on premium, notifications, etc.

## Visual conventions established 2026-05-16 (use these everywhere)

- Body bg: `bg-paper` (#F0E8D5) site-wide already
- Section card wrapper: `className="v2-primary-container-inner p-5 md:p-[22px]"`
- Section header: `<SectionHeader>` from `@/components/home` (defaults h2, supports `as="h1"`, optional `href` for linked headings)
- Visual reference: v2 PHP theme at `C:\xampp\htdocs\bbj\wp-content\themes\bbj-v2-theme\`
- Plugin deploys to **staging Cloudways** are pre-authorized; Vercel/git pushes need explicit "push" / "deploy live" directive
