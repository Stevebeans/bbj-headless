"use client";

import Link from "next/link";
import { FaEdit } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";

/**
 * Edit button for player profile pages - only shows for admins
 */
export function PlayerEditButton({ slug }) {
  const { isAdmin } = useAuth();

  if (!isAdmin) return null;

  return (
    <Link
      href={`/bigbrother-players/${slug}/edit`}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
    >
      <FaEdit className="w-4 h-4" />
      Edit Player
    </Link>
  );
}
