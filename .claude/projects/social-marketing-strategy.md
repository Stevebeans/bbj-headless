# BBJ Social Media & Marketing Strategy

**Created:** April 4, 2026
**Goal:** Turn BB season traffic into year-round audience growth. Launch social presence that drives traffic back to the site, builds the brand, and sets up expansion to TRJ (TheRealityJunkies.com).

---

## Current State

- **Website:** bigbrotherjunkies.com — #2 Google for "Big Brother Spoilers"
- **Facebook Pages:** BBJ, TRJ, Survivor Junkies, Hollywood Junkies, 90 Day Fiancé Junkies, Dance Mom Junkies, Beans TV Talk, IFL League
- **Revenue:** Freestar ads + supporter subscriptions
- **Gap:** No TikTok, no Instagram Reels, no short-form video presence

## Why Short-Form Video Matters

- TikTok/Reels are where reality TV fans live during the season
- BB spoilers go viral on TikTok — first-mover advantage for feed watchers
- Short-form drives traffic back to the site (bio link, comment engagement)
- Cross-posting: one video → TikTok + Instagram Reels + Facebook Reels (3x reach, same effort)
- Off-season content keeps audience engaged year-round

## Tool: CapCut

**Desktop app** (capcut.com) for batch production at the desk. **Phone app** for quick spoiler drops on the go.

Why CapCut:
- Free, made by ByteDance (TikTok's parent company)
- Pre-made templates — pick a template, swap in photos/text, export
- Auto-captions for talking head videos
- Built-in trending sounds/music library
- Exports in 9:16 vertical format for TikTok/Reels
- Desktop + mobile versions

**Do NOT use Canva for video** — it's painfully slow for this. Canva = graphics, CapCut = video.

## Video Formats (Templates)

### Format 1: Spoiler Drops (2 min to make)
- Background: BB house photo or player photo
- Text overlay: "BB28 SPOILER" at top, spoiler text in middle, @handle at bottom
- Trending sound
- **When:** Every time something happens on live feeds
- **This is your competitive advantage** — you watch feeds, big accounts don't

### Format 2: Rankings/Lists (10 min)
- "Top 5 most underrated BB players"
- "Ranking every BB winner"
- "Players who should return for BB28"
- Photo slideshow in CapCut with text labels, auto transitions, music
- **When:** Off-season content, anytime
- **Engagement:** People argue in comments — algorithm loves this

### Format 3: Feed Recaps (5-10 min)
- Option A: Talk to camera for 30-60 seconds summarizing feeds
- Option B: Text overlay on screenshots from feeds
- Phone selfie camera, decent lighting, that's it
- **When:** Daily during BB season
- **Unique to you** — nobody else covers live feeds at this level

### Format 4: Hot Takes / This or That (5 min)
- Split screen with two players: "Who played a better game?"
- Or text: "Unpopular opinion: [take]"
- Engagement machines — people can't resist commenting
- **When:** Anytime, great for off-season

### Format 5: Show Reactions (during episodes)
- Quick reaction clip right after episode airs
- "Did they really just do that?!" energy
- First 30 minutes after episode = highest engagement window
- **When:** Every Thursday night (BB), episode nights for other shows

## Content Calendar

### Off-Season (Oct - June)
- 3-4 videos per week
- Mix of rankings, hot takes, throwback moments
- BB28 speculation as info comes out
- Cross-promote other shows (Survivor, Amazing Race) to build TRJ audience

### Pre-Season (June - July)
- Daily content: cast reveals, predictions, house tour reactions
- "Who to watch" player breakdowns
- Fantasy draft content

### During Season (July - September)
- **Multiple videos per day:**
  - Morning: Feed recap from overnight
  - Afternoon: Spoiler drop when something happens
  - Evening: Episode reaction
  - Anytime: Hot takes, rankings as the season progresses
- This is where you go from hundreds of views to thousands

### Post-Season (October)
- Season recap rankings
- "What we learned from BB28"
- Pivot to Survivor/other fall shows

## Growth Strategy

### Phase 1: Build the Library (Now - June)
- Create 30+ ranking/hot take videos using BB history
- Establish posting cadence (1/day minimum)
- Get comfortable with CapCut templates
- Set up TikTok and Instagram accounts if not already done

### Phase 2: Season Launch (July)
- Shift to daily spoiler drops and feed recaps
- Cross-post everything to TikTok + Instagram Reels + Facebook Reels
- Drive traffic to site: "Full recap on bigbrotherjunkies.com — link in bio"
- Engage with comments aggressively (algorithm rewards this)

### Phase 3: Expand to TRJ (Fall)
- Use same formats for Survivor, Amazing Race
- Post on TRJ accounts + cross-promote on BBJ
- Build year-round content machine across multiple shows

## Driving Traffic Back to the Site

Every video should funnel viewers to the website:
- Bio link: `bigbrotherjunkies.com` (or a Linktree with site + socials)
- End of video CTA: "Full spoilers on our site"
- Pin a comment with the link on every video
- Instagram Stories: swipe-up link to latest post

## Revenue from Social

- Direct: Sponsorships once you hit 10k+ followers (reality TV brands, streaming services, live feed subscriptions)
- Indirect: Traffic → site → ad revenue + supporter subscriptions
- TikTok Creator Fund (small but passive)
- Instagram bonuses for Reels (invitation-based)

---

## TRJ Expansion Plan (TheRealityJunkies.com)

See separate doc: `.claude/projects/trj-plan.md` (to be created)

**Concept:** Multi-show reality TV hub covering Survivor, Amazing Race, 90 Day Fiancé, Love Island, Dance Moms, and more. Same quality as BBJ but for all reality TV.

**Infrastructure approach:**
- New Cloudways WordPress app for TRJ
- Shared database on Cloudways (both PC and laptop connect to same DB)
- Same GitHub repo, work from either machine
- WordPress theme built from scratch (or fork BBJ theme)
- Player/season data model works for any show (rename "houseguest" to "contestant")
- Eventually: Next.js frontend like BBJ

**Development workflow:**
- Create WP app on Cloudways
- Both machines: `wp-config.php` points to Cloudways DB (not local XAMPP)
- Same GitHub repo cloned on both machines
- Work on theme from either computer, push/pull via git
- No data sync issues — single source of truth is Cloudways DB
