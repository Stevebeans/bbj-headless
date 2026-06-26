"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { listAdminPlayers, listAdminSeasons, trashPlayer, restorePlayer } from "@/lib/api/adminContent";
import NewPlayerModal from "./components/NewPlayerModal";

export default function AdminPlayers() {
  const [players, setPlayers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [seasonFilter, setSeasonFilter] = useState(0);
  const [showTrashed, setShowTrashed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchPlayers = useCallback(async (pageNum = 1, searchTerm = search, season = seasonFilter, trashed = showTrashed) => {
    setLoading(true);
    try {
      const data = await listAdminPlayers({
        page: pageNum,
        perPage: 25,
        search: searchTerm,
        season,
        status: trashed ? "trash" : "publish",
      });
      setPlayers(data.players || []);
      setPagination(data.pagination || null);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to fetch players:", err);
    } finally {
      setLoading(false);
    }
  }, [search, seasonFilter, showTrashed]);

  useEffect(() => {
    listAdminSeasons().then((d) => setSeasons(d.seasons || [])).catch(() => {});
  }, []);

  useEffect(() => {
    fetchPlayers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seasonFilter, showTrashed]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPlayers(1, search);
  };

  const handleTrash = async (id) => {
    if (!confirm("Move this player to trash? They'll be hidden from the site but can be restored.")) return;
    try {
      await trashPlayer(id);
      fetchPlayers(page);
    } catch (err) {
      console.error("Failed to trash player:", err);
    }
  };

  const handleRestore = async (id) => {
    try {
      await restorePlayer(id);
      fetchPlayers(page);
    } catch (err) {
      console.error("Failed to restore player:", err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white">Player Management</h2>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm">+ New Player</button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search players by name..."
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </form>
        <select
          value={seasonFilter}
          onChange={(e) => setSeasonFilter(Number(e.target.value))}
          className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
        >
          <option value={0}>All seasons</option>
          {seasons.map((s) => (
            <option key={s.id} value={s.id}>{s.abbreviation || s.full_name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input type="checkbox" checked={showTrashed} onChange={(e) => setShowTrashed(e.target.checked)} className="rounded" />
          Show trashed
        </label>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full" />
        </div>
      ) : players.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm py-8 text-center">No players found.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                  <th className="py-3 px-3 font-medium text-gray-500 dark:text-gray-400 w-12"></th>
                  <th className="py-3 px-3 font-medium text-gray-500 dark:text-gray-400">Name</th>
                  <th className="py-3 px-3 font-medium text-gray-500 dark:text-gray-400">Seasons</th>
                  <th className="py-3 px-3 font-medium text-gray-500 dark:text-gray-400 w-32 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="py-2 px-3">
                      {p.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" />
                      )}
                    </td>
                    <td className="py-2 px-3 text-gray-900 dark:text-gray-200 font-medium">{p.name}</td>
                    <td className="py-2 px-3 text-gray-500 dark:text-gray-400">
                      {p.seasons.map((s) => s.abbreviation).join(", ") || "—"}
                    </td>
                    <td className="py-2 px-3 text-right space-x-3 whitespace-nowrap">
                      <Link href={`/bigbrother-players/${p.slug}/edit`} className="text-primary-500 hover:text-primary-600 text-xs font-medium">Edit</Link>
                      {showTrashed ? (
                        <button onClick={() => handleRestore(p.id)} className="text-green-600 hover:text-green-700 text-xs font-medium">Restore</button>
                      ) : (
                        <button onClick={() => handleTrash(p.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Trash</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Page {pagination.current_page} of {pagination.total_pages} ({pagination.total} total)
              </span>
              <div className="flex gap-2">
                <button onClick={() => fetchPlayers(page - 1)} disabled={page <= 1} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800">Previous</button>
                <button onClick={() => fetchPlayers(page + 1)} disabled={page >= pagination.total_pages} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <NewPlayerModal
          seasons={seasons}
          onClose={() => setShowModal(false)}
          onCreated={() => fetchPlayers(page)}
        />
      )}
    </div>
  );
}
