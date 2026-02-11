"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";

/**
 * Heatmap overlay using leaflet.heat (premium tier)
 * Imports leaflet.heat dynamically to avoid SSR issues
 */
export default function HeatmapLayer({ players }) {
  const map = useMap();
  const heatRef = useRef(null);

  useEffect(() => {
    if (!map || !players?.length) return;

    // Dynamic import to avoid SSR
    import("leaflet.heat").then(() => {
      if (heatRef.current) {
        map.removeLayer(heatRef.current);
      }

      const points = players
        .filter((p) => p.lat && p.lng)
        .map((p) => [p.lat, p.lng, 0.6]);

      const heat = window.L.heatLayer(points, {
        radius: 25,
        blur: 15,
        maxZoom: 10,
        max: 1.0,
        gradient: {
          0.2: "#35546e",  // primary blue
          0.4: "#4D6D88",  // primary soft
          0.6: "#FFBF0F",  // secondary yellow
          0.8: "#FA910A",  // secondary orange
          1.0: "#E55C41",  // accent red
        },
      });

      heat.addTo(map);
      heatRef.current = heat;
    });

    return () => {
      if (heatRef.current) {
        map.removeLayer(heatRef.current);
      }
    };
  }, [map, players]);

  return null;
}
