"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { voteFeedUpdate } from "@/lib/api/feedUpdates";
import { getVoteTotalColor } from "@/lib/utils/feedUpdates";

export function FeedUpdateCard({ update, onVoteChange }) {
  const { user, isAuthenticated } = useAuth();
  const [votes, setVotes] = useState(update.votes || { total: 0, user_vote: 0 });
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (e, voteValue) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || isVoting) return;

    // If clicking the same vote, remove it (toggle off)
    const newVote = votes.user_vote === voteValue ? 0 : voteValue;

    setIsVoting(true);
    try {
      const result = await voteFeedUpdate(update.id, newVote, user.token);
      setVotes({
        total: result.total_votes,
        user_vote: result.user_vote,
      });
      if (onVoteChange) {
        onVoteChange(update.id, result.total_votes);
      }
    } catch (err) {
      console.error("Vote failed:", err);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <article
      id={`update-${update.id}`}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start gap-3">
          {/* Author Avatar */}
          {update.author?.avatar && (
            <Image
              src={update.author.avatar}
              alt={update.author.name}
              width={40}
              height={40}
              className="rounded-full w-10 h-10 shrink-0"
            />
          )}

          <div className="flex-1 min-w-0">
            {/* Author & Time */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {update.author?.name}
              </span>

              {/* Mode Badge */}
              {update.mode && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    update.mode === "show"
                      ? "bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400"
                      : "bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400"
                  }`}
                >
                  {update.mode === "show" ? "Show" : "Feed"}
                </span>
              )}

              <time
                dateTime={update.date}
                className="text-xs text-gray-500 dark:text-gray-400"
                data-nosnippet
              >
                {update.time_ago}
              </time>
            </div>

            {/* Title */}
            <Link
              href={`/feed-updates/${update.slug}`}
              className="block mt-1 text-base font-semibold text-primary-600 dark:text-primary-400 hover:underline"
            >
              {update.title}
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {update.thumbnail && (
          <div className="float-right ml-3 mb-2">
            <Image
              src={update.thumbnail}
              alt=""
              width={150}
              height={100}
              className="rounded-lg object-cover"
            />
          </div>
        )}
        <div
          className="text-sm text-gray-700 dark:text-gray-300 feed-content"
          dangerouslySetInnerHTML={{ __html: update.content }}
        />
        <div className="clear-both" />
      </div>

      {/* Footer - Voting & Comments */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        {/* Voting */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => handleVote(e, 1)}
            disabled={!isAuthenticated || isVoting}
            className={`p-1.5 rounded transition-colors ${
              votes.user_vote === 1
                ? "text-green-600 bg-green-100 dark:bg-green-900/30"
                : "text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20"
            } ${!isAuthenticated ? "opacity-50 cursor-not-allowed" : ""}`}
            title={isAuthenticated ? "Upvote" : "Log in to vote"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>

          <span className={`min-w-[2rem] text-center text-sm font-medium ${getVoteTotalColor(votes.total)}`}>
            {votes.total > 0 ? `+${votes.total}` : votes.total}
          </span>

          <button
            onClick={(e) => handleVote(e, -1)}
            disabled={!isAuthenticated || isVoting}
            className={`p-1.5 rounded transition-colors ${
              votes.user_vote === -1
                ? "text-red-600 bg-red-100 dark:bg-red-900/30"
                : "text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            } ${!isAuthenticated ? "opacity-50 cursor-not-allowed" : ""}`}
            title={isAuthenticated ? "Downvote" : "Log in to vote"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Comments */}
        <Link
          href={`/feed-updates/${update.slug}#comments`}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {update.comment_count} {update.comment_count === 1 ? "Comment" : "Comments"}
        </Link>
      </div>
    </article>
  );
}
