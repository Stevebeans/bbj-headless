"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { FeedUpdateCard } from "./FeedUpdateCard";

const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_API_URL;

export function FeedUpdatesSection({ updates: initialUpdates = [] }) {
  const [updates, setUpdates] = useState(initialUpdates);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      // Calculate offset based on current updates
      const offset = updates.length;
      const response = await fetch(
        `${WORDPRESS_API_URL}/bbjd/v1/feed-updates?per_page=10&offset=${offset}`
      );

      if (!response.ok) throw new Error("Failed to fetch");

      const data = await response.json();
      const newUpdates = data.updates || [];

      if (newUpdates.length === 0) {
        setHasMore(false);
      } else {
        setUpdates((prev) => [...prev, ...newUpdates]);
        // If we got fewer than requested, no more to load
        if (newUpdates.length < 10) {
          setHasMore(false);
        }
      }
    } catch (error) {
      console.error("Error loading more updates:", error);
    } finally {
      setIsLoading(false);
    }
  }, [updates.length, isLoading, hasMore]);

  return (
    <section className="v2-primary-container-inner p-2 flex-grow" aria-labelledby="main-feeds">
      <h2 id="main-feeds" className="v2-primary-subheader">
        Latest Feed Updates
      </h2>

      {/* Feed updates list */}
      <div className="lg:max-h-[1300px] lg:min-h-0 lg:overflow-y-auto">
        {updates.length > 0 ? (
          updates.map((update) => (
            <FeedUpdateCard key={update.id} update={update} />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No feed updates available.
          </div>
        )}

        {/* Load More Button - inside scrollable area for mobile */}
        {hasMore && updates.length > 0 && (
          <div className="py-4 text-center">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Loading...
                </>
              ) : (
                "Load More Updates"
              )}
            </button>
          </div>
        )}
      </div>

      {/* View All Link */}
      <div className="w-full text-center text-xl font-display mt-4 py-2 border-t border-gray-200 dark:border-gray-700">
        <Link
          href="/feed-updates"
          className="text-primary-500 hover:text-primary-600 dark:text-primary-400"
        >
          View All Feed Updates
        </Link>
      </div>
    </section>
  );
}
