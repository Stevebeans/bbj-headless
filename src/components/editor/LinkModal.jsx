"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { toRelativeHref } from "@/lib/utils/url";

const API_URL =
  process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";
const DEBOUNCE_MS = 250;

// True for "http(s)://…" or a bare domain like "cbs.com/x" — treated as an external link.
function looksLikeUrl(s) {
  const t = s.trim();
  return /^https?:\/\//i.test(t) || /^[\w-]+(\.[\w-]+)+(\/|$)/.test(t);
}

// Normalize a search/post result down to { title, href }. Drops anything unlinkable.
function normalize(item) {
  if (!item) return null;
  const rawTitle = typeof item.title === "string" ? item.title : item.title?.rendered;
  const title = rawTitle || item.name || item.full_name || "";
  const href =
    item.permalink || item.url || (item.slug ? `/${item.slug}` : "");
  if (!href) return null;
  return { title: title || href, href };
}

export default function LinkModal({ editor, onClose }) {
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState([]);
  const [results, setResults] = useState(null); // null → show the recent list
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // Load the 10 most recent posts once (the default list). Direct fetch — the
  // server-side getPosts() helper doesn't work from this client modal.
  useEffect(() => {
    let alive = true;
    fetch(`${API_URL}/bbjd/v1/posts?per_page=10`)
      .then((r) => r.json())
      .then((d) => {
        if (alive) setRecent((d.posts || []).map(normalize).filter(Boolean));
      })
      .catch(() => {});
    inputRef.current?.focus();
    return () => {
      alive = false;
    };
  }, []);

  const isUrl = looksLikeUrl(query);

  // Debounced site-wide search (any post/page) — skipped while the input is a URL.
  useEffect(() => {
    const t = query.trim();
    if (isUrl || t.length < 2) {
      setResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
        const res = await fetch(
          `${API_URL}/bbjd/v1/search?query=${encodeURIComponent(t)}`,
          { signal: abortRef.current.signal }
        );
        const data = await res.json();
        const flat = [
          ...(data.general || []),
          ...(data.players || []),
          ...(data.seasons || []),
          ...(data.feed_updates || []),
        ]
          .map(normalize)
          .filter(Boolean);
        setResults(flat);
      } catch (e) {
        if (e.name !== "AbortError") setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, isUrl]);

  const applyLink = useCallback(
    (href, text, external) => {
      if (!editor) return;
      const attrs = external
        ? { href, target: "_blank", rel: "noopener noreferrer" }
        : { href };
      const { from, to } = editor.state.selection;
      if (from !== to) {
        // Text selected → wrap it in the link.
        editor.chain().focus().extendMarkRange("link").setLink(attrs).run();
      } else {
        // Nothing selected → insert the title (or URL) as the linked text.
        editor
          .chain()
          .focus()
          .insertContent({ type: "text", text: text || href, marks: [{ type: "link", attrs }] })
          .run();
      }
      onClose?.();
    },
    [editor, onClose]
  );

  const chooseInternal = (item) => applyLink(toRelativeHref(item.href), item.title, false);

  const chooseExternal = () => {
    let url = query.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    applyLink(url, null, true);
  };

  const list = results !== null ? results : recent;

  // Portal to <body> (like CropModal): rendered in place, an ancestor's
  // stacking context trapped this under the fixed editor toolbar (z-45),
  // clipping the top of the modal.
  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts & pages, or paste a URL…"
            aria-label="Search posts and pages or paste a URL"
            className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="max-h-72 overflow-y-auto">
          {isUrl ? (
            <button
              onClick={chooseExternal}
              className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2"
            >
              <span className="text-primary-500">🔗</span>
              <span className="truncate">
                Link to <span className="font-medium">{query.trim()}</span>{" "}
                <span className="text-slate-400">(opens in new tab)</span>
              </span>
            </button>
          ) : (
            <>
              {results === null && (
                <p className="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Recent posts
                </p>
              )}
              {loading && <p className="px-4 py-3 text-sm text-slate-400">Searching…</p>}
              {!loading && list.length === 0 && (
                <p className="px-4 py-3 text-sm text-slate-400">
                  No matches. Paste a full URL to link out.
                </p>
              )}
              {list.map((item, i) => (
                <button
                  key={`${item.href}-${i}`}
                  onClick={() => chooseInternal(item)}
                  className="w-full text-left px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <span className="block text-sm text-slate-800 dark:text-slate-200 truncate">
                    {item.title}
                  </span>
                  <span className="block text-xs text-slate-400 truncate">
                    {toRelativeHref(item.href)}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>

        <div className="p-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
