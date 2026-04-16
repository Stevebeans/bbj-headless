"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { voteFeedUpdate } from "@/lib/api/feedUpdates";
import { getVoteTotalColor } from "@/lib/utils/feedUpdates";

export function FeedUpdateVoting({ updateId, initialVotes }) {
  const { user, isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const [votes, setVotes] = useState(initialVotes);
  const [isVoting, setIsVoting] = useState(false);

  const handleVote = async (voteValue) => {
    if (!isAuthenticated) {
      openLogin();
      return;
    }

    if (isVoting) return;

    // Toggle vote off if clicking same button
    const newVote = votes.user_vote === voteValue ? 0 : voteValue;

    setIsVoting(true);
    try {
      const result = await voteFeedUpdate(updateId, newVote, user.token);
      setVotes({
        total: result.total_votes,
        user_vote: result.user_vote,
      });
    } catch (err) {
      console.error("Vote failed:", err);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 dark:text-gray-400 mr-1">Rate:</span>

      <button
        onClick={() => handleVote(1)}
        disabled={isVoting}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
          votes.user_vote === 1
            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
            : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-green-900/20 dark:hover:text-green-400"
        }`}
        title="Upvote"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
        <span className="text-sm font-medium">Like</span>
      </button>

      <span className={`min-w-[3rem] text-center text-lg font-bold ${getVoteTotalColor(votes.total)}`}>
        {votes.total > 0 ? `+${votes.total}` : votes.total}
      </span>

      <button
        onClick={() => handleVote(-1)}
        disabled={isVoting}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
          votes.user_vote === -1
            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        }`}
        title="Downvote"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
        <span className="text-sm font-medium">Dislike</span>
      </button>
    </div>
  );
}
