"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  getMessages,
  sendMessage,
  markThreadRead,
  blockUser,
  reportThread,
} from "@/lib/api/dm";
import Avatar from "./Avatar";

// Server timestamps are UTC 'Y-m-d H:i:s' (no zone marker); optimistic rows use
// a real ISO string. Normalize both before parsing so times render in the
// viewer's local zone.
function fmtTime(s) {
  if (!s) return "";
  const iso = s.includes("T") ? s : s.replace(" ", "T") + "Z";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleString();
}

export default function ThreadView({
  thread,
  me,
  onBack,
  onThreadRead,
  onThreadEstablished,
  onActivity,
  onBlocked,
  showToast,
}) {
  const other = thread.other;
  const [threadId, setThreadId] = useState(thread.id || null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(!!thread.id);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [working, setWorking] = useState(false); // block/report in flight
  const [hasMore, setHasMore] = useState(false); // older history beyond the first page
  const [loadingMore, setLoadingMore] = useState(false);

  const PAGE = 50; // server default page size for getMessages

  const scrollRef = useRef(null);
  const menuRef = useRef(null);
  const loadedOnceRef = useRef(false);
  const skipScrollRef = useRef(false); // suppress pin-to-bottom when prepending history
  const threadIdRef = useRef(threadId);
  threadIdRef.current = threadId;

  const scrollToBottom = useCallback((smooth = false) => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Mark the thread read and let the inbox clear its unread dot.
  const markRead = useCallback(() => {
    const id = threadIdRef.current;
    if (!id) return;
    markThreadRead(id)
      .then(() => onThreadRead?.(id))
      .catch(() => {});
  }, [onThreadRead]);

  // Load + refresh the message list. Preserves any optimistic (tmp-) rows that
  // the server hasn't echoed back yet so a poll never eats an in-flight send.
  const loadMessages = useCallback(async (markOnNew = false) => {
    const id = threadIdRef.current;
    if (!id) return;
    try {
      const res = await getMessages(id);
      const rows = res.messages || [];
      if (!loadedOnceRef.current) {
        loadedOnceRef.current = true;
        setHasMore(rows.length === PAGE);
      }
      let sawNewInbound = false;
      setMessages((prev) => {
        const pendingTmp = prev.filter(
          (m) => String(m.id).startsWith("tmp-") &&
            !rows.some((r) => r.body === m.body && r.sender_id === m.sender_id)
        );
        const prevRealIds = new Set(prev.filter((m) => !String(m.id).startsWith("tmp-")).map((m) => m.id));
        sawNewInbound = rows.some((r) => !prevRealIds.has(r.id) && r.sender_id !== me);
        // Polls fetch only the latest page; keep any older history the member
        // paged in (ids below the fetched window) instead of dropping it.
        const oldestFetched = rows.length ? rows[0].id : null;
        const olderKept = oldestFetched
          ? prev.filter((m) => !String(m.id).startsWith("tmp-") && m.id < oldestFetched)
          : [];
        return [...olderKept, ...rows, ...pendingTmp];
      });
      if (markOnNew && sawNewInbound && document.visibilityState === "visible") {
        markRead();
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      setLoading(false);
    }
  }, [me, markRead]);

  // Initial load for an existing thread: fetch, then mark read.
  useEffect(() => {
    if (thread.id) {
      setLoading(true);
      loadMessages().then(markRead);
    } else {
      setLoading(false);
    }
    // Keyed remount per conversation (key=other.id in parent) resets this.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll getMessages every 10s, ONLY while the tab is visible (mirrors the
  // NotificationBell.jsx guard). Background/hidden tabs stop hitting the WP
  // origin; a refocus refreshes immediately then resumes the interval.
  useEffect(() => {
    if (!threadId) return;
    let interval = null;
    const INTERVAL_MS = 10000;

    const start = () => {
      if (interval) return;
      interval = setInterval(() => loadMessages(true), INTERVAL_MS);
    };
    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        loadMessages(true);
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
  }, [threadId, loadMessages]);

  // Load the page of history before the oldest visible message, keeping the
  // member's scroll position anchored on what they were reading.
  const loadOlder = async () => {
    const id = threadIdRef.current;
    const first = messages.find((m) => !String(m.id).startsWith("tmp-"));
    if (!id || !first || loadingMore) return;
    setLoadingMore(true);
    const el = scrollRef.current;
    const prevHeight = el ? el.scrollHeight : 0;
    try {
      const res = await getMessages(id, first.id);
      const older = res.messages || [];
      setHasMore(older.length === PAGE);
      if (older.length) {
        skipScrollRef.current = true;
        setMessages((prev) => [...older, ...prev]);
        requestAnimationFrame(() => {
          if (el) el.scrollTop += el.scrollHeight - prevHeight;
        });
      }
    } catch {
      showToast?.("Could not load earlier messages.", "error");
    } finally {
      setLoadingMore(false);
    }
  };

  // Keep the view pinned to the newest message (except history prepends).
  useEffect(() => {
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Close the header menu on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const handleSend = async () => {
    const body = input.trim();
    if (!body || sending) return;

    const tmpId = "tmp-" + Date.now();
    const optimistic = {
      id: tmpId,
      thread_id: threadIdRef.current,
      sender_id: me,
      body,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setSending(true);

    try {
      const res = await sendMessage(other.id, body);
      const wasNew = !threadIdRef.current;
      if (res.thread_id && res.thread_id !== threadIdRef.current) {
        setThreadId(res.thread_id);
      }
      // Swap the optimistic row for the server row.
      setMessages((prev) =>
        prev.map((m) => (m.id === tmpId ? res.message : m))
      );
      // Refresh the inbox once. A brand-new thread routes through
      // onThreadEstablished (which also refetches); existing threads just bump.
      if (wasNew) onThreadEstablished?.(res.thread_id);
      else onActivity?.();
    } catch (err) {
      // Roll back the optimistic row and surface the server's human copy.
      setMessages((prev) => prev.filter((m) => m.id !== tmpId));
      setInput(body);
      showToast?.(err.message || "Could not send message", "error");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleBlock = async () => {
    setMenuOpen(false);
    if (!confirm(`Block ${other.name}? You will no longer see messages from each other.`)) {
      return;
    }
    setWorking(true);
    try {
      await blockUser(other.id);
      showToast?.(`${other.name} blocked`);
      onBlocked?.();
    } catch (err) {
      showToast?.(err.message || "Could not block", "error");
    } finally {
      setWorking(false);
    }
  };

  const handleReport = async () => {
    setMenuOpen(false);
    if (!threadIdRef.current) {
      showToast?.("Send a message first, then you can report.", "error");
      return;
    }
    const note = prompt("Add a note for Steve (optional):", "");
    if (note === null) return; // cancelled
    setWorking(true);
    try {
      await reportThread(threadIdRef.current, null, note);
      showToast?.("Reported. Steve will take a look.");
    } catch (err) {
      showToast?.(err.message || "Could not report", "error");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-3 sm:px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
        <button
          onClick={onBack}
          className="lg:hidden p-1 -ml-1 text-gray-500 hover:text-gray-700 dark:text-gray-400"
          aria-label="Back to inbox"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <Avatar src={other.avatar} name={other.name} size={40} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-gray-900 dark:text-white truncate">{other.name}</p>
          {other.username && (
            <p className="text-xs text-gray-400 truncate">@{other.username}</p>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            disabled={working}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 disabled:opacity-50"
            aria-label="Conversation options"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 z-20 overflow-hidden">
              <button
                onClick={handleReport}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Report conversation
              </button>
              <button
                onClick={handleBlock}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Block {other.name}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages. The inner wrapper bottom-anchors short conversations
          (justify-end) so the newest message always sits directly above the
          composer instead of stranding it at the top of a tall empty pane. */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-4 py-4">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center px-4">
            <p className="text-sm text-gray-400">
              No messages yet. Say hello to {other.name}.
            </p>
          </div>
        ) : (
          <div className="min-h-full flex flex-col justify-end space-y-2">
          {hasMore && (
            <div className="flex justify-center pb-1">
              <button
                onClick={loadOlder}
                disabled={loadingMore}
                className="px-3 py-1 text-xs rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load earlier messages"}
              </button>
            </div>
          )}
          {messages.map((m) => {
            const mine = m.sender_id === me;
            const pending = String(m.id).startsWith("tmp-");
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] sm:max-w-[70%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                  <div
                    className={`px-3.5 py-2 rounded-2xl whitespace-pre-wrap break-words text-sm ${
                      mine
                        ? "bg-primary-500 text-white rounded-br-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 rounded-bl-sm"
                    } ${pending ? "opacity-70" : ""}`}
                  >
                    {m.body}
                  </div>
                  <span className="mt-0.5 px-1 text-[11px] text-gray-400">
                    {pending ? "Sending..." : fmtTime(m.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={`Message ${other.name}...`}
            className="flex-1 resize-none max-h-32 px-3.5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-2xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:outline-none text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="shrink-0 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
