"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FaPlay, FaPause } from "react-icons/fa";

/**
 * Season timeline slider for filtering map players by season (premium tier)
 * With auto-play that cycles through seasons
 */
export default function SeasonTimeline({ seasons, onSeasonChange }) {
  const [selectedIndex, setSelectedIndex] = useState(-1); // -1 = all seasons
  const [playing, setPlaying] = useState(false);
  const intervalRef = useRef(null);

  const handleChange = useCallback(
    (index) => {
      setSelectedIndex(index);
      if (index === -1) {
        onSeasonChange(null);
      } else {
        onSeasonChange(seasons[index]?.id);
      }
    },
    [seasons, onSeasonChange]
  );

  // Auto-play: advance every 1.5s
  useEffect(() => {
    if (!playing) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      if (document.hidden) return; // Pause when tab not visible

      setSelectedIndex((prev) => {
        const next = prev + 1;
        if (next >= seasons.length) {
          setPlaying(false);
          return -1; // Reset to "all"
        }
        onSeasonChange(seasons[next]?.id);
        return next;
      });
    }, 1500);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, seasons, onSeasonChange]);

  // Start auto-play from the beginning
  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
    } else {
      if (selectedIndex >= seasons.length - 1) {
        handleChange(0);
      }
      setPlaying(true);
    }
  };

  if (!seasons?.length) return null;

  const currentLabel =
    selectedIndex === -1
      ? "All Seasons"
      : seasons[selectedIndex]?.abbreviation || `Season ${selectedIndex + 1}`;

  return (
    <div className="flex items-center gap-3 px-1">
      <button
        onClick={togglePlay}
        className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center transition-colors"
        title={playing ? "Pause" : "Play through seasons"}
      >
        {playing ? <FaPause className="w-3 h-3" /> : <FaPlay className="w-3 h-3 ml-0.5" />}
      </button>

      <div className="flex-1 min-w-0">
        <input
          type="range"
          min={-1}
          max={seasons.length - 1}
          value={selectedIndex}
          onChange={(e) => {
            setPlaying(false);
            handleChange(Number(e.target.value));
          }}
          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-primary-500
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
        />
      </div>

      <span className="flex-shrink-0 text-xs font-medium text-slate-600 dark:text-slate-400 w-16 text-right">
        {currentLabel}
      </span>
    </div>
  );
}
