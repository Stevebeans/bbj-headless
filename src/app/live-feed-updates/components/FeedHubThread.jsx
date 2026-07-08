"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getFeedUpdates } from "@/lib/api/feedUpdates";
import { FeedHubUpdateCard } from "./FeedHubUpdateCard";
import { dateKey, dayLabel, shortDate } from "./feedHubName";
import { LiveIndicatorToggle } from "@/components/feed-updates/LiveIndicatorToggle";
import { useLiveFeedUpdates } from "@/hooks/useLiveFeedUpdates";
import { mergeUpdates } from "@/lib/feedUpdatesLive";

const PER_PAGE = 20;
const TABS = [
  { value: "", label: "All" },
  { value: "feed", label: "Feed" },
  { value: "show", label: "Show" },
];
const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "highest", label: "Highest rated" },
  { value: "lowest", label: "Lowest rated" },
];

export function FeedHubThread({ initial }) {
  // initial = hub.thread { updates, total, has_more }
  const [rows, setRows] = useState(initial?.updates || []);
  const [hasMore, setHasMore] = useState(initial?.has_more || false);
  const [mode, setMode] = useState("");
  const [sort, setSort] = useState("newest");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  // Live polling only makes sense at the default view — prepending into a
  // filtered/sorted/searched result set would corrupt it. Off the default
  // view, both the poll AND optimistic inserts are ignored; returning to
  // default re-fetches anyway (the filter effect fires).
  const isDefaultView = mode === "" && sort === "newest" && search === "";

  const { isPremium, live, setLive } = useLiveFeedUpdates({
    enabled: isDefaultView,
    onNewUpdates: (incoming) => {
      if (!isDefaultView) return;
      setRows((current) => mergeUpdates(current, incoming));
    },
  });

  // Re-fetch from server when a filter (mode/sort/search) changes.
  const fetchFiltered = useCallback(async (next) => {
    const id = ++reqId.current;
    setLoading(true);
    try {
      const data = await getFeedUpdates({
        perPage: PER_PAGE, offset: 0,
        sort: next.sort, mode: next.mode || undefined, search: next.search || undefined,
      });
      if (id !== reqId.current) return; // stale response guard
      setRows(data.updates || []);
      setHasMore(!!data.has_more);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, []);

  // Skip the first render (server already provided initial rows).
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    fetchFiltered({ mode, sort, search });
  }, [mode, sort, search, fetchFiltered]);

  const loadMore = async () => {
    setLoading(true);
    try {
      const data = await getFeedUpdates({
        perPage: PER_PAGE, offset: rows.length,
        sort, mode: mode || undefined, search: search || undefined,
      });
      setRows((prev) => [...prev, ...(data.updates || [])]);
      setHasMore(!!data.has_more);
    } finally {
      setLoading(false);
    }
  };

  // Group rows by date key, preserving order. Same-day rows may be
  // non-consecutive (highest/lowest sorts), so look up the group by key.
  const groups = [];
  const groupByKey = new Map();
  for (const row of rows) {
    const key = dateKey(row.date);
    let group = groupByKey.get(key);
    if (!group) {
      group = { key, iso: row.date, rows: [] };
      groupByKey.set(key, group);
      groups.push(group);
    }
    group.rows.push(row);
  }

  return (
    <>
      <LiveIndicatorToggle isPremium={isPremium} live={live} onToggle={setLive} />
      <div className="fuh-toolbar">
        <div className="fuh-tabs" role="tablist">
          {TABS.map((t) => (
            <a key={t.value} className={mode === t.value ? "on" : ""} href="#"
               onClick={(e) => { e.preventDefault(); setMode(t.value); }}>
              {t.label}
            </a>
          ))}
        </div>
        <div className="fuh-drop"><span>Sort</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div className="fuh-right">
          <form className="fuh-search" onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input type="search" placeholder="Search updates…" value={searchInput}
                   onChange={(e) => setSearchInput(e.target.value)} autoComplete="off" />
          </form>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="fuh-empty">
          {search ? `No updates match "${search}".` : "No updates yet."}
        </p>
      ) : (
        groups.map((g) => (
          <div key={g.key}>
            <div className="fuh-daybar">
              <span className="fuh-tag">{dayLabel(g.iso)}</span>
              <span className="fuh-date">{shortDate(g.iso)}</span>
              <span className="fuh-line" />
              <span className="fuh-count"><b>{g.rows.length}</b> updates</span>
            </div>
            <div className="fuh-thread">
              {g.rows.map((row) => <FeedHubUpdateCard key={row.id} update={row} />)}
            </div>
          </div>
        ))
      )}

      {hasMore && (
        <div className="fuh-loadmore">
          <a href="#" onClick={(e) => { e.preventDefault(); if (!loading) loadMore(); }}>
            {loading ? "Loading…" : "Load older updates ↓"}
          </a>
        </div>
      )}
    </>
  );
}
