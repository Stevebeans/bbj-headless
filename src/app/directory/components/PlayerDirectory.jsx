"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlayerCard, PlayerPicker } from "@/components/players";
import { FaSearch, FaUsers, FaCalendarAlt, FaMapMarkerAlt, FaChartBar, FaExchangeAlt, FaLock, FaCrown, FaEdit, FaFilter, FaSort, FaTimes } from "react-icons/fa";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { usePremium } from "@/hooks/usePremium";
import dynamic from "next/dynamic";

const PlayerMap = dynamic(() => import("./PlayerMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl" style={{ height: "min(70vh, 600px)" }}>
      <div className="text-center">
        <FaMapMarkerAlt className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-pulse" />
        <p className="text-sm text-slate-500">Loading map...</p>
      </div>
    </div>
  ),
});

const API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

const TABS = [
  { id: "players", label: "Players", icon: FaUsers },
  { id: "seasons", label: "Seasons", icon: FaCalendarAlt },
  { id: "compare", label: "Compare", icon: FaExchangeAlt },
  { id: "stats", label: "Stats", icon: FaChartBar },
  { id: "map", label: "Map", icon: FaMapMarkerAlt },
];

const PER_PAGE_OPTIONS = [10, 25, 50, 100];

export function PlayerDirectory({ initialPlayers, seasons }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin } = useAuth();

  // Get initial tab from URL or default to "players"
  const initialTab = searchParams.get("tab") || "players";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [players, setPlayers] = useState(initialPlayers.players || []);
  const [totalPlayers, setTotalPlayers] = useState(initialPlayers.total || 0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(initialPlayers.total_pages || 1);
  const [perPage, setPerPage] = useState(25);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedSeason, setSelectedSeason] = useState("");
  const [selectedGenders, setSelectedGenders] = useState([]);
  const [selectedAchievements, setSelectedAchievements] = useState([]);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Sort
  const [sortBy, setSortBy] = useState("first_name");
  const [sortOrder, setSortOrder] = useState("ASC");

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch players when filters change
  const fetchPlayers = useCallback(async (page = 1, itemsPerPage = perPage) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        per_page: String(itemsPerPage),
        page: String(page),
        orderby: sortBy,
        order: sortOrder,
      });

      if (debouncedSearch) params.append("search", debouncedSearch);
      if (selectedSeason) params.append("season", selectedSeason);
      if (selectedGenders.length > 0) params.append("gender", selectedGenders.join(","));
      if (selectedAchievements.length > 0) params.append("achievement", selectedAchievements.join(","));

      const response = await fetch(`${API_URL}/bbjd/v1/players?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setPlayers(data.players || []);
        setTotalPlayers(data.total || 0);
        setCurrentPage(data.page || 1);
        setTotalPages(data.total_pages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch players:", error);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedSeason, selectedGenders, selectedAchievements, sortBy, sortOrder, perPage]);

  // Refetch when filters change
  useEffect(() => {
    if (activeTab === "players") {
      fetchPlayers(1, perPage);
    }
  }, [debouncedSearch, selectedSeason, selectedGenders, selectedAchievements, sortBy, sortOrder, activeTab, fetchPlayers, perPage]);

  // Update URL when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const params = new URLSearchParams(searchParams);
    params.set("tab", tabId);
    router.push(`?${params.toString()}`, { scroll: false });
  };

  // Clear filters
  const clearFilters = () => {
    setSearch("");
    setSelectedSeason("");
    setSelectedGenders([]);
    setSelectedAchievements([]);
  };

  const hasActiveFilters = search || selectedSeason || selectedGenders.length > 0 || selectedAchievements.length > 0;
  const activeFilterCount = (selectedGenders.length > 0 ? 1 : 0) + (selectedAchievements.length > 0 ? 1 : 0);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 font-medium text-sm
                border-b-2 -mb-px transition-colors
                ${isActive
                  ? "border-primary-500 text-primary-600 dark:text-primary-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "players" && (
        <PlayersTab
          players={players}
          totalPlayers={totalPlayers}
          seasons={seasons}
          loading={loading}
          search={search}
          setSearch={setSearch}
          selectedSeason={selectedSeason}
          setSelectedSeason={setSelectedSeason}
          selectedGenders={selectedGenders}
          setSelectedGenders={setSelectedGenders}
          selectedAchievements={selectedAchievements}
          setSelectedAchievements={setSelectedAchievements}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          hasActiveFilters={hasActiveFilters}
          activeFilterCount={activeFilterCount}
          clearFilters={clearFilters}
          currentPage={currentPage}
          totalPages={totalPages}
          perPage={perPage}
          setPerPage={setPerPage}
          onPageChange={(page) => fetchPlayers(page, perPage)}
        />
      )}

      {activeTab === "seasons" && <SeasonsTab seasons={seasons} isAdmin={isAdmin()} />}

      {activeTab === "compare" && <CompareTab />}

      {activeTab === "stats" && <StatsTab totalPlayers={totalPlayers} seasons={seasons} />}

      {activeTab === "map" && <MapTab seasons={seasons} />}
    </div>
  );
}

function PlayersTab({
  players,
  totalPlayers,
  seasons,
  loading,
  search,
  setSearch,
  selectedSeason,
  setSelectedSeason,
  selectedGenders,
  setSelectedGenders,
  selectedAchievements,
  setSelectedAchievements,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  hasActiveFilters,
  activeFilterCount,
  clearFilters,
  currentPage,
  totalPages,
  perPage,
  setPerPage,
  onPageChange,
}) {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showSortModal, setShowSortModal] = useState(false);

  const toggleGender = (gender) => {
    setSelectedGenders((prev) =>
      prev.includes(gender) ? prev.filter((g) => g !== gender) : [...prev, gender]
    );
  };

  const toggleAchievement = (achievement) => {
    setSelectedAchievements((prev) =>
      prev.includes(achievement) ? prev.filter((a) => a !== achievement) : [...prev, achievement]
    );
  };

  const handleSort = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
    setShowSortModal(false);
  };

  const getSortLabel = () => {
    const labels = {
      first_name: "First Name",
      last_name: "Last Name",
      age: "Age",
    };
    return `${labels[sortBy] || "Name"} ${sortOrder === "ASC" ? "↑" : "↓"}`;
  };

  return (
    <div className="space-y-4">
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-sm">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg
              bg-white dark:bg-slate-800 text-slate-800 dark:text-white
              focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Season Filter */}
        <select
          value={selectedSeason}
          onChange={(e) => setSelectedSeason(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg
            bg-white dark:bg-slate-800 text-slate-800 dark:text-white
            focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">All Seasons</option>
          {seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.abbreviation || season.full_name}
            </option>
          ))}
        </select>

        {/* Filter Button */}
        <button
          onClick={() => setShowFilterModal(true)}
          className={`inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg
            transition-colors ${activeFilterCount > 0
              ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
              : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            } hover:bg-slate-50 dark:hover:bg-slate-700`}
        >
          <FaFilter className="w-3 h-3" />
          Filter
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-primary-500 text-white rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort Button */}
        <button
          onClick={() => setShowSortModal(true)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg
            bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300
            hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <FaSort className="w-3 h-3" />
          {getSortLabel()}
        </button>

        {/* Per Page - compact */}
        <select
          value={perPage}
          onChange={(e) => setPerPage(Number(e.target.value))}
          className="px-2 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg
            bg-white dark:bg-slate-800 text-slate-800 dark:text-white
            focus:ring-2 focus:ring-primary-500 focus:border-transparent w-16"
        >
          {PER_PAGE_OPTIONS.map((num) => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-sm text-slate-500 hover:text-red-500 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="text-sm text-slate-500 dark:text-slate-400">
        Showing {players.length} of {totalPlayers} players
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowFilterModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Filters</h3>
              <button onClick={() => setShowFilterModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            {/* Gender */}
            <div className="mb-4">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Gender</h4>
              <div className="flex gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedGenders.includes("male")}
                    onChange={() => toggleGender("male")}
                    className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Male</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedGenders.includes("female")}
                    onChange={() => toggleGender("female")}
                    className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Female</span>
                </label>
              </div>
            </div>

            {/* Achievement */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Achievement</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "winner", label: "Winner" },
                  { value: "runner_up", label: "Runner Up" },
                  { value: "afp", label: "AFP" },
                ].map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedAchievements.includes(opt.value)}
                      onChange={() => toggleAchievement(opt.value)}
                      className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedGenders([]);
                  setSelectedAchievements([]);
                }}
                className="flex-1 px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg
                  text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilterModal(false)}
                className="flex-1 px-4 py-2 text-sm bg-primary-500 text-white rounded-lg hover:bg-primary-600"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sort Modal */}
      {showSortModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowSortModal(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-xs w-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Sort By</h3>
              <button onClick={() => setShowSortModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              {[
                { field: "first_name", label: "First Name" },
                { field: "last_name", label: "Last Name" },
                { field: "age", label: "Age" },
              ].map((opt) => (
                <div key={opt.field} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                  <span className="text-sm text-slate-700 dark:text-slate-300">{opt.label}</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleSort(opt.field, "ASC")}
                      className={`px-2 py-1 text-xs rounded ${
                        sortBy === opt.field && sortOrder === "ASC"
                          ? "bg-primary-500 text-white"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      A-Z
                    </button>
                    <button
                      onClick={() => handleSort(opt.field, "DESC")}
                      className={`px-2 py-1 text-xs rounded ${
                        sortBy === opt.field && sortOrder === "DESC"
                          ? "bg-primary-500 text-white"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                      }`}
                    >
                      Z-A
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Players Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-40 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          <FaUsers className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No players found matching your filters.</p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-2 text-primary-500 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} showStats={true} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-slate-600 dark:text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg
              disabled:opacity-50 disabled:cursor-not-allowed
              hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function SeasonsTab({ seasons, isAdmin }) {
  if (!seasons || seasons.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <FaCalendarAlt className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No seasons available.</p>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="overflow-x-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-700 text-left">
            <th className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Season</th>
            <th className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 hidden md:table-cell">Start Date</th>
            <th className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 hidden md:table-cell">End Date</th>
            <th className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">Winner</th>
            <th className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 hidden sm:table-cell">AFP</th>
            <th className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 hidden lg:table-cell">Runner Up</th>
            {isAdmin && (
              <th className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300 w-16"></th>
            )}
          </tr>
        </thead>
        <tbody>
          {seasons.map((season) => (
            <tr
              key={season.id}
              className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              {/* Season Name */}
              <td className="py-3 px-4">
                <Link
                  href={`/bigbrother-seasons/${season.slug}`}
                  className="font-medium text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {season.name || season.full_name}
                </Link>
              </td>

              {/* Start Date */}
              <td className="py-3 px-4 text-slate-600 dark:text-slate-400 hidden md:table-cell">
                {formatDate(season.start_date)}
              </td>

              {/* End Date */}
              <td className="py-3 px-4 text-slate-600 dark:text-slate-400 hidden md:table-cell">
                {formatDate(season.end_date)}
              </td>

              {/* Winner */}
              <td className="py-3 px-4">
                {season.winner ? (
                  <PlayerLink player={season.winner} />
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </td>

              {/* AFP */}
              <td className="py-3 px-4 hidden sm:table-cell">
                {season.afp ? (
                  <PlayerLink player={season.afp} />
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </td>

              {/* Runner Up */}
              <td className="py-3 px-4 hidden lg:table-cell">
                {season.runner_up ? (
                  <PlayerLink player={season.runner_up} />
                ) : (
                  <span className="text-slate-400">-</span>
                )}
              </td>

              {/* Admin Edit */}
              {isAdmin && (
                <td className="py-3 px-4">
                  <Link
                    href={`/bigbrother-seasons/${season.slug}/edit`}
                    className="inline-flex items-center gap-1 text-slate-400 hover:text-primary-500"
                    title="Edit Season"
                  >
                    <FaEdit className="w-4 h-4" />
                  </Link>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlayerLink({ player }) {
  // Convert full URL to local path
  let href = player.permalink;
  try {
    const url = new URL(player.permalink);
    href = url.pathname;
  } catch {
    // Already a path
  }

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-300 hover:text-primary-500"
    >
      {player.photo && (
        <Image
          src={player.photo}
          alt={player.name}
          width={24}
          height={24}
          className="w-6 h-6 rounded-full object-cover"
          unoptimized
        />
      )}
      <span className="hover:underline">{player.name}</span>
    </Link>
  );
}

function CompareTab() {
  const [pickerOpen, setPickerOpen] = useState(true);

  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaExchangeAlt className="w-7 h-7 text-primary-500" />
        </div>
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Compare Players
        </h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
          Select two Big Brother players to see a head-to-head stat comparison.
        </p>
        <button
          onClick={() => setPickerOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
        >
          <FaExchangeAlt className="w-4 h-4" />
          Pick Players to Compare
        </button>
      </div>

      {/* Inline picker (imports lazily) */}
      <CompareTabPicker isOpen={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  );
}

function CompareTabPicker({ isOpen, onClose }) {
  return <PlayerPicker isOpen={isOpen} onClose={onClose} />;
}

function MapTab({ seasons }) {
  const { isPremium } = usePremium();
  const [players, setPlayers] = useState(null);
  const [allPlayers, setAllPlayers] = useState(null); // Full dataset for timeline filtering
  const [stateStats, setStateStats] = useState(null);
  const [premiumSeasons, setPremiumSeasons] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [mapSeason, setMapSeason] = useState("");
  const [mapGender, setMapGender] = useState([]);
  const [mapAchievement, setMapAchievement] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  // Detect dark mode
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const match = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(document.documentElement.classList.contains("dark") || match.matches);

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => observer.disconnect();
  }, []);

  // Fetch map data when filters change
  useEffect(() => {
    let cancelled = false;

    async function fetchMapData() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (mapSeason) params.append("season", mapSeason);
        if (isPremium) {
          params.append("detail", "premium");
          if (mapGender.length) params.append("gender", mapGender.join(","));
          if (mapAchievement.length) params.append("achievement", mapAchievement.join(","));
        }

        const qs = params.toString();
        const res = await fetch(`${API_URL}/bbjd/v1/players/map${qs ? `?${qs}` : ""}`);
        const data = await res.json();

        if (!cancelled) {
          const playerList = data.success ? data.players : [];
          setPlayers(playerList);
          setAllPlayers(playerList);

          if (isPremium && data.state_stats) {
            setStateStats(data.state_stats);
          }
          if (isPremium && data.seasons) {
            setPremiumSeasons(data.seasons);
          }
        }
      } catch (err) {
        if (!cancelled) setError("Failed to load map data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchMapData();
    return () => { cancelled = true; };
  }, [mapSeason, mapGender, mapAchievement, isPremium]);

  // Timeline season change: filter locally from allPlayers
  const handleTimelineSeasonChange = useCallback((seasonId) => {
    if (!seasonId || !allPlayers) {
      setPlayers(allPlayers);
      return;
    }
    setPlayers(allPlayers.filter((p) => p.season_ids?.includes(seasonId)));
  }, [allPlayers]);

  const advancedFilterCount = mapGender.length + mapAchievement.length;

  if (error) {
    return (
      <div className="text-center py-16">
        <FaMapMarkerAlt className="w-10 h-10 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-500 dark:text-slate-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Season dropdown (free) */}
        <select
          value={mapSeason}
          onChange={(e) => setMapSeason(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg
            bg-white dark:bg-slate-800 text-slate-800 dark:text-white
            focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">All Seasons</option>
          {seasons?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.abbreviation || s.full_name}
            </option>
          ))}
        </select>

        {/* Player count */}
        {players && (
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {players.length} players
          </span>
        )}

        {/* Advanced filters (premium) */}
        <div className="ml-auto">
          {isPremium ? (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
                advancedFilterCount > 0
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                  : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              } hover:bg-slate-50 dark:hover:bg-slate-700`}
            >
              <FaFilter className="w-3 h-3" />
              Filters
              {advancedFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-primary-500 text-white rounded-full">
                  {advancedFilterCount}
                </span>
              )}
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400">
              <FaLock className="w-3 h-3" />
              <Link href="/become-supporter" className="hover:text-secondary-500">Premium filters</Link>
            </span>
          )}
        </div>
      </div>

      {/* Advanced filters panel (premium) */}
      {showFilters && isPremium && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex flex-wrap gap-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Gender</h4>
              <div className="flex gap-3">
                {["Male", "Female"].map((g) => (
                  <label key={g} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mapGender.includes(g)}
                      onChange={() => setMapGender((prev) =>
                        prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
                      )}
                      className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{g}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-2">Achievement</h4>
              <div className="flex gap-3">
                {[
                  { value: "winner", label: "Winner" },
                  { value: "runner_up", label: "Runner Up" },
                  { value: "afp", label: "AFP" },
                ].map((a) => (
                  <label key={a.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mapAchievement.includes(a.value)}
                      onChange={() => setMapAchievement((prev) =>
                        prev.includes(a.value) ? prev.filter((x) => x !== a.value) : [...prev, a.value]
                      )}
                      className="w-4 h-4 rounded border-slate-300 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="text-sm text-slate-600 dark:text-slate-400">{a.label}</span>
                  </label>
                ))}
              </div>
            </div>
            {advancedFilterCount > 0 && (
              <button
                onClick={() => { setMapGender([]); setMapAchievement([]); }}
                className="self-end text-sm text-slate-500 hover:text-red-500"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Map */}
      {loading || !players ? (
        <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl" style={{ height: "min(70vh, 600px)" }}>
          <div className="text-center">
            <FaMapMarkerAlt className="w-8 h-8 text-slate-400 mx-auto mb-2 animate-pulse" />
            <p className="text-sm text-slate-500">Loading player data...</p>
          </div>
        </div>
      ) : (
        <PlayerMap
          players={players}
          isDark={isDark}
          isPremium={isPremium}
          stateStats={stateStats}
          premiumSeasons={premiumSeasons}
          onTimelineSeasonChange={handleTimelineSeasonChange}
        />
      )}

      {/* Stats bar */}
      {players && (
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span>{players.length} players mapped</span>
          <span>Click markers for player details</span>
        </div>
      )}
    </div>
  );
}

function StatsTab({ totalPlayers, seasons }) {
  const { isPremium } = usePremium();

  // Sample stats - in production these would come from an API
  const stats = {
    totalPlayers: totalPlayers || 92,
    totalSeasons: seasons?.length || 27,
    malePercentage: 52,
    femalePercentage: 48,
    avgAge: 28,
    mostCommonState: "California",
    totalHoHWins: 156,
    totalPoVWins: 142,
  };

  return (
    <div className="space-y-8">
      {/* Basic Stats Grid */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
          Overview
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Players" value={stats.totalPlayers} />
          <StatCard label="Total Seasons" value={stats.totalSeasons} />
          <StatCard label="Male Players" value={`${stats.malePercentage}%`} />
          <StatCard label="Female Players" value={`${stats.femalePercentage}%`} />
        </div>
      </div>

      {/* Competition Stats */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
          Competition Stats
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total HoH Wins" value={stats.totalHoHWins} color="emerald" />
          <StatCard label="Total PoV Wins" value={stats.totalPoVWins} color="yellow" />
          <StatCard label="Average Age" value={stats.avgAge} />
          <StatCard label="Most Common State" value={stats.mostCommonState} small />
        </div>
      </div>

      {/* Premium Stats Section */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
            Advanced Stats
          </h3>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary-500 text-white text-xs font-semibold rounded-full">
            <FaCrown className="w-3 h-3" />
            Premium
          </span>
        </div>

        {isPremium ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Win Rate Leaders" value="View" link />
            <StatCard label="Comp Beast Index" value="View" link />
            <StatCard label="Social Game Score" value="View" link />
            <StatCard label="Jury Management" value="View" link />
          </div>
        ) : (
          <div className="relative">
            {/* Blurred preview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 blur-sm pointer-events-none select-none">
              <StatCard label="Win Rate Leaders" value="87%" />
              <StatCard label="Comp Beast Index" value="9.2" />
              <StatCard label="Social Game Score" value="8.5" />
              <StatCard label="Jury Management" value="94%" />
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 rounded-xl">
              <div className="text-center p-6">
                <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900/30 rounded-full
                  flex items-center justify-center mx-auto mb-3">
                  <FaLock className="w-5 h-5 text-secondary-500" />
                </div>
                <h4 className="font-semibold text-slate-800 dark:text-white mb-1">
                  Unlock Advanced Stats
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                  Get detailed analytics with a premium membership
                </p>
                <Link
                  href="/become-supporter"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-500 hover:bg-secondary-600
                    text-white font-medium rounded-lg transition-colors"
                >
                  <FaCrown className="w-4 h-4" />
                  Go Premium
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Leaderboards Preview */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
          All-Time Leaderboards
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LeaderboardCard
            title="Most HoH Wins"
            leaders={[
              { name: "Janelle Pierzina", value: 7 },
              { name: "Paul Abrahamian", value: 6 },
              { name: "Rachel Reilly", value: 5 },
            ]}
            isPremium={isPremium}
          />
          <LeaderboardCard
            title="Most PoV Wins"
            leaders={[
              { name: "Janelle Pierzina", value: 5 },
              { name: "Michael Bruner", value: 5 },
              { name: "Daniele Donato", value: 4 },
            ]}
            isPremium={isPremium}
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, small, link }) {
  const colorClasses = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    yellow: "text-yellow-600 dark:text-yellow-400",
    default: "text-slate-800 dark:text-white",
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200
      dark:border-slate-700 p-4 text-center">
      <div className={`${small ? "text-lg" : "text-2xl"} font-bold ${colorClasses[color] || colorClasses.default}`}>
        {value}
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
        {label}
      </div>
    </div>
  );
}

function LeaderboardCard({ title, leaders, isPremium }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200
      dark:border-slate-700 p-4">
      <h4 className="font-semibold text-slate-800 dark:text-white mb-3">{title}</h4>
      <div className="space-y-2">
        {leaders.map((leader, index) => (
          <div
            key={leader.name}
            className="flex items-center justify-between py-2 border-b border-slate-100
              dark:border-slate-700 last:border-0"
          >
            <div className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${index === 0 ? "bg-yellow-100 text-yellow-700" : ""}
                ${index === 1 ? "bg-slate-200 text-slate-700" : ""}
                ${index === 2 ? "bg-orange-100 text-orange-700" : ""}
              `}>
                {index + 1}
              </span>
              <span className="text-sm text-slate-700 dark:text-slate-300">{leader.name}</span>
            </div>
            <span className="font-semibold text-slate-800 dark:text-white">{leader.value}</span>
          </div>
        ))}
      </div>
      {!isPremium && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <Link
            href="/become-supporter"
            className="text-sm text-secondary-500 hover:text-secondary-600 flex items-center gap-1"
          >
            <FaLock className="w-3 h-3" />
            View full leaderboard
          </Link>
        </div>
      )}
    </div>
  );
}
