"use client";

import { useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { FaTimes } from "react-icons/fa";

const GEOJSON_URL = "https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json";

/**
 * US states GeoJSON layer with click-to-view stats panel (premium tier)
 */
export default function StateStatsPanel({ stateStats, players }) {
  const map = useMap();
  const layerRef = useRef(null);
  const [selectedState, setSelectedState] = useState(null);

  // Load GeoJSON and add choropleth
  useEffect(() => {
    if (!map || !stateStats) return;

    fetch(GEOJSON_URL)
      .then((res) => res.json())
      .then((geojson) => {
        if (layerRef.current) {
          map.removeLayer(layerRef.current);
        }

        const maxCount = Math.max(...Object.values(stateStats).map((s) => s.count), 1);

        const layer = L.geoJSON(geojson, {
          style: (feature) => {
            const stateName = feature.properties.name;
            const count = stateStats[stateName]?.count || 0;
            const intensity = count / maxCount;

            return {
              fillColor: count > 0 ? getColor(intensity) : "transparent",
              fillOpacity: count > 0 ? 0.4 + intensity * 0.4 : 0,
              weight: 1,
              color: "#64748b",
              opacity: 0.5,
            };
          },
          onEachFeature: (feature, featureLayer) => {
            const stateName = feature.properties.name;
            const stats = stateStats[stateName];

            featureLayer.on({
              mouseover: (e) => {
                e.target.setStyle({ weight: 2, color: "#35546e", fillOpacity: 0.7 });
              },
              mouseout: (e) => {
                layer.resetStyle(e.target);
              },
              click: () => {
                if (stats) {
                  setSelectedState({ name: stateName, ...stats });
                }
              },
            });

            if (stats) {
              featureLayer.bindTooltip(
                `${stateName}: ${stats.count} player${stats.count !== 1 ? "s" : ""}`,
                { sticky: true }
              );
            }
          },
        });

        layer.addTo(map);
        layerRef.current = layer;
      })
      .catch((err) => console.error("Failed to load states GeoJSON:", err));

    return () => {
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
    };
  }, [map, stateStats]);

  // Get players for selected state
  const statePlayers = selectedState
    ? players.filter((p) => p.hometown_state === selectedState.name)
    : [];

  return (
    <>
      {/* State Stats Slide-in Panel */}
      {selectedState && (
        <div className="absolute top-0 left-0 bottom-0 z-[1001] w-72 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-lg border-r border-slate-200 dark:border-slate-700 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 dark:text-white text-sm">
                {selectedState.name}
              </h3>
              <button
                onClick={() => setSelectedState(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 text-center">
                <div className="text-lg font-bold text-primary-600 dark:text-primary-400">
                  {selectedState.count}
                </div>
                <div className="text-[10px] text-slate-500">Players</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 text-center">
                <div className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                  {selectedState.top_city}
                </div>
                <div className="text-[10px] text-slate-500">Top City ({selectedState.top_city_count})</div>
              </div>
            </div>

            {/* Player list */}
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Players ({statePlayers.length})
            </h4>
            <div className="space-y-2">
              {statePlayers.slice(0, 20).map((p) => (
                <Link
                  key={p.id}
                  href={`/bigbrother-players/${p.slug}`}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  {p.photo ? (
                    <img
                      src={p.photo}
                      alt={p.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-400">
                      {p.name?.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                      {p.name}
                    </div>
                    {p.hometown_city && (
                      <div className="text-[10px] text-slate-400 truncate">{p.hometown_city}</div>
                    )}
                  </div>
                </Link>
              ))}
              {statePlayers.length > 20 && (
                <p className="text-[10px] text-slate-400 text-center pt-1">
                  +{statePlayers.length - 20} more
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getColor(intensity) {
  // BBJ brand gradient: blue → yellow → orange
  if (intensity < 0.33) return "#4D6D88";
  if (intensity < 0.66) return "#FFBF0F";
  return "#FA910A";
}
