"use client";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

export default function NewPostFAB() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();

  // Hide on editor pages, when not logged in, or no blog permission
  if (!user) return null;
  if (pathname?.startsWith("/editor")) return null;

  const hasBlogAccess = hasPermission("blog_writing") || hasPermission("blog_publishing") || hasPermission("blog_review");
  if (!hasBlogAccess) return null;

  return (
    <button
      onClick={() => router.push("/editor/new")}
      className="fixed bottom-4 right-4 w-14 h-14 bg-secondary-500 hover:bg-secondary-400 rounded-full shadow-lg flex items-center justify-center transition-all z-40"
      title="New Post"
    >
      <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </button>
  );
}
