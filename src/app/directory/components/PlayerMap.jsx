"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

import MarkerClusterLayer from "./map/MarkerClusterLayer";
import ColoredMarkerLayer, { ColorLegend } from "./map/ColoredMarkerLayer";
import HeatmapLayer from "./map/HeatmapLayer";
import StateStatsPanel from "./map/StateStatsPanel";
import NearestPlayerCard from "./map/NearestPlayerCard";
import MapControls from "./map/MapControls";
import SeasonTimeline from "./map/SeasonTimeline";

// Fix default marker icons in webpack/next.js
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const US_CENTER = [39.8, -98.5];
const DEFAULT_ZOOM = 4;

const LIGHT_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

/**
 * Main map container with mode switching
 *
 * @param {Object} props
 * @param {Array} props.players - Player data array
 * @param {boolean} props.isDark - Dark mode state
 * @param {boolean} props.isPremium - Premium access state
 * @param {Object|null} props.stateStats - State aggregation data (premium)
 * @param {Array|null} props.premiumSeasons - Seasons list for timeline (premium)
 * @param {Function} props.onTimelineSeasonChange - Callback when timeline season changes
 */
export default function PlayerMap({
  players,
  isDark,
  isPremium = false,
  stateStats = null,
  premiumSeasons = null,
  onTimelineSeasonChange,
}) {
  const tileUrl = isDark ? DARK_TILES : LIGHT_TILES;
  const [mode, setMode] = useState("markers");
  const [showNearest, setShowNearest] = useState(false);

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700" style={{ height: "min(70vh, 600px)" }}>
      <MapContainer
        center={US_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ height: "100%", width: "100%" }}
      >
        <TileUpdater tileUrl={tileUrl} />

        {/* Active layer based on mode */}
        {mode === "markers" && <MarkerClusterLayer players={players} />}
        {mode === "colored" && isPremium && <ColoredMarkerLayer players={players} />}
        {mode === "heatmap" && isPremium && <HeatmapLayer players={players} />}
        {mode === "states" && isPremium && stateStats && (
          <StateStatsPanel stateStats={stateStats} players={players} />
        )}

        {/* Nearest player finder */}
        {showNearest && isPremium && (
          <NearestPlayerCard
            players={players}
            onClose={() => setShowNearest(false)}
          />
        )}
      </MapContainer>

      {/* Mode toggle toolbar */}
      <MapControls
        mode={mode}
        onModeChange={setMode}
        isPremium={isPremium}
        onFindNearest={() => setShowNearest(true)}
      />

      {/* Color legend for colored mode */}
      {mode === "colored" && isPremium && <ColorLegend />}

      {/* Season timeline (premium) */}
      {isPremium && premiumSeasons?.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 px-3 py-2">
          <SeasonTimeline
            seasons={premiumSeasons}
            onSeasonChange={onTimelineSeasonChange}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Swaps tile layer when dark mode changes
 */
function TileUpdater({ tileUrl }) {
  const map = useMap();
  const layerRef = useRef(null);

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }
    layerRef.current = L.tileLayer(tileUrl, {
      attribution: ATTRIBUTION,
    }).addTo(map);

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [tileUrl, map]);

  return null;
}
