"use client";

import { useEffect, useState, useCallback } from "react";
import { getAnnouncements, createAnnouncement, deleteAnnouncement } from "@/lib/api/admin";

const MAX_LENGTH = 500;

export default function AnnouncementsPage() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [confirmSend, setConfirmSend] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const fetchAnnouncements = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const data = await getAnnouncements(pageNum);
      setAnnouncements(data.announcements || []);
      setPagination(data.pagination || null);
      setPage(pageNum);
    } catch (err) {
      console.error("Failed to fetch announcements:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleSend = async () => {
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      await createAnnouncement(message.trim());
      setMessage("");
      setConfirmSend(false);
      fetchAnnouncements(1);
    } catch (err) {
      console.error("Failed to send announcement:", err);
      alert("Failed to send announcement: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this announcement? Users who haven't read it yet will no longer see it.")) {
      return;
    }

    try {
      await deleteAnnouncement(id);
      fetchAnnouncements(page);
    } catch (err) {
      console.error("Failed to delete announcement:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Compose Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Send Announcement
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          This will appear as a notification for all registered users.
        </p>
        <div className="space-y-3">
          <div className="relative">
            <textarea
              value={message}
              onChange={(e) => {
                if (e.target.value.length <= MAX_LENGTH) {
                  setMessage(e.target.value);
                  setConfirmSend(false);
                }
              }}
              placeholder="Type your announcement..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              maxLength={MAX_LENGTH}
            />
            <span className={`absolute bottom-2 right-3 text-xs ${message.length > MAX_LENGTH * 0.9 ? "text-red-500" : "text-gray-400"}`}>
              {message.length}/{MAX_LENGTH}
            </span>
          </div>

          {!confirmSend ? (
            <button
              onClick={() => setConfirmSend(true)}
              disabled={!message.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Send Announcement
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleSend}
                disabled={sending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm disabled:opacity-50"
              >
                {sending ? "Sending..." : "Confirm Send to All Users"}
              </button>
              <button
                onClick={() => setConfirmSend(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* History Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Announcement History
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-primary-500 rounded-full" />
          </div>
        ) : announcements.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm py-8 text-center">
            No announcements sent yet.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                    <th className="py-3 px-4 font-medium text-gray-500 dark:text-gray-400">Message</th>
                    <th className="py-3 px-4 font-medium text-gray-500 dark:text-gray-400 w-32">Sent By</th>
                    <th className="py-3 px-4 font-medium text-gray-500 dark:text-gray-400 w-40">Date</th>
                    <th className="py-3 px-4 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.map((ann) => (
                    <tr key={ann.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-200 whitespace-pre-line">
                        {ann.message.length > 100
                          ? ann.message.substring(0, 100) + "..."
                          : ann.message}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {ann.author_name || "Unknown"}
                      </td>
                      <td className="py-3 px-4 text-gray-500 dark:text-gray-400">
                        {new Date(ann.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleDelete(ann.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Page {pagination.current_page} of {pagination.total_pages} ({pagination.total} total)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchAnnouncements(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchAnnouncements(page + 1)}
                    disabled={page >= pagination.total_pages}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
