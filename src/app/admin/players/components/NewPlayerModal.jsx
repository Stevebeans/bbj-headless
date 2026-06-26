"use client";

import { useState } from "react";
import Link from "next/link";
import { createPlayer } from "@/lib/api/adminContent";

export default function NewPlayerModal({ seasons = [], onClose, onCreated }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [lastCreated, setLastCreated] = useState(null);

  const reset = () => {
    setFirstName("");
    setLastName("");
    setGender("");
    // keep seasonId so the next houseguest defaults to the same season
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await createPlayer({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        gender: gender || undefined,
        season_id: seasonId ? Number(seasonId) : undefined,
      });
      if (!res?.success) throw new Error(res?.message || "Failed to create player");
      setLastCreated({ name: `${firstName.trim()} ${lastName.trim()}`, slug: res.slug });
      reset();
      onCreated?.(res);
    } catch (err) {
      setError(err.message || "Failed to create player");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-osw font-bold text-slate-800 dark:text-white">New Player</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {lastCreated && (
          <div className="mb-4 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg px-3 py-2 text-sm flex items-center justify-between">
            <span className="text-green-800 dark:text-green-300">Created <strong>{lastCreated.name}</strong>.</span>
            <Link href={`/bigbrother-players/${lastCreated.slug}/edit`} className="text-green-700 dark:text-green-400 font-medium underline">
              Add details →
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Gender (optional)</option>
            <option value="M">Male</option>
            <option value="F">Female</option>
            <option value="NB">Non-binary</option>
          </select>

          <select
            value={seasonId}
            onChange={(e) => setSeasonId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">No season (add later)</option>
            {seasons.map((s) => (
              <option key={s.id} value={s.id}>{s.abbreviation || s.full_name}</option>
            ))}
          </select>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center gap-2 pt-1">
            <button type="submit" disabled={saving || !firstName.trim() || !lastName.trim()} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? "Creating..." : "Create & add another"}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
              Done
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
