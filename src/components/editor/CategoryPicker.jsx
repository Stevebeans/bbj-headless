"use client";

import { useState, useEffect } from "react";
import { getCategories } from "@/lib/api/editor";

export default function CategoryPicker({ categoryIds, setCategoryIds, onTitleSuggestion, onSave, isEditMode = false }) {
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getCategories();
        setSeasons(data.seasons || []);
        // Default to current season only for new posts (not editing)
        if (!isEditMode || categoryIds.length === 0) {
          const current = data.seasons?.find((s) => s.is_current);
          if (current) {
            setSelectedSeason(current);
            setCategoryIds([current.id]);
          }
        } else {
          // For edit mode, find and select the season matching existing categories
          const matchingSeason = data.seasons?.find((s) => categoryIds.includes(s.id));
          if (matchingSeason) {
            setSelectedSeason(matchingSeason);
            const matchingSub = matchingSeason.subcategories?.find((sub) => categoryIds.includes(sub.id));
            if (matchingSub) setSelectedSub(matchingSub);
          }
        }
      } catch (err) {
        console.error("Failed to load categories:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleSeasonChange(e) {
    const seasonId = parseInt(e.target.value);
    const season = seasons.find((s) => s.id === seasonId);
    setSelectedSeason(season);
    setSelectedSub(null);
    setCategoryIds(season ? [season.id] : []);
    onSave?.();
  }

  function handleSubChange(e) {
    const subId = parseInt(e.target.value);
    const sub = selectedSeason?.subcategories?.find((s) => s.id === subId);
    setSelectedSub(sub);

    if (selectedSeason) {
      const ids = subId ? [selectedSeason.id, subId] : [selectedSeason.id];
      setCategoryIds(ids);
    }

    // Auto-title suggestion based on subcategory
    if (sub && selectedSeason) {
      const seasonName = selectedSeason.name;
      const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" });
      const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-US", { month: "long", day: "numeric" });

      const subLower = sub.name.toLowerCase();
      if (subLower.includes("live feed")) {
        onTitleSuggestion?.(`${seasonName} - Live Feed Thread For ${today}`);
      } else if (subLower.includes("recap")) {
        onTitleSuggestion?.(`Recap Post For ${seasonName} Feeds From ${yesterday}`);
      }
    }
    onSave?.();
  }

  if (loading) {
    return <div className="animate-pulse h-20 bg-gray-100 rounded" />;
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">Season</label>
        <select
          value={selectedSeason?.id || ""}
          onChange={handleSeasonChange}
          className="w-full mt-1 p-2 border border-gray-200 rounded text-sm bg-white focus:border-primary-400 focus:outline-none"
        >
          <option value="">Select season...</option>
          {seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.name} {season.is_current ? "(Current)" : ""}
            </option>
          ))}
        </select>
      </div>

      {selectedSeason?.subcategories?.length > 0 && (
        <div>
          <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">Post Type</label>
          <select
            value={selectedSub?.id || ""}
            onChange={handleSubChange}
            className="w-full mt-1 p-2 border border-gray-200 rounded text-sm bg-white focus:border-primary-400 focus:outline-none"
          >
            <option value="">General</option>
            {selectedSeason.subcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
