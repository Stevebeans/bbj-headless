"use client";

import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import EditorPage from "@/components/editor/EditorPage";

export default function EditPostPage() {
  const { user, loading } = useAuth();
  const { hasPermission, loading: permLoading } = usePermissions();
  const router = useRouter();
  const { postId } = useParams();

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  if (loading || permLoading || !user) return null;

  const hasBlogAccess = hasPermission("blog_writing") || hasPermission("blog_publishing") || hasPermission("blog_review");
  if (!hasBlogAccess) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">You don&apos;t have permission to edit posts.</p>
      </div>
    );
  }

  return <EditorPage postId={parseInt(postId)} />;
}
