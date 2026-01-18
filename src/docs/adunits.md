# Ad Units Setup Guide

Hey future Steve, here's how the ad system works.

---

## Quick Reference

| What you want to do | Where to go |
|---------------------|-------------|
| Change in-content ad positions | `src/config/ads.js` |
| Change sidebar/header ad slots | `src/config/ads.js` |
| Create/edit actual ad code | WordPress Admin → BBJ Ad Manager |
| Edit the ad placeholder component | `src/components/ads/AdPlaceholder.jsx` |
| Edit how in-content ads are inserted | `src/components/posts/ContentWithAds.jsx` |

---

## How It Works

1. **Next.js** has a config file (`src/config/ads.js`) that defines WHERE ads appear
2. **WordPress** has the BBJ Ad Manager plugin that stores the ACTUAL ad code (Adsense, Taboola, etc.)
3. Next.js fetches ad content from WordPress via `/bbjd/v1/ad/{slot-name}`

---

## In-Content Ads (Inside Blog Posts)

### Config Location
```
src/config/ads.js
```

### How to Add/Change Positions

Open `src/config/ads.js` and find the `inContent` array:

```javascript
inContent: [
  { position: 2, slot: "in-content-1", type: "taboola" },
  { position: 4, slot: "in-content-2", type: "adsense" },
  { position: 7, slot: "in-content-3", type: "taboola" },
  { position: 12, slot: "in-content-4", type: "adsense" },
],
```

**What each field means:**
- `position` - After which paragraph the ad appears (1-indexed, so `2` = after 2nd paragraph)
- `slot` - The slot name in WordPress BBJ Ad Manager (must match exactly)
- `type` - Just a label for you to remember what ad network it is (not used by code)

### Adding a New Position

Just add a new line:
```javascript
{ position: 15, slot: "in-content-5", type: "taboola" },
```

Then create a slot called `in-content-5` in WordPress with the Taboola code.

### Removing a Position

Delete the line. That's it.

### Settings

```javascript
// Minimum paragraphs required before showing ANY in-content ads
minParagraphs: 5,
```

If an article has fewer than 5 paragraphs, no in-content ads will show.

**Auto-skip logic:**
- Ads won't appear in the last 2 paragraphs
- If position exceeds article length, that ad is skipped

---

## Other Ad Slots (Sidebar, Homepage, etc.)

### Config Location
Same file: `src/config/ads.js`

```javascript
slots: {
  // Homepage
  indexTop: "index-top",
  indexMid: "index-mid",

  // Sidebar
  sidebarTop: "sidebar-top",
  sidebarBottom: "sidebar-bottom",

  // Single post
  beforeContent: "before-content",
  afterContent: "after-content",

  // Feed updates
  feedInterval: "feed-interval",
},
```

These are used throughout the site via the `<AdPlaceholder>` component.

### Where These Are Used

| Slot | File Location |
|------|---------------|
| `index-top` | `src/app/page.jsx` |
| `index-mid` | `src/app/page.jsx` |
| `sidebar-top` | `src/components/layout/Sidebar.jsx` |
| `sidebar-bottom` | `src/components/layout/Sidebar.jsx` |
| `before-content` | `src/app/posts/[slug]/page.jsx` |

---

## WordPress Side: BBJ Ad Manager

### Creating a Slot

1. Go to WordPress Admin → BBJ Ad Manager → Slots
2. Create a new slot with the **exact slug** that matches your config (e.g., `in-content-1`)
3. Set status to "Active"

### Creating an Ad

1. Go to WordPress Admin → BBJ Ad Manager → Add New
2. Assign it to a slot
3. Paste your ad code (Adsense, Taboola, etc.) in the Desktop Content field
4. Optionally add different code for Mobile Content

### API Endpoint

Next.js fetches ads from:
```
https://bigbrotherjunkies.com/wp-json/bbjd/v1/ad/{slot-name}
```

Response:
```json
{
  "show": true,
  "slot": "in-content-1",
  "content": "<div>...ad code...</div>",
  "desktop_content": "...",
  "mobile_content": "..."
}
```

---

## Files Overview

```
src/
├── config/
│   └── ads.js                    # ⭐ MAIN CONFIG - edit this for positions
│
├── components/
│   ├── ads/
│   │   └── AdPlaceholder.jsx     # The placeholder component (shows "Advertisement")
│   │
│   └── posts/
│       └── ContentWithAds.jsx    # Splits content & inserts in-content ads
│
└── lib/
    └── api/
        └── wordpress.js          # API functions (bbjdFetch for ad endpoints)
```

---

## Common Tasks

### "I want to add Taboola after paragraph 10"

1. Open `src/config/ads.js`
2. Add: `{ position: 10, slot: "in-content-taboola-10", type: "taboola" },`
3. In WordPress, create slot `in-content-taboola-10` with your Taboola code

### "I want to remove the ad after paragraph 4"

1. Open `src/config/ads.js`
2. Delete the line with `position: 4`

### "Ads aren't showing on short articles"

Check `minParagraphs` in `src/config/ads.js`. If set to 5, articles with 4 or fewer paragraphs won't have in-content ads.

### "I want to change sidebar ads"

1. Open `src/components/layout/Sidebar.jsx`
2. Find `<AdPlaceholder slot="sidebar-top" ...>`
3. Change the slot name if needed
4. Make sure that slot exists in WordPress

### "I need to hide ads for premium users"

This is handled in WordPress. Go to BBJ Ad Manager → Settings and configure which user roles should not see ads.

---

## Testing

1. **Placeholder mode**: By default, `AdPlaceholder` shows a placeholder box
2. **Real ads**: Once slots are configured in WordPress with real ad code, they'll render
3. **Check API**: Visit `https://bigbrotherjunkies.com/wp-json/bbjd/v1/ad/in-content-1` to see if the slot returns data

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Ads not showing | Check slot exists in WordPress, status is "Active" |
| Wrong position | Position is 1-indexed (position 2 = after 2nd paragraph) |
| Ads only on some posts | Check `minParagraphs` setting and article length |
| API returns `show: false` | Slot not found, no ads assigned, or user role is hidden |

---

Last updated: January 2025
