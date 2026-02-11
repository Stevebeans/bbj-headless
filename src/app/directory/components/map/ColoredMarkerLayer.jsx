"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { buildPopupHtml } from "./MarkerClusterLayer";
import { createBbjClusterGroup } from "./clusterUtils";

const STATUS_COLORS = {
  winner: "#059669",    // emerald-600
  afp: "#EC4899",       // pink-500
  runner_up: "#0EA5E9", // sky-500
  active: "#94A3B8",    // slate-400
};

/**
 * Color-coded markers by player status (premium tier)
 * Winner=emerald, AFP=pink, Runner-up=sky, Active=slate
 */
export default function ColoredMarkerLayer({ players }) {
  const map = useMap();
  const clusterRef = useRef(null);

  useEffect(() => {
    if (!map || !players?.length) return;

    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    const cluster = createBbjClusterGroup();

    for (const player of players) {
      if (!player.lat || !player.lng) continue;

      const color = STATUS_COLORS[player.status] || STATUS_COLORS.active;

      const icon = L.divIcon({
        className: "colored-marker",
        html: `<div style="width:14px;height:14px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      const marker = L.marker([player.lat, player.lng], { icon });
      marker.bindPopup(buildPopupHtml(player));
      cluster.addLayer(marker);
    }

    map.addLayer(cluster);
    clusterRef.current = cluster;

    return () => {
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
      }
    };
  }, [map, players]);

  return null;
}

/**
 * Color legend overlay for bottom-right corner
 */
export function ColorLegend() {
  const entries = [
    { label: "Winner", color: STATUS_COLORS.winner },
    { label: "AFP", color: STATUS_COLORS.afp },
    { label: "Runner Up", color: STATUS_COLORS.runner_up },
    { label: "Player", color: STATUS_COLORS.active },
  ];

  return (
    <div className="absolute bottom-2 right-2 z-[1000] bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-slate-200 dark:border-slate-700">
      <div className="space-y-1">
        {entries.map((e) => (
          <div key={e.label} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full inline-block flex-shrink-0"
              style={{ background: e.color, border: "1px solid rgba(0,0,0,0.1)" }}
            />
            <span className="text-[10px] text-slate-600 dark:text-slate-400">{e.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
