"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import DraftList from "@/components/editor/DraftList";

export default function EditorIndexPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, loading: permLoading } = usePermissions();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  if (authLoading || permLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  const hasBlogAccess = hasPermission("blog_writing") || hasPermission("blog_publishing") || hasPermission("blog_review");

  if (!hasBlogAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">You don&apos;t have permission to access the editor.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-display">My Posts</h1>
        <button
          onClick={() => router.push("/editor/new")}
          className="btn-primary px-4 py-2 text-sm"
        >
          + New Post
        </button>
      </div>
      <DraftList isAdmin={hasPermission("blog_review")} />
    </div>
  );
}
