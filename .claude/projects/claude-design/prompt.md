## Prompt for Claude Design

Hey — I'd like your help redesigning the home page of **Big Brother Junkies** (bigbrotherjunkies.com). It's a fan site for the CBS reality show Big Brother, and I've been running it for 10+ years. It gets heavy traffic during the BB season (July–September, especially Thursday eviction nights) and quieter the rest of the year.

The site is a Next.js 15 / React app with Tailwind. I've attached two files:

1. **`design-system.md`** — my current brand rules, color palette, typography, component patterns, and explicit "keep this" vs. "re-examine this" lists at the bottom. Please read this first.
2. **`home-code.html`** — a self-contained HTML mockup of the current home page, exactly as it looks today. Uses the same Tailwind config, same utility classes, same content structure. This is the "before" state.

### What I want from you

Give me a redesigned home page that:

- **Feels modern and magazine-style** — bolder hero, stronger visual hierarchy, more confident use of whitespace.
- **Makes the Feed Updates section the clear star of the page during BB season.** Right now it sits below the hero in an anonymous stack. Can it feel more alive / real-time?
- **Gives the sidebar widgets better visual hierarchy.** Currently all 5 widgets (Houseboard, Follow Us, Watch Feeds, Season Stats, Recent Comments) look visually equivalent. Some are way more important than others — Houseboard and Season Stats should feel heavier/more anchoring, Follow Us can shrink.
- **Keeps the Houseboard recognizable.** This 2×2 HoH/PoV/Nominees/Have-Nots grid is *the* signature element of the site. Treat it as iconic, not something to reinvent.
- **Doesn't lose what I marked as "keep" in the design system** (Yanone Kaffeesatz headings, primary blue + secondary yellow, card-based feed, LIVE pill, 2-col desktop, dark mode parity).
- **Feels free to push hard on what I marked as "fair game"** (header density, hero style, feed update card differentiation, sidebar hierarchy, micro-interactions, the underused Caveat handwritten font).

### Deliverable

Ideally:
- Show me 2–3 different directions side by side rather than one definitive answer, so I can pick what resonates
- For each direction, give me a short description of the vibe/intent ("editorial magazine", "live-sports scoreboard", etc.)
- Show me the redesigned **desktop** view primarily (my traffic skews desktop despite being mobile-optimized), with a note on how key elements would adapt to mobile
- If there's a specific pattern you want to introduce (e.g. a new card type, a different hero treatment), call it out explicitly so I can decide whether to adopt it

### Constraints

- Stick with Tailwind-friendly approaches (no exotic CSS that won't translate back to Next.js/Tailwind easily)
- This is a content site monetized by ads — don't design over/under ad slots. Keep the two in-content ad placements (between hero & feed updates, and between feed updates & more stories) as part of the layout.
- This is a fan site, not a SaaS product. Don't make it feel like a B2B dashboard.

Have fun with it — this is meant to be the cool community hangout for Big Brother fans, not a sterile news aggregator.
