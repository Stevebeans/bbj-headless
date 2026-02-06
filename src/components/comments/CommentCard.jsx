"use client";

import { useState } from "react";
import Image from "next/image";
import { FaReply, FaFlag, FaEllipsisV, FaEdit, FaTrash, FaLink, FaThumbtack } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import VoteButtons from "./VoteButtons";
import RankBadge from "./RankBadge";
import ReactionButtons from "./ReactionButtons";
import OnlineIndicator from "./OnlineIndicator";
import AuthorModal from "./AuthorModal";
import CommentForm from "./CommentForm";
import ReportModal from "./ReportModal";
import StaffPickBadge from "./StaffPickBadge";
import { editComment, deleteComment, pinComment, unpinComment } from "@/lib/api/comments";

export default function CommentCard({ comment, postId, depth = 0, onCommentAdded, onCommentDeleted, onLoginRequired, isHighlighted = false }) {
  const { user, isAuthenticated } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [currentContent, setCurrentContent] = useState(comment.content);
  const [loading, setLoading] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);
  const [isPinned, setIsPinned] = useState(comment.is_pinned || false);
  const [errorMsg, setErrorMsg] = useState(null);

  const showError = (msg) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(null), 4000);
  };

  const canReply = depth < 3;
  const isAuthor = isAuthenticated && user?.user_id === comment.author.id;
  const canModerate = comment.can_edit || comment.can_delete;

  const handleSharePermalink = async () => {
    const url = `${window.location.origin}${window.location.pathname}?comment=${comment.id}#comment-${comment.id}`;
    try {
      await navigator.clipboard.writeText(url);
      // Could add a toast notification here
    } catch (err) {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  };

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
      showError(error.message || "Edit failed");
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
      showError(error.message || "Delete failed");
      console.error("Delete failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePin = async () => {
    setLoading(true);
    try {
      if (isPinned) {
        await unpinComment(comment.id);
        setIsPinned(false);
      } else {
        await pinComment(comment.id);
        setIsPinned(true);
      }
    } catch (error) {
      showError(error.message || "Pin toggle failed");
      console.error("Pin toggle failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Convert plain URLs to links and @mentions to styled text
  const formatContent = (text) => {
    // First split by URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const mentionRegex = /@([a-zA-Z0-9_-]+)/g;

    const parts = text.split(urlRegex);
    const result = [];

    parts.forEach((part, partIndex) => {
      if (part.match(urlRegex)) {
        result.push(
          <a
            key={`url-${partIndex}`}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-500 hover:underline break-all"
          >
            {part}
          </a>
        );
      } else {
        // Process mentions within non-URL parts
        const mentionParts = part.split(mentionRegex);
        mentionParts.forEach((mentionPart, mentionIndex) => {
          // Every other element is a captured mention (username)
          if (mentionIndex % 2 === 1) {
            result.push(
              <span
                key={`mention-${partIndex}-${mentionIndex}`}
                className="text-primary-500 font-medium cursor-pointer hover:underline"
                onClick={() => {
                  // Could open AuthorModal here if we had user ID
                  // For now, just style it
                }}
              >
                @{mentionPart}
              </span>
            );
          } else if (mentionPart) {
            result.push(mentionPart);
          }
        });
      }
    });

    return result;
  };

  return (
    <div
      id={`comment-${comment.id}`}
      className={`${depth > 0 ? "ml-6 md:ml-10 pl-4 border-l-2 border-slate-200 dark:border-slate-600" : ""} ${isHighlighted ? "highlight-comment" : ""}`}
    >
      <div className="py-4">
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0 relative w-10 h-10">
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
            {/* Online indicator */}
            {comment.author.is_online && (
              <OnlineIndicator
                isOnline={true}
                size="sm"
                className="absolute bottom-0 right-0"
              />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <button
                onClick={() => comment.author.id > 0 && setShowAuthorModal(true)}
                className={`font-semibold text-slate-800 dark:text-white ${
                  comment.author.id > 0 ? "hover:text-primary-500 cursor-pointer" : ""
                }`}
                disabled={comment.author.id === 0}
              >
                {comment.author.name}
              </button>
              {comment.author.rank && (
                <RankBadge rank={comment.author.rank} size="xs" />
              )}
              {isPinned && <StaffPickBadge />}
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

            {/* Attached Media */}
            {comment.media && (
              <div className="mt-2">
                <div className="inline-block max-w-sm rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                  {comment.media.type === "giphy" ? (
                    // Giphy - use regular img for animated GIFs
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={comment.media.url}
                      alt="GIF"
                      className="max-w-full max-h-64 object-contain"
                      loading="lazy"
                    />
                  ) : comment.media.type === "gif" ? (
                    // Uploaded GIF - use regular img to preserve animation
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={comment.media.url}
                      alt="Attached image"
                      className="max-w-full max-h-64 object-contain"
                      loading="lazy"
                    />
                  ) : (
                    // Regular image - use Next.js Image for optimization
                    <Image
                      src={comment.media.url}
                      alt="Attached image"
                      width={comment.media.width || 400}
                      height={comment.media.height || 300}
                      className="max-w-full max-h-64 w-auto h-auto object-contain"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Error message */}
            {errorMsg && (
              <div className="text-xs text-red-500 dark:text-red-400 mt-1 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">
                {errorMsg}
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

                {/* Reactions */}
                <ReactionButtons
                  commentId={comment.id}
                  reactions={comment.reactions}
                  reactionTotal={comment.reaction_total}
                  userReaction={comment.user_reaction}
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

                {/* Share/Permalink */}
                <button
                  onClick={handleSharePermalink}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-primary-500 transition-colors"
                  title="Copy link to comment"
                >
                  <FaLink className="w-3 h-3" />
                  <span className="hidden sm:inline">Share</span>
                </button>

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
                          {comment.can_pin && (
                            <button
                              onClick={() => {
                                handleTogglePin();
                                setShowDropdown(false);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-600"
                            >
                              <FaThumbtack className="w-3 h-3" />
                              {isPinned ? "Unpin" : "Pin"}
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
              isHighlighted={false}
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

      {/* Author Modal */}
      <AuthorModal
        userId={comment.author.id}
        isOpen={showAuthorModal}
        onClose={() => setShowAuthorModal(false)}
      />
    </div>
  );
}
