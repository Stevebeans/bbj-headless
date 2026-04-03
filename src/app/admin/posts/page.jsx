"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getReviewQueue, reviewPost } from "@/lib/api/editor";
import DraftList from "@/components/editor/DraftList";

export default function AdminPostsPage() {
  const router = useRouter();
  const [reviewQueue, setReviewQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadQueue(); }, []);

  async function loadQueue() {
    try {
      const data = await getReviewQueue();
      setReviewQueue(data.posts || []);
    } catch (err) {
      console.error("Failed to load review queue:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(postId) {
    try {
      await reviewPost(postId, "approve");
      setReviewQueue((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Approve failed:", err);
    }
  }

  async function handleReject(postId) {
    const note = window.prompt("Rejection note (optional):");
    try {
      await reviewPost(postId, "reject", note || "");
      setReviewQueue((prev) => prev.filter((p) => p.id !== postId));
    } catch (err) {
      console.error("Reject failed:", err);
    }
  }

  return (
    <div className="space-y-8">
      {/* Review Queue */}
      {reviewQueue.length > 0 && (
        <div>
          <h2 className="text-lg font-bold font-display mb-3">
            Pending Review <span className="text-secondary-500">({reviewQueue.length})</span>
          </h2>
          <div className="space-y-2">
            {reviewQueue.map((post) => (
              <div key={post.id} className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{post.title || "Untitled"}</p>
                  <p className="text-xs text-gray-500">by {typeof post.author === "object" ? post.author.name : post.author} {"\u2022"} {new Date(post.modified + "Z").toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/editor/${post.id}`)}
                    className="px-3 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleApprove(post.id)}
                    className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(post.id)}
                    className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Posts */}
      <div>
        <h2 className="text-lg font-bold font-display mb-3">All Posts</h2>
        <DraftList isAdmin={true} />
      </div>
    </div>
  );
}
