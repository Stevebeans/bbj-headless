"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { searchPlayers } from "@/lib/api/settings";

/**
 * Searchable dropdown for selecting a favorite player
 */
export default function PlayerSearchDropdown({
  value, // { id, name, nickname, display_name, season, photo_url } | null
  onChange, // (player | null) => void
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setPlayers([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await searchPlayers(query);
        if (result.success) {
          setPlayers(result.players);
        }
      } catch (err) {
        setError(err.message);
        setPlayers([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const handleSelect = (player) => {
    onChange(player);
    setQuery("");
    setPlayers([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(null);
    setQuery("");
    setPlayers([]);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        Favorite Player
      </label>

      {/* Selected player display or search input */}
      {value && !isOpen ? (
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          {value.photo_url ? (
            <Image
              src={value.photo_url}
              alt={value.name}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
              unoptimized
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                {value.name?.charAt(0) || "?"}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {value.display_name || value.name}
            </p>
            {value.season && (
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {value.season}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              disabled={disabled}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
              aria-label="Change player"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
              aria-label="Clear selection"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          {loading && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder="Search for a player..."
            disabled={disabled}
            className={`w-full py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed ${loading ? 'pl-10 pr-4' : 'px-4'}`}
          />
        </div>
      )}

      {/* Dropdown results */}
      {isOpen && (query.length >= 2 || players.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {error && (
            <div className="p-3 text-sm text-red-500">{error}</div>
          )}

          {!loading && players.length === 0 && query.length >= 2 && !error && (
            <div className="p-3 text-sm text-gray-500 dark:text-gray-400">
              No players found matching &quot;{query}&quot;
            </div>
          )}

          {players.map((player) => (
            <button
              key={player.id}
              type="button"
              onClick={() => handleSelect(player)}
              className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
            >
              {player.photo_url ? (
                <Image
                  src={player.photo_url}
                  alt={player.name}
                  width={36}
                  height={36}
                  className="w-9 h-9 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-600 dark:text-primary-400">
                    {player.name?.charAt(0) || "?"}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {player.display_name || player.name}
                </p>
                {player.season && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {player.season}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Show off your favorite Big Brother houseguest
      </p>
    </div>
  );
}
