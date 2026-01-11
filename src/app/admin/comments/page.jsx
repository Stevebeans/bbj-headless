"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getReports,
  actionReport,
  bulkActionReports,
  getCommentsForModeration,
  moderateComment,
  getBlacklist,
  addToBlacklist,
  removeFromBlacklist,
} from "@/lib/api/admin";

export default function CommentModeration() {
  const [activeTab, setActiveTab] = useState("reports");
  const [reports, setReports] = useState([]);
  const [comments, setComments] = useState([]);
  const [blacklist, setBlacklist] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, current_page: 1, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedReports, setSelectedReports] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filter, setFilter] = useState("pending"); // For reports: pending, reviewed, all
  const [commentFilter, setCommentFilter] = useState("reported"); // For comments: reported, pending, all

  const fetchReports = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await getReports(filter, page);
      setReports(data.reports);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchComments = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await getCommentsForModeration(commentFilter, page);
      setComments(data.comments);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [commentFilter]);

  const fetchBlacklist = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const data = await getBlacklist(page);
      setBlacklist(data.entries);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "reports") {
      fetchReports();
    } else if (activeTab === "comments") {
      fetchComments();
    } else if (activeTab === "blacklist") {
      fetchBlacklist();
    }
  }, [activeTab, fetchReports, fetchComments, fetchBlacklist]);

  const handleReportAction = async (reportId, action) => {
    setActionLoading(reportId);
    setError(null);
    try {
      await actionReport(reportId, action);
      setSuccess(`Report ${action} successfully`);
      setTimeout(() => setSuccess(null), 3000);
      fetchReports(pagination.current_page);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedReports.length === 0) return;
    if (!confirm(`Are you sure you want to ${action} ${selectedReports.length} reports?`)) return;

    setActionLoading("bulk");
    try {
      await bulkActionReports(selectedReports, action);
      setSuccess(`${selectedReports.length} reports processed`);
      setTimeout(() => setSuccess(null), 3000);
      setSelectedReports([]);
      fetchReports(pagination.current_page);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCommentModeration = async (commentId, action) => {
    setActionLoading(commentId);
    setError(null);
    try {
      await moderateComment(commentId, action);
      setSuccess(`Comment ${action} successfully`);
      setTimeout(() => setSuccess(null), 3000);
      fetchComments(pagination.current_page);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFromBlacklist = async (id) => {
    if (!confirm("Are you sure you want to remove this entry from the blacklist?")) return;

    setActionLoading(id);
    try {
      await removeFromBlacklist(id);
      setSuccess("Removed from blacklist");
      setTimeout(() => setSuccess(null), 3000);
      fetchBlacklist(pagination.current_page);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleReportSelection = (reportId) => {
    setSelectedReports((prev) =>
      prev.includes(reportId) ? prev.filter((id) => id !== reportId) : [...prev, reportId]
    );
  };

  const selectAllReports = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map((r) => r.id));
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-osw font-bold text-slate-800 dark:text-white">Comment Moderation</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">Manage reports, comments, and blacklist</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-green-600 dark:text-green-400">{success}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-600 mb-6">
        {[
          { id: "reports", label: "Reports" },
          { id: "comments", label: "Comments" },
          { id: "blacklist", label: "Blacklist" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.id
                ? "border-primary-500 text-primary-500"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reports Tab */}
      {activeTab === "reports" && (
        <div>
          {/* Filter */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-slate-600 dark:text-slate-400">Status:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
                <option value="dismissed">Dismissed</option>
                <option value="actioned">Actioned</option>
                <option value="all">All</option>
              </select>
            </div>

            {selectedReports.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">{selectedReports.length} selected</span>
                <button
                  onClick={() => handleBulkAction("dismiss")}
                  disabled={actionLoading === "bulk"}
                  className="px-3 py-1 bg-slate-200 dark:bg-slate-600 rounded text-sm hover:bg-slate-300 dark:hover:bg-slate-500"
                >
                  Dismiss All
                </button>
                <button
                  onClick={() => handleBulkAction("delete_comment")}
                  disabled={actionLoading === "bulk"}
                  className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                >
                  Delete All
                </button>
              </div>
            )}
          </div>

          {/* Reports List */}
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-700 rounded-lg">
              <p className="text-slate-500 dark:text-slate-400">No reports found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Select All */}
              <div className="flex items-center space-x-2 px-4">
                <input
                  type="checkbox"
                  checked={selectedReports.length === reports.length && reports.length > 0}
                  onChange={selectAllReports}
                  className="w-4 h-4 text-primary-500 rounded"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">Select all</span>
              </div>

              {reports.map((report) => (
                <div
                  key={report.id}
                  className="bg-white dark:bg-slate-700 rounded-lg shadow p-4"
                >
                  <div className="flex items-start space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedReports.includes(report.id)}
                      onChange={() => toggleReportSelection(report.id)}
                      className="w-4 h-4 text-primary-500 rounded mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">
                            {report.comment_author || "Unknown"}
                          </p>
                          <p className="text-sm text-slate-500">
                            on &quot;{report.post_title || "Unknown Post"}&quot;
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              report.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : report.status === "actioned"
                                ? "bg-green-100 text-green-800"
                                : "bg-slate-100 text-slate-800"
                            }`}
                          >
                            {report.status}
                          </span>
                          {report.total_reports > 1 && (
                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                              {report.total_reports} reports
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-600 rounded text-sm text-slate-600 dark:text-slate-300">
                        {report.comment_content?.substring(0, 200)}
                        {report.comment_content?.length > 200 && "..."}
                      </div>

                      <div className="mt-2 text-xs text-slate-500">
                        <span className="font-medium">Reason:</span> {report.reason}
                        {report.details && (
                          <span className="ml-2">
                            <span className="font-medium">Details:</span> {report.details}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        Reported by {report.reporter_name} on{" "}
                        {new Date(report.created_at).toLocaleDateString()}
                      </div>

                      {report.status === "pending" && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            onClick={() => handleReportAction(report.id, "dismiss")}
                            disabled={actionLoading === report.id}
                            className="px-3 py-1 bg-slate-200 dark:bg-slate-600 rounded text-sm hover:bg-slate-300 dark:hover:bg-slate-500 disabled:opacity-50"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => handleReportAction(report.id, "delete_comment")}
                            disabled={actionLoading === report.id}
                            className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
                          >
                            Delete Comment
                          </button>
                          <button
                            onClick={() => handleReportAction(report.id, "spam")}
                            disabled={actionLoading === report.id}
                            className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 disabled:opacity-50"
                          >
                            Mark Spam
                          </button>
                          <button
                            onClick={() => handleReportAction(report.id, "blacklist_user")}
                            disabled={actionLoading === report.id}
                            className="px-3 py-1 bg-red-700 text-white rounded text-sm hover:bg-red-800 disabled:opacity-50"
                          >
                            Blacklist User
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Comments Tab */}
      {activeTab === "comments" && (
        <div>
          {/* Filter */}
          <div className="flex items-center space-x-2 mb-4">
            <label className="text-sm text-slate-600 dark:text-slate-400">Filter:</label>
            <select
              value={commentFilter}
              onChange={(e) => setCommentFilter(e.target.value)}
              className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-sm"
            >
              <option value="reported">Reported</option>
              <option value="pending">Pending Approval</option>
              <option value="all">All Comments</option>
            </select>
          </div>

          {/* Comments List */}
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-700 rounded-lg">
              <p className="text-slate-500 dark:text-slate-400">No comments found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div
                  key={comment.comment_ID}
                  className="bg-white dark:bg-slate-700 rounded-lg shadow p-4"
                >
                  <div className="flex items-start space-x-4">
                    <img
                      src={comment.author_avatar}
                      alt=""
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">
                            {comment.comment_author}
                          </p>
                          <p className="text-sm text-slate-500">
                            on &quot;{comment.post_title || "Unknown Post"}&quot;
                          </p>
                        </div>
                        {comment.report_count > 0 && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                            {comment.report_count} reports
                          </span>
                        )}
                      </div>

                      <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-600 rounded text-sm text-slate-600 dark:text-slate-300">
                        {comment.comment_content?.substring(0, 300)}
                        {comment.comment_content?.length > 300 && "..."}
                      </div>

                      <div className="mt-2 text-xs text-slate-500">
                        {new Date(comment.comment_date).toLocaleString()}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {comment.comment_approved === "0" && (
                          <button
                            onClick={() => handleCommentModeration(comment.comment_ID, "approve")}
                            disabled={actionLoading === comment.comment_ID}
                            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
                          >
                            Approve
                          </button>
                        )}
                        {comment.comment_approved === "1" && (
                          <button
                            onClick={() => handleCommentModeration(comment.comment_ID, "unapprove")}
                            disabled={actionLoading === comment.comment_ID}
                            className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600 disabled:opacity-50"
                          >
                            Unapprove
                          </button>
                        )}
                        <button
                          onClick={() => handleCommentModeration(comment.comment_ID, "spam")}
                          disabled={actionLoading === comment.comment_ID}
                          className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 disabled:opacity-50"
                        >
                          Spam
                        </button>
                        <button
                          onClick={() => handleCommentModeration(comment.comment_ID, "delete")}
                          disabled={actionLoading === comment.comment_ID}
                          className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Blacklist Tab */}
      {activeTab === "blacklist" && (
        <div>
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded-lg"></div>
              ))}
            </div>
          ) : blacklist.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-700 rounded-lg">
              <p className="text-slate-500 dark:text-slate-400">No blacklist entries</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-700 rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-600">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                      User/IP
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Reason
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Added By
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Expires
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {blacklist.map((entry) => (
                    <tr key={entry.id} className="border-t border-slate-200 dark:border-slate-600">
                      <td className="py-3 px-4">
                        {entry.user_id ? (
                          <div>
                            <p className="font-medium text-slate-800 dark:text-white">{entry.user_name}</p>
                            <p className="text-xs text-slate-500">{entry.user_email}</p>
                          </div>
                        ) : (
                          <span className="font-mono text-slate-600 dark:text-slate-300">{entry.ip_address}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                        {entry.reason || "-"}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                        {entry.created_by_name}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                        {entry.expires_at ? new Date(entry.expires_at).toLocaleDateString() : "Never"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleRemoveFromBlacklist(entry.id)}
                          disabled={actionLoading === entry.id}
                          className="text-red-500 hover:text-red-600 text-sm disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="mt-6 flex items-center justify-center space-x-2">
          {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => {
                if (activeTab === "reports") fetchReports(page);
                else if (activeTab === "comments") fetchComments(page);
                else fetchBlacklist(page);
              }}
              className={`w-8 h-8 rounded ${
                page === pagination.current_page
                  ? "bg-primary-500 text-white"
                  : "bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-500"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
