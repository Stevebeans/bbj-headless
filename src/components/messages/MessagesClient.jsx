"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getThreads } from "@/lib/api/dm";
import { searchUsers } from "@/lib/api/comments";
import ThreadView from "./ThreadView";
import Avatar from "./Avatar";

// Server timestamps are UTC 'Y-m-d H:i:s' with no zone marker; optimistic rows
// carry a real ISO string. Normalize both before handing to the Date parser.
function fmtRelative(s) {
  if (!s) return "";
  const iso = s.includes("T") ? s : s.replace(" ", "T") + "Z";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  return d.toLocaleDateString();
}

export default function MessagesClient({ initialRecipient = null }) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const me = user?.id;

  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [activeThread, setActiveThread] = useState(null); // { id, other:{id,username,name,avatar} }
  const [toast, setToast] = useState(null);

  // New-conversation search
  const [composing, setComposing] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const toastTimer = useRef(null);
  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);
  useEffect(() => () => toastTimer.current && clearTimeout(toastTimer.current), []);

  // ---- Inbox load + poll ---------------------------------------------------
  const fetchThreads = useCallback(async () => {
    try {
      const res = await getThreads(1);
      setThreads(res.threads || []);
    } catch (err) {
      console.error("Failed to load threads:", err);
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchThreads();
  }, [isAuthenticated, fetchThreads]);

  // Re-fetch the inbox every 60s, visibility-gated to protect the WP origin.
  // Mirrors NotificationBell.jsx: only poll while the tab is actually visible,
  // stop when hidden, and refresh once on refocus so the list is fresh the
  // moment the user looks. Anonymous users never reach here (no token).
  useEffect(() => {
    if (!isAuthenticated) return;
    let interval = null;
    const INTERVAL_MS = 60000;

    const start = () => {
      if (interval) return;
      interval = setInterval(fetchThreads, INTERVAL_MS);
    };
    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchThreads();
        start();
      } else {
        stop();
      }
    };

    if (document.visibilityState === "visible") start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isAuthenticated, fetchThreads]);

  // ---- Optional deep-link into a fresh conversation (Task 8 feeds this) ----
  useEffect(() => {
    if (initialRecipient?.id && !activeThread) {
      setActiveThread({
        id: null,
        other: {
          id: initialRecipient.id,
          username: initialRecipient.username || "",
          name: initialRecipient.name || initialRecipient.username || "Member",
          avatar: initialRecipient.avatar || "",
        },
      });
    }
    // Only on first arrival of an initialRecipient.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRecipient]);

  // ---- New-conversation search (min 2 chars, 300ms debounce) ---------------
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await searchUsers(q, 8);
        setResults((res.users || []).filter((u) => u.id !== me));
      } catch (err) {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, me]);

  const openExisting = (thread) => {
    setComposing(false);
    setActiveThread({ id: thread.id, other: thread.other });
    // Optimistically clear the unread dot in the inbox.
    if (thread.unread) {
      setThreads((prev) =>
        prev.map((t) => (t.id === thread.id ? { ...t, unread: 0 } : t))
      );
    }
  };

  const pickSearchResult = (u) => {
    setActiveThread({
      id: null,
      other: {
        id: u.id,
        username: u.username || "",
        name: u.display_name || u.username || "Member",
        avatar: u.avatar || "",
      },
    });
    setComposing(false);
    setQuery("");
    setResults([]);
  };

  const handleThreadRead = useCallback((threadId) => {
    setThreads((prev) =>
      prev.map((t) => (t.id === threadId ? { ...t, unread: 0 } : t))
    );
  }, []);

  const handleThreadEstablished = useCallback(
    (threadId) => {
      setActiveThread((prev) => (prev ? { ...prev, id: threadId } : prev));
      fetchThreads();
    },
    [fetchThreads]
  );

  const handleBlocked = useCallback(() => {
    setActiveThread(null);
    fetchThreads();
  }, [fetchThreads]);

  // ---- Auth gate -----------------------------------------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-200 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-slate-200 dark:bg-gray-950 flex items-center justify-center px-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-display font-bold text-gray-900 dark:text-white">
            Messages
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Log in to read and send private messages.
          </p>
          <Link
            href="/login?redirect=/messages"
            className="mt-6 inline-block px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
          >
            Log In
          </Link>
        </div>
      </main>
    );
  }

  const hasActive = !!activeThread;

  return (
    <main className="min-h-screen bg-slate-200 dark:bg-gray-950 py-4 sm:py-8">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-white ${
            toast.type === "error" ? "bg-red-500" : "bg-green-500"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="max-w-screen-xl mx-auto px-0 sm:px-4">
        <div className="bg-white dark:bg-gray-900 sm:rounded-xl shadow-sm border-y sm:border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="flex lg:h-[calc(100vh-8rem)] h-[calc(100vh-5rem)]">
            {/* Inbox pane */}
            <aside
              className={`w-full lg:w-80 xl:w-96 shrink-0 border-r border-slate-200 dark:border-slate-800 flex-col ${
                hasActive ? "hidden lg:flex" : "flex"
              }`}
            >
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h1 className="text-lg font-display font-bold text-gray-900 dark:text-white">
                  Messages
                </h1>
                <button
                  onClick={() => {
                    setComposing((c) => !c);
                    setQuery("");
                    setResults([]);
                  }}
                  className="text-sm font-medium text-primary-500 hover:text-primary-600 dark:text-primary-400"
                >
                  {composing ? "Cancel" : "New Message"}
                </button>
              </div>

              {composing && (
                <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800">
                  <input
                    type="text"
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search members by name..."
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm"
                  />
                  <div className="mt-2 max-h-64 overflow-y-auto">
                    {searching && (
                      <p className="px-1 py-2 text-sm text-gray-400">Searching...</p>
                    )}
                    {!searching && query.trim().length >= 2 && results.length === 0 && (
                      <p className="px-1 py-2 text-sm text-gray-400">No members found</p>
                    )}
                    {results.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => pickSearchResult(u)}
                        className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors"
                      >
                        <Avatar src={u.avatar} name={u.display_name || u.username} size={36} />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-white truncate">
                            {u.display_name || u.username}
                          </p>
                          {u.username && (
                            <p className="text-xs text-gray-400 truncate">@{u.username}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Thread list */}
              <div className="flex-1 overflow-y-auto">
                {loadingThreads ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full" />
                  </div>
                ) : threads.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    <p>No conversations yet.</p>
                    <p className="mt-1 text-gray-400 dark:text-gray-500">
                      Use New Message to start one.
                    </p>
                  </div>
                ) : (
                  threads.map((t) => {
                    const isActive = activeThread?.id === t.id;
                    const unread = !!t.unread;
                    return (
                      <button
                        key={t.id}
                        onClick={() => openExisting(t)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left border-b border-slate-100 dark:border-slate-800/60 transition-colors ${
                          isActive
                            ? "bg-primary-50 dark:bg-primary-900/20"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <Avatar src={t.other?.avatar} name={t.other?.name} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`truncate ${
                                unread
                                  ? "font-bold text-gray-900 dark:text-white"
                                  : "font-medium text-gray-800 dark:text-gray-200"
                              }`}
                            >
                              {t.other?.name || "Member"}
                            </span>
                            <span className="text-xs text-gray-400 shrink-0">
                              {fmtRelative(t.last_message_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-sm truncate flex-1 ${
                                unread
                                  ? "text-gray-700 dark:text-gray-200 font-medium"
                                  : "text-gray-500 dark:text-gray-400"
                              }`}
                            >
                              {t.last_message || "No messages yet"}
                            </p>
                            {unread && (
                              <span className="w-2.5 h-2.5 rounded-full bg-primary-500 shrink-0" />
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Conversation pane */}
            <section
              className={`flex-1 min-w-0 flex-col ${hasActive ? "flex" : "hidden lg:flex"}`}
            >
              {activeThread ? (
                <ThreadView
                  key={activeThread.other.id}
                  thread={activeThread}
                  me={me}
                  onBack={() => setActiveThread(null)}
                  onThreadRead={handleThreadRead}
                  onThreadEstablished={handleThreadEstablished}
                  onActivity={fetchThreads}
                  onBlocked={handleBlocked}
                  showToast={showToast}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-center px-6">
                  <div>
                    <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                      <svg
                        className="w-7 h-7 text-slate-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.83L3 20l1.3-3.9A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400">
                      Select a conversation to start reading.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
