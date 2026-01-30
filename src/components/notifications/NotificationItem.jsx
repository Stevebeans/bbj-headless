"use client";

import Image from "next/image";
import Link from "next/link";
import { FaReply, FaAt } from "react-icons/fa";

export default function NotificationItem({ notification, onClick }) {
  const { type, actor, post, comment, time_ago, is_read } = notification;

  // Build the message based on notification type
  const getMessage = () => {
    switch (type) {
      case "reply":
        return "replied to your comment";
      case "mention":
        return "mentioned you in a comment";
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
      default:
        return null;
    }
  };

  return (
    <Link
      href={getLink()}
      onClick={onClick}
      className={`block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-b-0 ${
        !is_read ? "bg-primary-50/50 dark:bg-primary-900/20" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 relative">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
            {actor?.avatar ? (
              <Image
                src={actor.avatar}
                alt={actor.name || "User"}
                width={40}
                height={40}
                className="w-full h-full object-cover"
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
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
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
    </Link>
  );
}
