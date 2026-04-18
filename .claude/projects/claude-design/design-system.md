# Big Brother Junkies — Design System

**Site:** bigbrotherjunkies.com
**Audience:** Big Brother reality TV fans (US audience, predominantly 25–55). Heaviest traffic during the BB season (mid-July through late September), peaking on Thursday eviction nights.
**Tone:** Casual, fan-forward, enthusiastic. Not corporate. The site reads like a community hangout with real-time gossip, stats, and light snark — but it still needs to feel clean and trustworthy for Google News / ad networks.

## 1. Brand Identity

### Colors

The palette is built around a **trust-blue primary** (newsy, calm) paired with a **sunshine-yellow secondary** (energy, call-to-action), with an **accent red/orange** reserved for "LIVE" urgency and CTAs.

| Role                 | Hex       | Tailwind token  | Usage                                                                       |
| -------------------- | --------- | --------------- | --------------------------------------------------------------------------- |
| Primary 500          | `#35546E` | `primary-500`   | Headlines, nav bar background, primary buttons, links                       |
| Primary 400 (soft)   | `#4D6D88` | `primary-400`   | Dark-mode headings, accent borders                                          |
| Primary 600 (hard)   | `#2D4B65` | `primary-600`   | Hover states on primary                                                     |
| Secondary 500        | `#FFBF0F` | `secondary-500` | Highlight text, "Go Ad Free" CTA, progress bars, nav hover                  |
| Secondary 400 (soft) | `#FFD970` | `secondary-400` | Light-mode highlight backgrounds                                            |
| Secondary 600 (hard) | `#FA910A` | `secondary-600` | Hover states on secondary                                                   |
| Accent Red           | `#E55C41` | `accent-red`    | Emotional accents (rare — most red usage is Tailwind's `red-500`/`red-600`) |
| Red (LIVE/urgency)   | `#DC2626` | `red-600`       | "Read More" hero CTA gradient, "LIVE" pills, alerts                         |

**Houseguest status colors** (used in cards, avatars, spoiler bars, stat badges):

| Status                     | Hex                     | Notes                                        |
| -------------------------- | ----------------------- | -------------------------------------------- |
| Head of Household / Winner | `#059669` (emerald-600) | Green = power                                |
| Power of Veto              | `#EAB308` (yellow-500)  | Gold medallion                               |
| Nominated                  | `#EF4444` (red-500)     | Danger / on the block                        |
| Safe                       | `#DCFCE7` / `#4ADE80`   | Neutral green wash                           |
| Jury                       | `#6366F1` (indigo-500)  | Dignified purple                             |
| Evicted                    | `#94A3B8` (slate-400)   | Muted grey; images grayscale 100% opacity 70 |
| Have-Not                   | `#B45309` (amber-700)   | Uncomfortable amber                          |
| AFP                        | `#EC4899` (pink-500)    | America's Favorite Player                    |
| Runner-up                  | `#0EA5E9` (sky-500)     | Silver-blue                                  |

### Typography

Four typefaces, each with a clear job:

| Font                  | Stack                                          | Use                                                                                            |
| --------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Roboto**            | `font-sans` (400/500/600/700)                  | Body text, captions, form inputs, meta data                                                    |
| **Oswald**            | `font-osw` (400/600/700)                       | Legacy nav labels, condensed stat labels                                                       |
| **Yanone Kaffeesatz** | `font-display` / `font-mainHead` (400/600/700) | **All main headings** — hero titles, section headers, card titles. This is the signature font. |
| **Caveat**            | `font-hand` (400/700)                          | Rare handwritten accents. Use sparingly.                                                       |

**Heading hierarchy:**

- H1 (hero post title): `text-2xl md:text-4xl font-display text-primary-500`
- H2 (section headers — "Latest Feed Updates", "More Stories", sidebar widget titles): `text-2xl font-display uppercase text-primary-500` — utility class is `.v2-primary-subheader`
- H3 (card titles on feed update / story cards): `text-base md:text-xl font-sans font-semibold text-primary-500`
- Body: `text-sm text-gray-700 dark:text-gray-300`
- Meta / timestamp: `text-xs text-gray-500 dark:text-gray-400`

### Iconography

- **Heroicons v2** (outline style primarily) for UI chrome: search, bell, pencil-square, shield, login arrow.
- **Inline SVG** for social brand marks (Facebook, Instagram, X, TikTok).
- Icons are 16–20px in body content, 24–28px in chrome (header controls, modals).
- Always paired with text or an `aria-label`. Never icon-only for primary actions.

## 2. Layout & Spacing

### Global container

- Max-width: `max-w-screen-xl` (1280px). Content breathes on larger monitors — the site is never full-bleed on desktop.
- Horizontal padding: `px-2` on mobile, content gutters expand via the `v2-primary-container` utility.
- Vertical rhythm: sections use `space-y-4` (1rem gaps). Cards use `p-3` or `p-4` internally.

### Home page structure

```
┌─────────────────────────────────────────────────┐
│  Header (sticky, z-50)                          │
│   ├─ Utility bar (contact, privacy, socials, BB Time)
│   ├─ Main header (logo, search, user controls)
│   └─ Primary nav (blue bar — Watch Feeds pill + menu)
├─────────────────────────────────────────────────┤
│  Main container (max-w-screen-xl, 2-col desktop)│
│  ┌───────────────────────────┬────────────────┐ │
│  │ Main Left (flex-grow)     │ Sidebar (320px)│ │
│  │  • Hero article           │  • Houseboard  │ │
│  │  • Top ad slot            │  • Social      │ │
│  │  • Feed Updates section   │  • Watch Feeds │ │
│  │  • Mid ad slot            │  • Season Stats│ │
│  │  • More Stories section   │  • Comments    │ │
│  └───────────────────────────┴────────────────┘ │
├─────────────────────────────────────────────────┤
│  Footer                                         │
└─────────────────────────────────────────────────┘
```

- Desktop breakpoint: `lg:` (1024px+) — two-column layout kicks in
- Mobile: single column, sidebar stacks below main content
- Sidebar is NOT sticky by default on home (scrolls with page)

### Card pattern (.v2-primary-container-inner)

The site's dominant container style:

- White background (`bg-white`), dark mode: `bg-gray-800` with 1px border `border-gray-700`
- `rounded-lg` (8px corners)
- Soft shadow: `shadow` → `hover:shadow-md`
- Content cards add a 3px left accent border in `primary-400`/`primary-500` that intensifies on hover

## 3. Components

### Header (3-tier)

**Tier 1 — Utility Bar:** thin grey strip with contact/privacy/social icons on the left, live "BB Time" (Pacific) clock on the right. Font size 10–12px. Background `bg-white dark:bg-gray-900`.

**Tier 2 — Main Header:** logo on the left (PNG, ~395×37 desktop, 40×40 mobile square), search bar centered on desktop (hidden on mobile, replaced with search icon), user controls on the right: notification bell, admin shield (if admin), pencil (if editor), avatar/login button, hamburger menu (mobile).

**Tier 3 — Primary Nav:** solid `primary-500` blue bar. Left: "Watch Feeds" with a pulsing red "LIVE" pill (affiliate link to Paramount+). Center/right: nav links in yellow (`secondary-500`) — Home, Contact, Feed Updates, Directory, Log In, Register. Far right: "Go Ad Free" CTA (or "Thank you for your support!" for supporters).

### Hero Article (home page)

- 250px mobile / 333px desktop tall image area
- Title H1 in `font-display text-2xl md:text-4xl` primary blue
- Comment count badge: white pill in bottom-left corner of image
- "Read More" button: bottom-right corner, `bg-gradient-to-r from-red-400 to-red-700` — the only red gradient on the site, used for emphasis
- Below image: post title, date + "time ago" meta, 3-line excerpt

### Feed Update Card

Signature card type — the lifeblood of the site during BB season.

- Author avatar (40×40 round) + name + time-ago at top
- Title in primary blue semibold
- Thumbnail (if present) floats right, 120×80
- 3-line excerpt preview
- "Recent Replies" nested box when comments exist (light grey, left border accent)
- Footer: comment count (left) + Quick Reply button (right, yellow star for premium upsell if not supporter)

### More Stories Card

Horizontal layout on desktop, stacked on mobile:

- 250×150 thumbnail on left
- Title, date-ago, 2-line excerpt on right
- Footer spans full width: author name + comment count

### Sidebar Widgets

All use `.v2-primary-container-inner` + `p-4`. Header uses `.v2-primary-subheader`.

1. **Houseboard** (most visual) — 2×2 grid of labeled status cards (HoH emerald / PoV yellow / Nominees red / Have Nots grey). Each shows player photo + name.
2. **Follow Us** — 3 large social icons in a row, centered, 32px tall, colored on hover (Twitter blue, Instagram pink, Facebook blue).
3. **Watch Live Feeds** — affiliate banner (290×46 Paramount+ ad image) with "One Week Free" text below.
4. **Season Stats** — 5-column stat bar (Days / Elapsed / Rem / % / Status) + yellow progress bar + compact player stats table (Player | H | V | N | VR | TD).
5. **Recent Comments** — list of author avatar + name + time, 2-line comment preview, link to post.

## 4. Interaction Patterns

- **Hover states:** cards lift shadow (`shadow` → `shadow-md`), images scale ~5% (`group-hover:scale-105 transition-transform duration-300`), left accent border darkens
- **Focus states:** standard Tailwind focus rings on inputs and buttons, `focus:ring-2 focus:ring-primary-500`
- **Loading:** pulse skeletons (`animate-pulse bg-gray-200 dark:bg-gray-700`) for auth-dependent chrome; spinner in-button for async actions
- **Links:** two styles — **internal content links** use `text-primary-500 hover:underline`; **attention links / CTAs** use `.v2-highlight-text` (yellow, semibold, underline)

## 5. Dark Mode

Full dark mode via `class="dark"` on `<html>`. Every component pair has a dark-mode counterpart. Pattern:

- Backgrounds: `bg-white dark:bg-gray-800` (cards), `bg-gray-50 dark:bg-gray-900` (page)
- Text: `text-gray-700 dark:text-gray-300` (body), `text-primary-500 dark:text-primary-400` (headings)
- Borders: `border-gray-200 dark:border-gray-700`
- Primary blue shifts _lighter_ in dark mode (`primary-400`) for contrast; secondary yellow stays the same.

## 6. Accessibility Notes

- All interactive elements have `aria-label` or visible text
- Color contrast meets WCAG AA (primary-500 on white is 8:1)
- Timestamps that aren't article dates wear `data-nosnippet` to prevent Google misreading them as article publish dates
- Keyboard nav fully supported

## 7. What the Home Page Is Optimizing For

1. **Fastest path to latest spoilers** — hero is always the newest blog post about Big Brother spoilers
2. **Real-time feed updates** — the Feed Updates section is the reason people bookmark BBJ. Where comments pile up during live eviction nights.
3. **Glanceable power state** — the Houseboard sidebar tells returning visitors who's currently HoH / on the block at a glance
4. **Return-to-site hooks** — recent comments, social follow prompts, season stats all pull users deeper

## 8. What to KEEP When Redesigning

- **Yanone Kaffeesatz for headings** — it's the brand. Do not swap this.
- **Primary blue / secondary yellow split** — trust + energy. A muted palette would feel corporate and off-brand.
- **Card-based content on the main column** — scannable feed. Don't collapse into list view.
- **LIVE pill with pulse animation** — signature detail on the nav bar.
- **2-column desktop layout with sidebar widgets** — the sidebar is a critical engagement surface, not a footer dump.
- **Dark mode parity** — a meaningful % of the audience uses dark mode (night watchers on live-feed nights).

## 9. What's Fair Game to Re-Examine

- Header density (3 tiers is a lot — could the utility bar be absorbed into the main header on desktop?)
- Hero could be bolder / more magazine-style
- Feed update card could use better visual differentiation between types of updates (HoH ceremony vs. nom ceremony vs. houseguest chatter)
- Sidebar widgets could have stronger visual hierarchy — currently all widgets look equivalent
- The "Watch Feeds" affiliate placement feels more utility than opportunity — could be a hero-style unit during season
- More playful micro-interactions (the Caveat handwritten font is underused)
