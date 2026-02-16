"use client";

import Link from "next/link";

export default function AdminSeasons() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-osw font-bold text-slate-800 dark:text-white">
          Season Management
        </h2>
        <Link
          href="/bigbrother-seasons"
          className="text-sm text-primary-500 hover:text-primary-600 underline"
        >
          View Season Directory
        </Link>
      </div>
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-8 text-center">
        <p className="text-slate-500 dark:text-slate-400 mb-2">
          Season listing and management coming soon.
        </p>
        <p className="text-sm text-slate-400 dark:text-slate-500">
          Individual seasons can be edited from their profile page via the edit button.
        </p>
      </div>
    </div>
  );
}
