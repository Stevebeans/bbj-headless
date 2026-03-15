"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect } from "react";
import EditorPage from "@/components/editor/EditorPage";

export default function EditPostPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { postId } = useParams();

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [user, loading, router]);

  if (loading || !user) return null;

  return <EditorPage postId={parseInt(postId)} />;
}
