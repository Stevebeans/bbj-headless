"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { searchUsers } from "@/lib/api/comments";

// Cache for search results (in-memory + localStorage)
const CACHE_KEY = "bbj_mention_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCache() {
  if (typeof window === "undefined") return {};
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return {};
    const data = JSON.parse(cached);
    // Clean expired entries
    const now = Date.now();
    Object.keys(data).forEach((key) => {
      if (data[key].expires < now) delete data[key];
    });
    return data;
  } catch {
    return {};
  }
}

function setCache(query, users) {
  if (typeof window === "undefined") return;
  try {
    const cache = getCache();
    cache[query.toLowerCase()] = {
      users,
      expires: Date.now() + CACHE_TTL,
    };
    // Limit cache size to 100 entries
    const keys = Object.keys(cache);
    if (keys.length > 100) {
      keys.slice(0, keys.length - 100).forEach((k) => delete cache[k]);
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage full or unavailable
  }
}

function getCachedResult(query) {
  const cache = getCache();
  const entry = cache[query.toLowerCase()];
  if (entry && entry.expires > Date.now()) {
    return entry.users;
  }
  return null;
}

export default function MentionAutocomplete({ query, anchorRef, onSelect, onClose }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef(null);

  // Mount check for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate position based on anchor element
  useEffect(() => {
    if (anchorRef?.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPosition({
        top: rect.top + window.scrollY - 8, // Position above with small gap
        left: rect.left + window.scrollX,
      });
    }
  }, [anchorRef, query]);

  // Search users when query changes (with caching)
  useEffect(() => {
    if (!query || query.length < 1) {
      setUsers([]);
      return;
    }

    // Check cache first
    const cached = getCachedResult(query);
    if (cached) {
      setUsers(cached);
      setSelectedIndex(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    const searchTimeout = setTimeout(async () => {
      try {
        const result = await searchUsers(query, 8);
        const fetchedUsers = result.users || [];
        setUsers(fetchedUsers);
        setSelectedIndex(0);
        // Cache the result
        setCache(query, fetchedUsers);
      } catch (error) {
        console.error("User search failed:", error);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 150); // Reduced debounce since we have caching

    return () => clearTimeout(searchTimeout);
  }, [query]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (users.length === 0) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % users.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + users.length) % users.length);
          break;
        case "Enter":
        case "Tab":
          e.preventDefault();
          if (users[selectedIndex]) {
            onSelect(users[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [users, selectedIndex, onSelect, onClose]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!mounted || !query || (users.length === 0 && !loading)) {
    return null;
  }

  const dropdown = (
    <div
      ref={containerRef}
      className="fixed z-[99999] w-64 max-h-64 overflow-y-auto bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700"
      style={{
        top: position.top,
        left: position.left,
        transform: "translateY(-100%)", // Position above the anchor
      }}
    >
      {loading && users.length === 0 && (
        <div className="p-3 text-center text-sm text-slate-500">
          <div className="animate-spin inline-block w-4 h-4 border-2 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full" />
        </div>
      )}

      {users.length > 0 && (
        <ul className="py-1">
          {users.map((user, index) => (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => onSelect(user)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                  index === selectedIndex
                    ? "bg-primary-50 dark:bg-primary-900/30"
                    : "hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.display_name}
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs font-bold">
                      {user.display_name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>

                {/* Name & Rank */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-slate-800 dark:text-white truncate">
                      {user.display_name}
                    </span>
                    {user.rank && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: user.rank.bg_color,
                          color: user.rank.color,
                        }}
                      >
                        {user.rank.name}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    @{user.username}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && users.length === 0 && query.length > 0 && (
        <div className="p-3 text-center text-sm text-slate-500">
          No users found
        </div>
      )}
    </div>
  );

  // Render as portal to document.body to avoid overflow clipping
  return createPortal(dropdown, document.body);
}
