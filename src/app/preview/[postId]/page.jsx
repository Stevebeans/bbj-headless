"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getPost } from "@/lib/api/editor";

export default function PreviewPage() {
  const { postId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/");
      return;
    }
    if (user && postId) {
      loadPost();
    }
  }, [user, authLoading, postId]);

  async function loadPost() {
    try {
      const data = await getPost(parseInt(postId));
      setPost(data);
    } catch (err) {
      console.error("Failed to load preview:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Post not found</p>
      </div>
    );
  }

  return (
    <div>
      {/* Preview banner */}
      <div className="bg-yellow-400 text-yellow-900 text-center py-2 text-sm font-bold sticky top-0 z-50">
        {"⚠️"} PREVIEW MODE — This post is not live
        <button
          onClick={() => router.push(`/editor/${postId}`)}
          className="ml-4 underline hover:no-underline"
        >
          Back to Editor
        </button>
      </div>

      {/* Render post using same styles as live posts */}
      <article className="max-w-4xl mx-auto px-4 py-8">
        {post.featured_image_url && (
          <div className="mb-6 rounded-lg overflow-hidden">
            <img src={post.featured_image_url} alt={post.title} className="w-full" />
          </div>
        )}
        <h1 className="text-3xl md:text-4xl font-bold font-display mb-4">{post.title}</h1>
        <div className="text-sm text-gray-500 mb-8">
          Draft {"\u2022"} {new Date(post.modified + "Z").toLocaleDateString("en-US", {
            year: "numeric", month: "long", day: "numeric"
          })}
        </div>
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
}
