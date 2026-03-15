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
      className="fixed bottom-6 right-6 w-14 h-14 bg-secondary-500 rounded-full shadow-lg flex items-center justify-center text-primary-600 text-2xl hover:bg-secondary-400 transition z-40 md:hidden"
      title="New Post"
    >
      {"✏️"}
    </button>
  );
}
