"use client";

import { useState } from "react";
import Image from "next/image";
import { FaReply, FaFlag, FaEllipsisV, FaEdit, FaTrash } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import VoteButtons from "./VoteButtons";
import RankBadge from "./RankBadge";
import CommentForm from "./CommentForm";
import ReportModal from "./ReportModal";
import { editComment, deleteComment } from "@/lib/api/comments";

export default function CommentCard({ comment, postId, depth = 0, onCommentAdded, onCommentDeleted, onLoginRequired }) {
  const { user, isAuthenticated } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [currentContent, setCurrentContent] = useState(comment.content);
  const [loading, setLoading] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);

  const canReply = depth < 3;
  const isAuthor = isAuthenticated && user?.user_id === comment.author.id;
  const canModerate = comment.can_edit || comment.can_delete;

  const handleReplySubmit = (newComment) => {
    setReplies([...replies, newComment]);
    setShowReplyForm(false);
    onCommentAdded?.(newComment);
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;

    setLoading(true);
    try {
      await editComment(comment.id, editContent);
      setCurrentContent(editContent);
      setIsEditing(false);
    } catch (error) {
      console.error("Edit failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    setLoading(true);
    try {
      await deleteComment(comment.id);
      onCommentDeleted?.(comment.id);
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Convert plain URLs to links
  const formatContent = (text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-500 hover:underline break-all"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className={`${depth > 0 ? "ml-6 md:ml-10 pl-4 border-l-2 border-slate-200 dark:border-slate-600" : ""}`}>
      <div className="py-4">
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
              {comment.author.avatar ? (
                <Image
                  src={comment.author.avatar}
                  alt={comment.author.name}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                  {comment.author.name?.charAt(0) || "?"}
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-semibold text-slate-800 dark:text-white">
                {comment.author.name}
              </span>
              {comment.author.rank && (
                <RankBadge rank={comment.author.rank} size="xs" />
              )}
              <span className="text-xs text-slate-500" title={comment.date}>
                {comment.time_ago}
              </span>
            </div>

            {/* Body */}
            {isEditing ? (
              <div className="mb-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditContent(currentContent);
                    }}
                    className="px-3 py-1 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEdit}
                    disabled={loading}
                    className="px-3 py-1 bg-primary-500 hover:bg-primary-600 text-white rounded text-sm font-medium disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap break-words">
                {formatContent(currentContent)}
              </div>
            )}

            {/* Actions */}
            {!isEditing && (
              <div className="flex items-center gap-4 mt-2">
                {/* Votes */}
                <VoteButtons
                  commentId={comment.id}
                  votes={comment.votes}
                  userVote={comment.user_vote}
                  onLoginRequired={onLoginRequired}
                />

                {/* Reply */}
                {canReply && (
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        onLoginRequired?.();
                        return;
                      }
                      setShowReplyForm(!showReplyForm);
                    }}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary-500 transition-colors"
                  >
                    <FaReply className="w-3 h-3" />
                    <span>Reply</span>
                  </button>
                )}

                {/* Report */}
                {isAuthenticated && !isAuthor && (
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors"
                  >
                    <FaFlag className="w-3 h-3" />
                    <span>Report</span>
                  </button>
                )}

                {/* More actions dropdown */}
                {canModerate && (
                  <div className="relative">
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
                    >
                      <FaEllipsisV className="w-3 h-3" />
                    </button>

                    {showDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowDropdown(false)}
                        />
                        <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-slate-200 dark:border-slate-600 z-20 py-1">
                          {comment.can_edit && (
                            <button
                              onClick={() => {
                                setIsEditing(true);
                                setShowDropdown(false);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600"
                            >
                              <FaEdit className="w-3 h-3" />
                              Edit
                            </button>
                          )}
                          {comment.can_delete && (
                            <button
                              onClick={() => {
                                handleDelete();
                                setShowDropdown(false);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-600"
                            >
                              <FaTrash className="w-3 h-3" />
                              Delete
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reply Form */}
        {showReplyForm && (
          <div className="mt-4 ml-13">
            <CommentForm
              postId={postId}
              parentId={comment.id}
              onSubmit={handleReplySubmit}
              onCancel={() => setShowReplyForm(false)}
              placeholder={`Reply to ${comment.author.name}...`}
              buttonText="Reply"
              compact
            />
          </div>
        )}
      </div>

      {/* Replies */}
      {replies.length > 0 && (
        <div>
          {replies.map((reply) => (
            <CommentCard
              key={reply.id}
              comment={reply}
              postId={postId}
              depth={depth + 1}
              onCommentAdded={onCommentAdded}
              onCommentDeleted={(id) => {
                setReplies(replies.filter((r) => r.id !== id));
                onCommentDeleted?.(id);
              }}
              onLoginRequired={onLoginRequired}
            />
          ))}
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        commentId={comment.id}
        commentAuthor={comment.author.name}
      />
    </div>
  );
}
