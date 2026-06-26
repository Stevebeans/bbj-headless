"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { listAdminSeasons, trashSeason, restoreSeason } from "@/lib/api/adminContent";
import NewSeasonModal from "./components/NewSeasonModal";

export default function AdminSeasons() {
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showTrashed, setShowTrashed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchSeasons = useCallback(async (searchTerm = search, trashed = showTrashed) => {
    setLoading(true);
    try {
      const data = await listAdminSeasons({ search: searchTerm, status: trashed ? "trash" : "publish" });
      setSeasons(data.seasons || []);
    } catch (err) {
      console.error("Failed to fetch seasons:", err);
    } finally {
      setLoading(false);
    }
  }, [search, showTrashed]);

  useEffect(() => {
    fetchSeasons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTrashed]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSeasons(search);
  };

  const handleTrash = async (id) => {
    if (!confirm("Move this season to trash? It'll be hidden from the site but can be restored.")) return;
    try {
      await trashSeason(id);
      fetchSeasons();
    } catch (err) {
      console.error("Failed to trash season:", err);
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreSeason(id);
      fetchSeasons();
    } catch (err) {
      console.error("Failed to restore season:", err);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white">Season Management</h2>
        <button onClick={() => setShowModal(true)} className="btn-primary text-sm">+ New Season</button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[200px]">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search seasons..."
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
        </form>
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input type="checkbox" checked={showTrashed} onChange={(e) => setShowTrashed(e.target.checked)} className="rounded" />
          Show trashed
        </label>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full" />
        </div>
      ) : seasons.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400 text-sm py-8 text-center">No seasons found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                <th className="py-3 px-3 font-medium text-gray-500 dark:text-gray-400">Season</th>
                <th className="py-3 px-3 font-medium text-gray-500 dark:text-gray-400 w-20">#</th>
                <th className="py-3 px-3 font-medium text-gray-500 dark:text-gray-400 w-20">Abbr</th>
                <th className="py-3 px-3 font-medium text-gray-500 dark:text-gray-400 w-48">Dates</th>
                <th className="py-3 px-3 font-medium text-gray-500 dark:text-gray-400 w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((s) => (
                <tr key={s.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-2 px-3 text-gray-900 dark:text-gray-200 font-medium">{s.full_name}</td>
                  <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{s.season_number}</td>
                  <td className="py-2 px-3 text-gray-500 dark:text-gray-400">{s.abbreviation}</td>
                  <td className="py-2 px-3 text-gray-500 dark:text-gray-400">
                    {s.start_date || "—"}{s.end_date ? ` → ${s.end_date}` : ""}
                  </td>
                  <td className="py-2 px-3 text-right space-x-3 whitespace-nowrap">
                    <Link href={`/bigbrother-seasons/${s.slug}/edit`} className="text-primary-500 hover:text-primary-600 text-xs font-medium">Edit</Link>
                    {showTrashed ? (
                      <button onClick={() => handleRestore(s.id)} className="text-green-600 hover:text-green-700 text-xs font-medium">Restore</button>
                    ) : (
                      <button onClick={() => handleTrash(s.id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Trash</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <NewSeasonModal onClose={() => setShowModal(false)} onCreated={() => fetchSeasons()} />
      )}
    </div>
  );
}
