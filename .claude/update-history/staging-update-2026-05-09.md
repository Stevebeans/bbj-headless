# Staging Update — May 9, 2026

The homepage got rebuilt to match the look of the main WordPress site. Same vibe, faster delivery. Here's what's new:

---

## What's New on the Homepage

- **New page header strip** — There's now a dark band at the top of the homepage with "Big Brother [season] Spoilers" and a scrolling ticker showing the three latest feed-update headlines. Hover the ticker to pause it.

- **"The House" strip moved up top** — The HoH / Veto / Nominees / Have-Nots block used to live in the sidebar. Now it sits right under the hero post in a compact horizontal strip with little player avatars. Easier to scan at a glance.

- **House Pulse chart (NEW)** — During the active season you'll see an 8-hour activity chart showing how many feed updates went up each hour. Color-coded so you can tell at a glance when the house is loud vs. quiet. Hidden during the off-season.

- **New sidebar layout:**
  - **Paramount+ promo card** at the top
  - Season Stats (full cast table — same as before)
  - Newsletter signup
  - Recent Comments
  - **Sticky sidebar ad** at the bottom that actually sticks as you scroll

- **Tighter heading hierarchy** — One H1 per page now, which is the right thing for search engines. The hero card title is now an H2 ("Latest Update") matching the WordPress design.

- **Sidebar cleanup site-wide** — The Paramount+ card and sticky ad now appear on every page that has the sidebar (post pages, player pages, season pages, etc.).

---

## Behind the Scenes (won't notice but worth knowing)

- Caching strategy unchanged — the homepage is still 100% webhook-driven (no per-visit origin hits, no cost regression).
- All new data folds into the existing single homepage API call, so no extra round trips.
- The sticky ad uses an existing Freestar placement (not a new one) so it serves real ads immediately.

---

## What to Test

- **Scroll the homepage** — does the sticky sidebar ad actually stay pinned as you scroll? It should sit ~144px from the top so the nav bar doesn't cut it off.
- **Look at the ticker** — three latest feed headlines scrolling left. Hover should pause it.
- **House Pulse** — if we're mid-season, you should see a bar chart of feed activity. If we're off-season, the chart should be hidden entirely (not show empty bars).
- **The House strip** — HoH/Veto/Noms/Have-Nots avatars and names. Empty groups should show "TBD" with a dashed circle.
- **Mobile** — ticker should hide on phones (just the H1 stays). Sidebar should collapse below main content.
- **Other pages** — make sure your blog post pages, player pages, etc. still look right with the new sidebar layout.

---

## Known Loose End

The **live feed updates page** sidebar still has the older widget set (Houseboard + Watch Live Feeds + Socials), so you might see two Paramount+ links there until we clean that one up. Not a bug — just a follow-up.

---

## Admin Tool Added: Ad Preview Mode (admin-only)

Built later in the day after the homepage match shipped. Useful for designing the page without distractions.

- **New toggle on `/admin/ads`** — under Global Ad Control, called "Ad Preview Mode" (amber accent so you can't miss it)
- **What it does:** flips every Freestar ad on the site to a labeled gray placeholder card showing the slot's size (e.g., "728 × 90") and friendly name (e.g., "Leaderboard ATF"). Reserved height matches the real ad, so layout doesn't shift.
- **Admin-only:** sets a 7-day cookie in YOUR browser. Real visitors still see real ads, no revenue loss.
- **Role-gated:** even if someone copies the cookie into their browser, they need the `administrator` or `editor` role on the WP side for placeholders to appear. Logged-out users always see real ads.
- **Cookie lifecycle:** click toggle ON → cookie set, navigate around → all ads become placeholders. Click OFF → cookie removed, ads return on next reload.
- **Where to use it:** while iterating on layout, sidebar widget order, or any ad-adjacent design work. Avoid clicking on real ads while testing.

### What gets replaced

All "manual" Freestar slots (the ones in the codebase via `<FreestarSlot>`):
Leaderboard ATF, In-Content Reusable (×2), Middle Feed, Middle Post, Siderail Right 1/2, Sticky Siderail.

**Not replaced** (Freestar SDK injects these directly): sticky footer, Google interstitial, video slider. They'll still serve real ads even in preview. Known limitation, low priority.

---

## Behind the Scenes (Ad Preview Mode internals)

- Cookie name: `bbj_ad_preview` (value `1`, path `/`, 7-day expiry, `Secure` on HTTPS)
- Implementation: cookie + `useAuth()` role check inside `AdContext` — a derived `previewMode` flag exposed to `<FreestarSlot>`
- Caching impact: zero. Cookie read happens client-side in `useEffect`, no SSR concern, no new ISR tags, no new server fetches per render.
- Width and friendly labels added to every slot in `src/config/ads.js`

---

## End-of-Day Branch State

- **bbj-app** `feature/v2-homepage-match` — 24 commits ahead of staging
- **plugin (bigbrotherjunkies-data)** `feature/v2-homepage-match` — 5 commits ahead of staging
- Both ready for `/full-push` when costs hold steady and we're ready to ship

---

Thanks for testing! This sets up the homepage for BB28 cleanly.
