"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { voteFeedUpdate } from "@/lib/api/feedUpdates";
import { isFreshUpdate } from "@/lib/feedUpdatesLive";

// One update row in the editorial thread. Client component (real voting).
export function FeedHubUpdateCard({ update }) {
  const { user, isAuthenticated } = useAuth();
  const [votes, setVotes] = useState(update.votes || { total: 0, user_vote: 0 });
  const [isVoting, setIsVoting] = useState(false);
  const href = `/live-feed-updates/${update.slug}`;
  const init = (update.author?.name || "BBJ").slice(0, 2).toUpperCase();

  const handleVote = async (value) => {
    if (!isAuthenticated || isVoting) return;
    const newVote = votes.user_vote === value ? 0 : value;
    setIsVoting(true);
    try {
      const res = await voteFeedUpdate(update.id, newVote, user.token);
      setVotes({ total: res.total_votes, user_vote: res.user_vote });
    } catch (e) {
      console.error("Vote failed:", e);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <article className="fuh-upd" data-mode={update.mode}>
      <div className="fuh-vote">
        <button type="button" aria-label="Upvote" disabled={!isAuthenticated || isVoting} onClick={() => handleVote(1)}>▲</button>
        <span className="fuh-n">{votes.total}</span>
        <button type="button" aria-label="Downvote" disabled={!isAuthenticated || isVoting} onClick={() => handleVote(-1)}>▼</button>
      </div>
      <div className="fuh-body">
        <div className="fuh-head">
          {update.author?.avatar ? (
            <Image className="fuh-av fuh-av-img" src={update.author.avatar} alt="" width={22} height={22} unoptimized />
          ) : (
            <span className="fuh-av">{init}</span>
          )}
          <span className="fuh-by">{update.author?.name}</span>
          {update.mode && <span className="fuh-cat">{update.mode === "show" ? "Show" : "Feed"}</span>}
          <span className={`fuh-t${isFreshUpdate(update.modified) ? " fuh-fresh" : ""}`} data-nosnippet><b>{update.time_ago}</b></span>
        </div>
        <h3><Link href={href}>{update.title}</Link></h3>
        {update.excerpt && <p>{update.excerpt}</p>}
        {update.thumbnail && (
          <Link className="fuh-thumb" href={href} aria-hidden="true" tabIndex={-1}>
            <Image src={update.thumbnail} alt="" width={520} height={300} style={{ width: "100%", height: "auto" }} />
          </Link>
        )}
        <div className="fuh-foot">
          <Link className="fuh-cmt" href={`${href}#comments`}>💬 {update.comment_count} comments</Link>
          <Link href={href}>↗ Open</Link>
        </div>
      </div>
    </article>
  );
}
