"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FaTimes, FaSearch, FaExchangeAlt } from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

/**
 * Dual player search modal for selecting two players to compare.
 * Debounced search against /bbjd/v1/players?search=...
 */
export function PlayerPicker({ isOpen, onClose, preselectedPlayer = null }) {
  const router = useRouter();
  const [player1, setPlayer1] = useState(preselectedPlayer);
  const [player2, setPlayer2] = useState(null);
  const [activeSlot, setActiveSlot] = useState(preselectedPlayer ? 2 : 1);

  // Reset state when opened/closed
  useEffect(() => {
    if (isOpen) {
      setPlayer1(preselectedPlayer);
      setPlayer2(null);
      setActiveSlot(preselectedPlayer ? 2 : 1);
    }
  }, [isOpen, preselectedPlayer]);

  const handleSelect = useCallback(
    (player) => {
      if (activeSlot === 1) {
        setPlayer1(player);
        setActiveSlot(2);
      } else {
        setPlayer2(player);
      }
    },
    [activeSlot]
  );

  const handleCompare = useCallback(() => {
    if (!player1?.slug || !player2?.slug) return;

    // Canonical ordering
    const [s1, s2] =
      player1.slug <= player2.slug
        ? [player1.slug, player2.slug]
        : [player2.slug, player1.slug];

    onClose();
    router.push(`/compare/${s1}-vs-${s2}`);
  }, [player1, player2, onClose, router]);

  if (!isOpen) return null;

  const excludeIds = [player1?.id, player2?.id].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-display text-xl text-gray-800 dark:text-white">Compare Players</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Selected players */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <PlayerSlot
              player={player1}
              label="Player 1"
              isActive={activeSlot === 1}
              onClick={() => { setActiveSlot(1); setPlayer1(null); }}
            />
            <FaExchangeAlt className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <PlayerSlot
              player={player2}
              label="Player 2"
              isActive={activeSlot === 2}
              onClick={() => { setActiveSlot(2); setPlayer2(null); }}
            />
          </div>
        </div>

        {/* Search */}
        <div className="flex-1 overflow-hidden flex flex-col">
          <PlayerSearch
            onSelect={handleSelect}
            excludeIds={excludeIds}
            placeholder={`Search for Player ${activeSlot}...`}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCompare}
            disabled={!player1 || !player2}
            className="w-full py-2.5 px-4 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
          >
            {player1 && player2
              ? `Compare ${player1.name?.split(" ")[0]} vs ${player2.name?.split(" ")[0]}`
              : "Select two players"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerSlot({ player, label, isActive, onClick }) {
  if (!player) {
    return (
      <div
        className={`flex-1 flex items-center gap-2 p-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
          isActive
            ? "border-primary-400 bg-primary-50 dark:bg-primary-900/20"
            : "border-gray-200 dark:border-gray-600 hover:border-gray-300"
        }`}
        onClick={onClick}
      >
        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <span className="text-xs text-gray-400">?</span>
        </div>
        <span className="text-sm text-gray-400 dark:text-gray-500">{label}</span>
      </div>
    );
  }

  return (
    <div
      className={`flex-1 flex items-center gap-2 p-2 rounded-lg border-2 cursor-pointer transition-colors ${
        isActive
          ? "border-primary-400 bg-primary-50 dark:bg-primary-900/20"
          : "border-gray-200 dark:border-gray-600"
      }`}
      onClick={onClick}
    >
      <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
        {player.photo ? (
          <Image src={player.photo} alt={player.name} fill className="object-cover" sizes="32px" />
        ) : (
          <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
            {player.name?.charAt(0)}
          </div>
        )}
      </div>
      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
        {player.name}
      </span>
    </div>
  );
}

function PlayerSearch({ onSelect, excludeIds, placeholder }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const search = useCallback(
    async (term) => {
      if (!term || term.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const params = new URLSearchParams({ search: term, per_page: "10" });
        const res = await fetch(`${API_URL}/bbjd/v1/players?${params}`);
        const data = await res.json();

        if (data.success && data.players) {
          setResults(
            data.players
              .filter((p) => !excludeIds.includes(p.id))
              .map((p) => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                photo: p.photo?.url || p.photo || null,
                seasons: p.stats?.total_seasons || p.seasons?.length || 0,
              }))
          );
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [excludeIds]
  );

  const handleChange = useCallback(
    (e) => {
      const val = e.target.value;
      setQuery(val);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => search(val), 300);
    },
    [search]
  );

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="p-3">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="overflow-y-auto max-h-60 px-3 pb-3">
        {loading && (
          <div className="text-center py-4 text-sm text-gray-400">Searching...</div>
        )}

        {!loading && results.length === 0 && query.length >= 2 && (
          <div className="text-center py-4 text-sm text-gray-400">No players found</div>
        )}

        {!loading &&
          results.map((player) => (
            <button
              key={player.id}
              onClick={() => {
                onSelect(player);
                setQuery("");
                setResults([]);
              }}
              className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
            >
              <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
                {player.photo ? (
                  <Image src={player.photo} alt={player.name} fill className="object-cover" sizes="36px" />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
                    {player.name?.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {player.name}
                </div>
                {player.seasons > 0 && (
                  <div className="text-xs text-gray-400">
                    {player.seasons} season{player.seasons !== 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}
