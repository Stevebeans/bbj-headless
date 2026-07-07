"use client";

import { useState } from "react";
import Link from "next/link";
import { createSeason } from "@/lib/api/adminContent";

export default function NewSeasonModal({ onClose, onCreated }) {
  const [fullName, setFullName] = useState("");
  const [seasonNumber, setSeasonNumber] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !seasonNumber.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await createSeason({
        full_name: fullName.trim(),
        season_number: seasonNumber.trim(),
        abbreviation: abbreviation.trim(),
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
      if (!res?.success) throw new Error(res?.message || "Failed to create season");
      setCreated({ name: fullName.trim(), slug: res.slug });
      onCreated?.(res);
    } catch (err) {
      setError(err.message || "Failed to create season");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-osw font-bold text-slate-800 dark:text-white">New Season</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {created ? (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg px-3 py-2 text-sm text-green-800 dark:text-green-300">
              Created <strong>{created.name}</strong>.
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/bigbrother-seasons/${created.slug}/edit`} className="btn-primary text-sm">Edit details →</Link>
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">Done</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full name (e.g. Big Brother 28)" autoFocus aria-label="Full name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            <div className="grid grid-cols-2 gap-3">
              <input value={seasonNumber} onChange={(e) => setSeasonNumber(e.target.value)} placeholder="Number (e.g. 28)" aria-label="Season number"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
              <input value={abbreviation} onChange={(e) => setAbbreviation(e.target.value)} placeholder="Abbr (e.g. BB28)" aria-label="Abbreviation"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs text-gray-500 dark:text-gray-400">Start date
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white" />
              </label>
              <label className="text-xs text-gray-500 dark:text-gray-400">End date
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white" />
              </label>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex items-center gap-2 pt-1">
              <button type="submit" disabled={saving || !fullName.trim() || !seasonNumber.trim()} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? "Creating..." : "Create Season"}
              </button>
              <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
