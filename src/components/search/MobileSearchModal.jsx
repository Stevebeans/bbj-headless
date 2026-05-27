"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toRelativeHref } from "@/lib/utils/url";

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

export function MobileSearchModal({ isOpen, onClose }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Flatten results for keyboard navigation (order: Players, Seasons, Feed Updates, Posts/Pages)
  const flatResults = results
    ? [
        ...(results.players || []).map((r) => ({ ...r, type: "player" })),
        ...(results.seasons || []).map((r) => ({ ...r, type: "season" })),
        ...(results.feed_updates || []).map((r) => ({ ...r, type: "feed_update" })),
        ...(results.general || []).map((r) => ({ ...r, type: "general" })),
      ]
    : [];

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
      setResults(null);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Search function
  const search = useCallback(async (searchQuery) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (searchQuery.length < MIN_QUERY_LENGTH) {
      setResults(null);
      return;
    }

    setIsLoading(true);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json"}/bbjd/v1/search?query=${encodeURIComponent(searchQuery)}`,
        { signal: abortControllerRef.current.signal }
      );

      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      setResults(data);
      setActiveIndex(-1);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("Search error:", err);
      setResults({ general: [], players: [], seasons: [], feed_updates: [] });
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, []);

  // Debounced search effect
  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults(null);
      return;
    }

    const timer = setTimeout(() => search(trimmed), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }

    if (flatResults.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) => (prev < flatResults.length - 1 ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : flatResults.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && flatResults[activeIndex]) {
          onClose();
          router.push(toRelativeHref(flatResults[activeIndex].permalink));
        }
        break;
    }
  };

  const totalResults =
    (results?.general?.length || 0) +
    (results?.players?.length || 0) +
    (results?.seasons?.length || 0) +
    (results?.feed_updates?.length || 0);

  const hasResults = totalResults > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="p-2 -ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400"
          aria-label="Close search"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search posts, players, seasons..."
            className="w-full px-4 py-2 pr-10 rounded-full border border-primary-500 bg-gray-50 dark:bg-gray-700 dark:text-white text-base focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoComplete="off"
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isLoading ? (
              <svg className="w-5 h-5 text-primary-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : query.length > 0 ? (
              <button
                onClick={() => setQuery("")}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="overflow-y-auto h-[calc(100vh-64px)]">
        {query.length > 0 && query.length < MIN_QUERY_LENGTH && (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Type at least {MIN_QUERY_LENGTH} characters to search
          </div>
        )}

        {isLoading && !results && (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            Searching...
          </div>
        )}

        {!isLoading && !hasResults && query.length >= MIN_QUERY_LENGTH && (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No results found for "{query}"
          </div>
        )}

        {hasResults && (
          <div className="py-2">
            {/* Player Results */}
            {results.players?.length > 0 && (
              <ResultSection
                title="Players"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
                count={results.players.length}
              >
                {results.players.map((item, idx) => (
                  <PlayerResultItem
                    key={item.permalink}
                    item={item}
                    isActive={activeIndex === idx}
                    onClose={onClose}
                  />
                ))}
              </ResultSection>
            )}

            {/* Season Results */}
            {results.seasons?.length > 0 && (
              <ResultSection
                title="Seasons"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                }
                count={results.seasons.length}
              >
                {results.seasons.map((item, idx) => {
                  const flatIdx = (results.players?.length || 0) + idx;
                  return (
                    <ResultItem
                      key={item.permalink}
                      item={item}
                      isActive={activeIndex === flatIdx}
                      onClose={onClose}
                    />
                  );
                })}
              </ResultSection>
            )}

            {/* Feed Update Results */}
            {results.feed_updates?.length > 0 && (
              <ResultSection
                title="Feed Updates"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                }
                count={results.feed_updates.length}
              >
                {results.feed_updates.map((item, idx) => {
                  const flatIdx = (results.players?.length || 0) + (results.seasons?.length || 0) + idx;
                  return (
                    <FeedUpdateResultItem
                      key={item.permalink}
                      item={item}
                      isActive={activeIndex === flatIdx}
                      onClose={onClose}
                    />
                  );
                })}
              </ResultSection>
            )}

            {/* General Results (Posts & Pages) */}
            {results.general?.length > 0 && (
              <ResultSection
                title="Posts & Pages"
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                }
                count={results.general.length}
              >
                {results.general.map((item, idx) => {
                  const flatIdx = (results.players?.length || 0) + (results.seasons?.length || 0) + (results.feed_updates?.length || 0) + idx;
                  return (
                    <ResultItem
                      key={item.permalink}
                      item={item}
                      isActive={activeIndex === flatIdx}
                      onClose={onClose}
                    />
                  );
                })}
              </ResultSection>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultSection({ title, icon, count, children }) {
  return (
    <div className="mb-2">
      <div className="px-4 py-2 flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {icon}
        <span>{title}</span>
        <span className="ml-auto bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-[10px]">
          {count}
        </span>
      </div>
      <div>{children}</div>
    </div>
  );
}

function ResultItem({ item, isActive, onClose }) {
  return (
    <Link
      href={toRelativeHref(item.permalink)}
      onClick={onClose}
      className={`block px-4 py-3 transition-colors ${
        isActive
          ? "bg-primary-500 text-white"
          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
      }`}
    >
      <span className="text-base">{item.title}</span>
    </Link>
  );
}

function PlayerResultItem({ item, isActive, onClose }) {
  const imageUrl = item.player_image?.url || item.player_image;

  return (
    <Link
      href={toRelativeHref(item.permalink)}
      onClick={onClose}
      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
        isActive
          ? "bg-primary-500 text-white"
          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
      }`}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          width={44}
          height={44}
          className="w-11 h-11 rounded-full object-cover"
          unoptimized
        />
      ) : (
        <div className="w-11 h-11 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-gray-500 text-lg font-bold">
          {item.title?.charAt(0) || "?"}
        </div>
      )}
      <div>
        <span className="text-base font-medium">{item.title}</span>
        {item.abbreviation && (
          <span className={`ml-2 text-sm ${isActive ? "text-white/70" : "text-gray-400"}`}>
            ({item.abbreviation})
          </span>
        )}
      </div>
    </Link>
  );
}

function FeedUpdateResultItem({ item, isActive, onClose }) {
  return (
    <Link
      href={toRelativeHref(item.permalink)}
      onClick={onClose}
      className={`block px-4 py-3 transition-colors ${
        isActive
          ? "bg-primary-500 text-white"
          : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
      }`}
    >
      <div className="flex items-start gap-3">
        {item.thumbnail && (
          <Image
            src={item.thumbnail}
            alt=""
            width={48}
            height={48}
            className="w-12 h-12 rounded object-cover flex-shrink-0"
            unoptimized
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="text-base font-medium">{item.title}</div>
          {item.excerpt && (
            <p className={`text-sm mt-1 line-clamp-2 ${isActive ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>
              {item.excerpt}
            </p>
          )}
          <div className={`text-xs mt-1 ${isActive ? "text-white/60" : "text-gray-400"}`}>
            {item.date} {item.time && `at ${item.time}`}
          </div>
        </div>
      </div>
    </Link>
  );
}
