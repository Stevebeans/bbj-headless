"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { PencilSquareIcon } from "@heroicons/react/24/outline";

/**
 * Floating "Edit" link shown opposite the post title — only for users with
 * blog permissions (same gate as /editor/new). Renders nothing for everyone else.
 */
export function PostEditButton({ postId }) {
  const { isAuthenticated } = useAuth();
  const { hasPermission, loading } = usePermissions();

  if (!isAuthenticated || loading) return null;

  const canEdit =
    hasPermission("blog_writing") ||
    hasPermission("blog_publishing") ||
    hasPermission("blog_review");
  if (!canEdit) return null;

  return (
    <Link
      href={`/editor/${postId}`}
      className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium
        text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900
        border border-slate-200 dark:border-slate-700 rounded-lg
        hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
    >
      <PencilSquareIcon className="w-4 h-4" />
      Edit
    </Link>
  );
}
