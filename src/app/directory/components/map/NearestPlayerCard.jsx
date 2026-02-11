"use client";

import { useState, useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import { FaTimes, FaMapMarkerAlt } from "react-icons/fa";

/**
 * Haversine distance in miles between two lat/lng points
 */
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3959; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the nearest player to the user's geolocation
 * Shows a card with closest player info + pulsing dot on map for user location
 */
export default function NearestPlayerCard({ players, onClose }) {
  const map = useMap();
  const [nearest, setNearest] = useState(null);
  const [distance, setDistance] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;

        // Add pulsing marker for user location
        const userIcon = L.divIcon({
          className: "colored-marker",
          html: `<div style="width:16px;height:16px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3);animation:pulse 2s infinite"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        if (markerRef.current) {
          map.removeLayer(markerRef.current);
        }
        markerRef.current = L.marker([userLat, userLng], { icon: userIcon })
          .addTo(map)
          .bindPopup("You are here");

        // Find closest player
        let closestPlayer = null;
        let minDist = Infinity;

        for (const player of players) {
          if (!player.lat || !player.lng) continue;
          const dist = haversineDistance(userLat, userLng, player.lat, player.lng);
          if (dist < minDist) {
            minDist = dist;
            closestPlayer = player;
          }
        }

        if (closestPlayer) {
          setNearest(closestPlayer);
          setDistance(Math.round(minDist));
          // Pan to show both user and nearest player
          const bounds = L.latLngBounds(
            [userLat, userLng],
            [closestPlayer.lat, closestPlayer.lng]
          );
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 8 });
        }

        setLoading(false);
      },
      (err) => {
        setError(
          err.code === 1
            ? "Location access denied. Enable location permissions to find the nearest player."
            : "Could not determine your location"
        );
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );

    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }
    };
  }, [map, players]);

  if (loading) {
    return (
      <div className="absolute bottom-12 left-2 z-[1000] bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-slate-200 dark:border-slate-700 w-64">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          Finding your location...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute bottom-12 left-2 z-[1000] bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-slate-200 dark:border-slate-700 w-72">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-red-500">{error}</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
            <FaTimes className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  if (!nearest) return null;

  const hometown = [nearest.hometown_city, nearest.hometown_state].filter(Boolean).join(", ");

  return (
    <div className="absolute bottom-12 left-2 z-[1000] bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-slate-200 dark:border-slate-700 w-72">
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
          Nearest Player
        </h4>
        <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
          <FaTimes className="w-3 h-3" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        {nearest.photo ? (
          <img
            src={nearest.photo}
            alt={nearest.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-lg font-bold text-slate-400">
            {nearest.name?.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <Link
            href={`/bigbrother-players/${nearest.slug}`}
            className="font-semibold text-sm text-primary-600 dark:text-primary-400 hover:underline block truncate"
          >
            {nearest.name}
          </Link>
          {hometown && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              <FaMapMarkerAlt className="w-2.5 h-2.5 inline mr-1" />
              {hometown}
            </p>
          )}
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">
            ~{distance} miles away
          </p>
        </div>
      </div>
    </div>
  );
}
