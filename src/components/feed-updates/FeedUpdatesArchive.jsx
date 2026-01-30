"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { FeedUpdateCard } from "./FeedUpdateCard";
import { getFeedUpdates } from "@/lib/api/feedUpdates";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "highest", label: "Highest Rated" },
  { value: "lowest", label: "Lowest Rated" },
];

const DATE_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

const MODE_OPTIONS = [
  { value: "", label: "All Updates" },
  { value: "feed", label: "Feed Updates" },
  { value: "show", label: "Show Updates" },
];

export function FeedUpdatesArchive({ initialData }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse URL params
  const initialSort = searchParams.get("sort") || "newest";
  const initialDateRange = searchParams.get("date_range") || "all";
  const initialMode = searchParams.get("mode") || "";
  const initialSearch = searchParams.get("search") || "";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  // State
  const [updates, setUpdates] = useState(initialData?.updates || []);
  const [total, setTotal] = useState(initialData?.total || 0);
  const [totalPages, setTotalPages] = useState(initialData?.total_pages || 1);
  const [isLoading, setIsLoading] = useState(false);

  // Filters
  const [sort, setSort] = useState(initialSort);
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [mode, setMode] = useState(initialMode);
  const [search, setSearch] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [page, setPage] = useState(initialPage);

  // Update URL with current filters
  const updateUrl = useCallback(
    (newParams) => {
      const params = new URLSearchParams();
      const values = {
        sort,
        date_range: dateRange,
        mode,
        search,
        page: String(page),
        ...newParams,
      };

      // Only add non-default values
      if (values.sort !== "newest") params.set("sort", values.sort);
      if (values.date_range !== "all") params.set("date_range", values.date_range);
      if (values.mode) params.set("mode", values.mode);
      if (values.search) params.set("search", values.search);
      if (values.page !== "1") params.set("page", values.page);

      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [router, pathname, sort, dateRange, mode, search, page]
  );

  // Fetch updates when filters change
  const fetchUpdates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getFeedUpdates({
        page,
        perPage: 20,
        sort,
        dateRange,
        mode: mode || undefined,
        search: search || undefined,
      });
      setUpdates(data.updates || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error("Failed to fetch updates:", err);
    } finally {
      setIsLoading(false);
    }
  }, [page, sort, dateRange, mode, search]);

  // Fetch on filter changes
  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  // Handle filter changes
  const handleSortChange = (newSort) => {
    setSort(newSort);
    setPage(1);
    updateUrl({ sort: newSort, page: "1" });
  };

  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);
    setPage(1);
    updateUrl({ date_range: newDateRange, page: "1" });
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setPage(1);
    updateUrl({ mode: newMode, page: "1" });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
    updateUrl({ search: searchInput, page: "1" });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    updateUrl({ page: String(newPage) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => {
    setSort("newest");
    setDateRange("all");
    setMode("");
    setSearch("");
    setSearchInput("");
    setPage(1);
    router.push(pathname);
  };

  const hasFilters = sort !== "newest" || dateRange !== "all" || mode || search;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap gap-4 items-end">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search updates..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
              >
                Search
              </button>
            </div>
          </form>

          {/* Sort */}
          <div className="w-40">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Sort By
            </label>
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="w-36">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <select
              value={dateRange}
              onChange={(e) => handleDateRangeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              {DATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Mode */}
          <div className="w-36">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              value={mode}
              onChange={(e) => handleModeChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
              {MODE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>
          {total} {total === 1 ? "update" : "updates"} found
        </span>
        {isLoading && (
          <span className="flex items-center gap-2">
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading...
          </span>
        )}
      </div>

      {/* Updates List */}
      <div className={`space-y-4 ${isLoading ? "opacity-60" : ""}`}>
        {updates.length > 0 ? (
          updates.map((update) => (
            <FeedUpdateCard key={update.id} update={update} />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {search ? (
              <p>No updates found matching "{search}"</p>
            ) : (
              <p>No feed updates yet.</p>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <span className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
