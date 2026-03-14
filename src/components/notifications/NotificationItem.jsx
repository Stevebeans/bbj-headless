"use client";

import Image from "next/image";
import Link from "next/link";
import { FaReply, FaAt, FaBell, FaBullhorn } from "react-icons/fa";

export default function NotificationItem({ notification, onClick, compact = false }) {
  const { type, actor, post, comment, time_ago, is_read, message } = notification;

  const isAnnouncement = type === "announcement";

  // Build the message based on notification type
  const getMessage = () => {
    switch (type) {
      case "reply":
        return "replied to your comment";
      case "mention":
        return "mentioned you in a comment";
      case "thread":
        return "commented on a thread you're following";
      default:
        return "interacted with you";
    }
  };

  // Build the link URL
  const getLink = () => {
    if (post?.url && comment?.id) {
      return `${post.url}?comment=${comment.id}#comment-${comment.id}`;
    }
    if (post?.url) {
      return post.url;
    }
    return "#";
  };

  // Get icon for notification type
  const getIcon = () => {
    switch (type) {
      case "reply":
        return <FaReply className="w-3 h-3 text-primary-500" />;
      case "mention":
        return <FaAt className="w-3 h-3 text-secondary-500" />;
      case "thread":
        return <FaBell className="w-3 h-3 text-emerald-500" />;
      case "announcement":
        return <FaBullhorn className="w-3 h-3 text-secondary-500" />;
      default:
        return null;
    }
  };

  const content = (
    <div className="flex items-start gap-3">
      {/* Avatar / Announcement icon */}
      <div className="flex-shrink-0 relative">
        {isAnnouncement ? (
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-secondary-500/15 dark:bg-secondary-500/20">
            <FaBullhorn className="w-5 h-5 text-secondary-500" />
          </div>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
              {actor?.avatar ? (
                <Image
                  src={actor.avatar}
                  alt={actor.name || "User"}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 font-bold">
                  {actor?.name?.charAt(0) || "?"}
                </div>
              )}
            </div>
            {/* Type icon badge */}
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-600">
              {getIcon()}
            </div>
          </>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isAnnouncement ? (
          compact ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary-600 dark:text-secondary-400 mb-0.5">
                New Update
              </p>
              <p className="text-sm text-slate-800 dark:text-slate-200">
                {actor?.name || "Admin"} posted an update — tap to read
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-secondary-600 dark:text-secondary-400 mb-0.5">
                Update from {actor?.name || "Admin"}
              </p>
              <p className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-line">
                {message}
              </p>
            </>
          )
        ) : (
          <>
            <p className="text-sm text-slate-800 dark:text-slate-200">
              <span className="font-semibold">{actor?.name || "Someone"}</span>{" "}
              {getMessage()}
            </p>
            {post?.title && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                on &quot;{post.title}&quot;
              </p>
            )}
            {comment?.excerpt && (
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 italic">
                &quot;{comment.excerpt}&quot;
              </p>
            )}
          </>
        )}
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          {time_ago}
        </p>
      </div>

      {/* Unread indicator */}
      {!is_read && (
        <div className="flex-shrink-0">
          <span className="w-2 h-2 rounded-full bg-primary-500 block" />
        </div>
      )}
    </div>
  );

  const baseClassName = `block px-4 py-3 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0`;

  if (isAnnouncement) {
    const annClassName = `${baseClassName} ${
      !is_read
        ? "bg-secondary-500/5 hover:bg-secondary-500/10 dark:bg-secondary-500/10 dark:hover:bg-secondary-500/15 border-l-2 border-l-secondary-500"
        : "hover:bg-slate-50 dark:hover:bg-slate-700"
    }`;

    // Compact mode (bell dropdown): link to /notifications
    if (compact) {
      return (
        <Link
          href="/notifications"
          onClick={onClick}
          className={`${annClassName}`}
        >
          {content}
        </Link>
      );
    }

    // Full mode (notifications page): just mark as read on click
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${annClassName} w-full text-left cursor-pointer`}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={getLink()}
      onClick={onClick}
      className={`${baseClassName} hover:bg-slate-50 dark:hover:bg-slate-700 ${
        !is_read ? "bg-primary-50/50 dark:bg-primary-900/20" : ""
      }`}
    >
      {content}
    </Link>
  );
}
