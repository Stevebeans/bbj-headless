"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";

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
 * Interactive player map with marker clustering
 */
export default function PlayerMap({ players, isDark }) {
  const tileUrl = isDark ? DARK_TILES : LIGHT_TILES;

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
        <MarkerClusterLayer players={players} />
      </MapContainer>
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

/**
 * Marker cluster layer using leaflet.markercluster directly
 * (react-leaflet v5 has no built-in cluster support)
 */
function MarkerClusterLayer({ players }) {
  const map = useMap();
  const clusterRef = useRef(null);

  useEffect(() => {
    if (!map || !players?.length) return;

    // Remove existing cluster group
    if (clusterRef.current) {
      map.removeLayer(clusterRef.current);
    }

    const cluster = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (clusterObj) => {
        const count = clusterObj.getChildCount();
        let size = "small";
        if (count >= 50) size = "large";
        else if (count >= 10) size = "medium";

        return L.divIcon({
          html: `<div><span>${count}</span></div>`,
          className: `marker-cluster marker-cluster-${size} bbj-cluster`,
          iconSize: L.point(40, 40),
        });
      },
    });

    for (const player of players) {
      if (!player.lat || !player.lng) continue;

      const marker = L.marker([player.lat, player.lng]);

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

      const popup = L.popup({ maxWidth: 220, minWidth: 180 }).setContent(`
        <div style="text-align:center;font-family:system-ui,sans-serif">
          <div style="display:flex;justify-content:center;margin-bottom:6px">${photoHtml}</div>
          <a href="/bigbrother-players/${player.slug}" style="font-weight:600;font-size:14px;color:#35546e;text-decoration:none">${player.name}</a>
          ${winnerBadge ? `<div style="margin-top:2px">${winnerBadge}</div>` : ""}
          ${hometown ? `<div style="font-size:12px;color:#64748b;margin-top:2px">${hometown}</div>` : ""}
        </div>
      `);

      marker.bindPopup(popup);
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
