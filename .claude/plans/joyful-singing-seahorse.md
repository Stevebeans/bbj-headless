# Interactive Player Map — Implementation Plan

## Context

The roadmap has an interactive player map (`/directory?tab=map`) currently showing a "Coming Soon" placeholder. All data is ready: 274 of 366 players (75%) have `hometown_lat`/`hometown_lng` in the database. The user wants **Leaflet + OpenStreetMap** with a **simple, clean** approach: markers with player popups on click, basic clustering, no extra filter UI.

## Data Situation

- **Database**: `wp_bbj_players` has `hometown_city`, `hometown_state`, `hometown_lat` (decimal 10,7), `hometown_lng` (decimal 10,7)
- **SQL queries**: `bbj_v2_get_all_players()` and `bbj_v2_get_season_players()` both `SELECT *` and already join the geo table — lat/lng is in the raw data
- **API gap**: The existing `/bbjd/v1/players` endpoint doesn't return lat/lng. The endpoint registration file exists on production but not locally (stale local copy). Rather than hunting it down, we'll create a dedicated lightweight map endpoint.

## Approach

### 1. New API Endpoint: `/bbjd/v1/players/map`

**File**: `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\SpoilerBarRoutes.php`

Add a new route that returns only the fields needed for map markers — minimal payload for fast loading.

**Response shape:**
```json
{
  "success": true,
  "players": [
    {
      "id": 123,
      "name": "Dan Gheesling",
      "slug": "dan-gheesling",
      "photo": "https://...",
      "hometown_city": "Dearborn",
      "hometown_state": "Michigan",
      "lat": 42.3127,
      "lng": -83.1763,
      "is_winner": true,
      "seasons": 2
    }
  ],
  "count": 274
}
```

**Implementation**: Call `bbj_v2_get_all_players()`, filter to those with non-null lat/lng, return minimal fields. Cache with `revalidate: 3600` on the Next.js side.

### 2. Next.js API Helper

**File**: `src/lib/api/players.js`

Add `getPlayersForMap()` function:
```js
export async function getPlayersForMap() {
  const response = await bbjdFetch("/players/map", {
    tags: ["players", "map"],
    revalidate: 3600,
  });
  return response.success ? response.players : [];
}
```

### 3. Install Leaflet

```
npm install leaflet react-leaflet
```

Leaflet CSS will be imported in the map component. No API key needed — uses free OpenStreetMap tiles.

### 4. Replace MapTab Component

**File**: `src/app/directory/components/PlayerDirectory.jsx`

Replace the `MapTab()` placeholder with a component that:
- Renders a Leaflet map centered on the US (~[39.8, -98.5], zoom 4)
- Uses `react-leaflet`'s `MarkerClusterGroup` for clustering overlapping markers
- Each marker shows a popup on click with: player photo (small), name (linked to profile), hometown, winner badge if applicable
- Map is responsive (fills the tab content area)

**Key detail**: Leaflet requires `window` so the map component must be dynamically imported with `next/dynamic` and `ssr: false`.

**Structure:**
```
PlayerDirectory.jsx
  └── MapTab()
        └── dynamic(() => import('./PlayerMap'), { ssr: false })

New file: src/app/directory/components/PlayerMap.jsx
  - "use client"
  - Imports leaflet + react-leaflet
  - Receives `players` array prop (with lat/lng)
  - Renders MapContainer → TileLayer → MarkerClusterGroup → Markers
  - Each Marker has a Popup with mini player card
```

### 5. Data Flow

The directory page already fetches `initialPlayers` server-side. For the map, we need ALL players with coordinates (not paginated). Two options:

**Option chosen**: Fetch map data client-side when the Map tab is selected (lazy load). This avoids bloating the initial page load for users who never click the Map tab.

```
MapTab mounts → fetch /bbjd/v1/players/map → render markers
```

Show a loading skeleton while fetching.

## Files to Create

| File | Description |
|------|-------------|
| `src/app/directory/components/PlayerMap.jsx` | Client component with Leaflet map, markers, clustering, popups |

## Files to Modify

| File | Change |
|------|--------|
| `C:\xampp\htdocs\bbj\wp-content\plugins\bigbrotherjunkies-data\src\Api\SpoilerBarRoutes.php` | Add `/players/map` route + handler |
| `src/lib/api/players.js` | Add `getPlayersForMap()` |
| `src/app/directory/components/PlayerDirectory.jsx` | Replace MapTab placeholder with dynamic import of PlayerMap |

## PlayerMap Component Details

- **Map provider**: OpenStreetMap tiles via `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Center**: `[39.8, -98.5]` (geographic center of contiguous US)
- **Default zoom**: 4 (shows full US)
- **Clustering**: `react-leaflet-markercluster` (or manual cluster implementation with Leaflet.markercluster)
- **Marker popup**: Mini card with player photo (40x40), name as link, hometown text, winner/AFP badge
- **Responsive**: Map container fills parent with `min-height: 500px`
- **Dark mode**: Use a dark tile layer variant when dark mode is active (CartoDB dark_all tiles)

## Marker Cluster Library

Install `leaflet.markercluster` for clustering. Usage with react-leaflet requires a thin wrapper since react-leaflet v4 dropped the cluster plugin. We'll create a simple `MarkerCluster` wrapper component inline.

```
npm install leaflet react-leaflet leaflet.markercluster
```

## Build Sequence

1. Add `/players/map` endpoint to SpoilerBarRoutes.php
2. Add `getPlayersForMap()` to players.js
3. `npm install leaflet react-leaflet leaflet.markercluster`
4. Create `PlayerMap.jsx` with Leaflet map + clustering + popups
5. Update `MapTab` in PlayerDirectory.jsx to dynamically import PlayerMap
6. Test locally, verify clustering and popups work
7. `npm run build` — verify clean

## Verification

1. Navigate to `/directory?tab=map` — map renders with markers across the US
2. Zoom in on a dense area (e.g., Los Angeles) — markers cluster and show count
3. Click a cluster — zooms in to reveal individual markers
4. Click a marker — popup shows player photo, name (clickable to profile), hometown
5. Click player name in popup — navigates to `/bigbrother-players/{slug}`
6. Toggle dark mode — map tiles switch to dark variant
7. Mobile: map is scrollable/zoomable with touch
8. `npm run build` passes clean
9. API: `curl /wp-json/bbjd/v1/players/map` returns 274 players with lat/lng
