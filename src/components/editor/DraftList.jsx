"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { listDrafts, deletePost } from "@/lib/api/editor";

const STATUS_LABELS = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600" },
  pending_review: { label: "Pending Review", color: "bg-yellow-100 text-yellow-700" },
  pending: { label: "Pending Review", color: "bg-yellow-100 text-yellow-700" },
  publish: { label: "Published", color: "bg-green-100 text-green-700" },
};

export default function DraftList({ isAdmin = false }) {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("any");

  useEffect(() => {
    loadPosts();
  }, [filter]);

  async function loadPosts() {
    setLoading(true);
    try {
      const data = await listDrafts({ status: filter });
      setPosts(data.posts || []);
    } catch (err) {
      console.error("Failed to load posts:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(postId) {
    if (!confirm("Move this draft to trash?")) return;
    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {["any", "draft", "pending_review", "publish"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1 text-sm rounded transition ${
              filter === s ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {s === "any" ? "All" : STATUS_LABELS[s]?.label || s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No posts yet</p>
          <p className="text-sm">Click &quot;New Post&quot; to get started</p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => {
            const statusInfo = STATUS_LABELS[post.status] || STATUS_LABELS.draft;
            return (
              <div
                key={post.id}
                onClick={() => router.push(`/editor/${post.id}`)}
                className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-primary-400 cursor-pointer transition"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                  {post.featured_image_thumb ? (
                    <img src={post.featured_image_thumb} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg">{"📝"}</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{post.title || "Untitled Draft"}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    {isAdmin && <span className="text-xs text-gray-400">by {post.author}</span>}
                    <span className="text-xs text-gray-400">
                      {new Date(post.modified + "Z").toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {post.status === "draft" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }}
                    className="text-gray-300 hover:text-red-500 text-sm transition"
                    title="Delete"
                  >
                    {"🗑"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
