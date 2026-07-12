"use client";

import { useEffect, useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useAuth } from "@/context/AuthContext";
import { useAuthModal } from "@/context/AuthModalContext";
import { getToken } from "@/lib/auth/cookies";
import { getMyVote, castVote } from "@/lib/api/fanVotes";
import { isFanVoteEligible } from "@/lib/fanVoteEligible";

/**
 * AFP standing-vote heart shown on eligible player profiles.
 * - Logged out: outline heart; clicking opens the login modal.
 * - Logged in: filled red heart when this player is the member's current vote,
 *   outline otherwise. Clicking a non-favorite casts (moves) the vote with an
 *   optimistic fill; clicking the current favorite is a no-op (v1: the vote is
 *   moved by hearting someone else, not un-hearted).
 */
export function FanVoteHeart({ player }) {
  const { isAuthenticated } = useAuth();
  const { openLogin } = useAuthModal();
  const [myVote, setMyVote] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const eligible = isFanVoteEligible(player);
  const isMine = myVote != null && myVote === player?.id;

  // Load the member's current vote once, only when the heart is eligible and a
  // token is present (no speculative fetch for anonymous visitors).
  useEffect(() => {
    if (!eligible || !isAuthenticated || !getToken()) return;
    let active = true;
    getMyVote()
      .then((id) => {
        if (active) setMyVote(id);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [eligible, isAuthenticated]);

  // Auto-dismiss the toast.
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!eligible) return null;

  const handleClick = async () => {
    if (!isAuthenticated || !getToken()) {
      openLogin();
      return;
    }
    if (isMine || saving) return;

    const previous = myVote;
    setMyVote(player.id); // optimistic fill
    setToast("Saved — you can change this anytime.");
    setSaving(true);
    try {
      await castVote(player.id);
    } catch {
      setMyVote(previous); // revert on failure — don't strand a wrong filled state
      setToast("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={saving}
        aria-pressed={isMine}
        title={isMine ? "Your favorite ♥" : "Make my favorite"}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors disabled:opacity-60 ${
          isMine
            ? "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border-red-200 dark:border-red-700"
            : "text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/40 border-primary-200 dark:border-primary-700"
        }`}
      >
        {isMine ? (
          <FaHeart className="w-3.5 h-3.5 text-red-500" />
        ) : (
          <FaRegHeart className="w-3.5 h-3.5" />
        )}
        {isMine ? "Your favorite" : "Make my favorite"}
      </button>

      {toast && (
        <div
          role="status"
          className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg dark:bg-gray-700"
        >
          {toast}
        </div>
      )}
    </>
  );
}
