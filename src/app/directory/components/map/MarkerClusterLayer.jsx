"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { createBbjClusterGroup } from "./clusterUtils";

/**
 * Basic marker cluster layer (free tier)
 * Uses default markers with photo popups
 */
export default function MarkerClusterLayer({ players }) {
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

      const marker = L.marker([player.lat, player.lng]);
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

export function buildPopupHtml(player) {
  const winnerBadge = player.is_winner
    ? '<span style="color:#059669;font-weight:700;font-size:11px">&#9733; Winner</span>'
    : player.is_afp
    ? '<span style="color:#EC4899;font-weight:700;font-size:11px">&#9733; AFP</span>'
    : "";

  const photoHtml = player.photo
    ? `<img src="${player.photo}" alt="${player.name}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid #e2e8f0" />`
    : `<div style="width:48px;height:48px;border-radius:50%;background:#e2e8f0;display:flex;align-items:center;justify-content:center;font-weight:700;color:#94a3b8;font-size:18px">${player.name?.charAt(0) || "?"}</div>`;

  const hometown =
    [player.hometown_city, player.hometown_state].filter(Boolean).join(", ") || "";

  return L.popup({ maxWidth: 220, minWidth: 180 }).setContent(`
    <div style="text-align:center;font-family:system-ui,sans-serif">
      <div style="display:flex;justify-content:center;margin-bottom:6px">${photoHtml}</div>
      <a href="/bigbrother-players/${player.slug}" style="font-weight:600;font-size:14px;color:#35546e;text-decoration:none">${player.name}</a>
      ${winnerBadge ? `<div style="margin-top:2px">${winnerBadge}</div>` : ""}
      ${hometown ? `<div style="font-size:12px;color:#64748b;margin-top:2px">${hometown}</div>` : ""}
    </div>
  `);
}
