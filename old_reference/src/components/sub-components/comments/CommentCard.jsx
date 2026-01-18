"use client";

import React, { useState, useEffect, use } from "react";
import Image from "next/image";
import BeansTimeAgo from "../TimeAgo";
import { FaAngleUp, FaAngleDown, FaReply, FaCircleXmark } from "react-icons/fa6";
import Alert from "@mui/material/Alert";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import Cookies from "js-cookie";
import { rankCalc, rankColors } from "@/utils/rankCalc";
import { convertLink } from "@/utils/linkConvert";
import Link from "next/link";
import { commentVoting } from "@/utils/commentVoting";
import { parse } from "date-fns";
import MyModal from "../Modal";
import { replaceURLs } from "@/utils/replaceurls";

import htmlParser from "html-react-parser";

import { useRouter } from "next/router";
import { redirectToLogin } from "@/utils/navigation";

const CommentCard = ({ comment, depth = 0 }) => {
  const [upVote, setUpVote] = useState(0);
  const [downVote, setDownVote] = useState(0);
  const [totalVotes, setTotalVotes] = useState(0);
  const [userVote, setUserVote] = useState(null);
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [replySuccess, setReplySuccess] = useState(false);
  const [votingLoading, setVotingLoading] = useState(false);
  const [modalIsOpen, setModalIsOpen] = useState(false);

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);
  const { user } = useAuth();
  const router = useRouter();

  // first, calculate the votes
  //console.log("comment", comment);

  useEffect(() => {
    let upVoteCount = 0;
    let downVoteCount = 0;

    // set the vote type to int for the remainder of the counting

    if (comment.all_votes.length > 0) {
      comment.all_votes.forEach(vote => {
        const voteType = parseInt(vote.vote_type);
        if (voteType === 1) {
          upVoteCount++;
        } else if (voteType === -1) {
          downVoteCount++;
        }

        if (user && vote.user_id === user.data.user.id) {
          setUserVote(voteType === 1 ? "up" : "down");
        }
      });
    }

    setUpVote(upVoteCount);
    setDownVote(downVoteCount);
    setTotalVotes(upVoteCount - downVoteCount);
  }, [comment, user]);

  const handleVote = async type => {
    if (votingLoading || (userVote && userVote === type)) return;

    // if user is not logged in, show modal

    if (!user) {
      openModal();
      return;
    }

    setVotingLoading(true);

    try {
      await commentVoting(comment.comment_ID, type, user.data.user.id, comment.post_ID);
      if (type === "up") {
        setUpVote(upVote + 1);
        setTotalVotes(totalVotes + 1);
      } else if (type === "down") {
        setDownVote(downVote + 1);
        setTotalVotes(totalVotes - 1);
      }
      setUserVote(type);
    } catch (error) {
      console.error("Error voting on comment:", error);
    } finally {
      setVotingLoading(false);
    }
  };

  const handleReplyClick = () => {
    setShowReply(!showReply);
  };

  const handleCancel = () => {
    setShowReply(false);
    setReplyContent("");
  };

  const handleReplyChange = e => {
    setReplyContent(e.target.value);
  };

  const handleReplySubmit = () => {
    handleReply();
  };

  const handleReply = async () => {
    const POST_URL = process.env.NEXT_PUBLIC_COMMENTS_PATH;

    const post_ID = comment.post_ID;
    const comment_ID = comment.comment_ID;
    const user_ID = user.data.user.id;
    const comment_content = replyContent;
    const parent_ID = comment_ID;

    if (!user) {
      console.error("User is not logged in");
      return;
    }

    const token = Cookies.get("token");

    if (!comment_content) {
      console.error("Comment content is empty");
      return;
    }

    setLoading(true);

    // make it EST timezone
    const commentDate = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

    try {
      await axios
        .post(
          POST_URL,
          {
            post: post_ID,
            parent: parent_ID,
            content: comment_content,
            author_name: user.user_display_name,
            author_email: user.user_email,
            author: user_ID,
            date: commentDate
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            }
          }
        )
        .then(response => {
          setLoading(false);
          setReplyContent("");
          setShowReply(false);
          setReplySuccess(true);

          setTimeout(() => {
            setReplySuccess(false);
          }, 3000);
        })
        .catch(error => {
          console.error("Error submitting reply:", error);
        })
        .finally(() => {});

      // Simulate successful API response
    } catch (error) {
      console.error("Error submitting reply:", error);
    } finally {
    }
  };

  const userRank = rankCalc(comment.user_rank);
  const rankColor = rankColors(comment.user_rank);

  const countColor = totalVotes > 0 ? "text-green-500" : totalVotes < 0 ? "text-red-500" : "text-gray-500";

  const formattedContent = replaceURLs(comment.comment_content);

  return (
    <div className="">
      <div className="p-2 mb-2 rounded-md flex items-center">
        <div className="w-12 h-12 p-1 border rounded-full self-start">
          <Image src={comment.comment_author_avatar} alt={comment.comment_author} height={40} width={40} className="rounded-full w-full h-full" />
        </div>
        <div className="ml-2 flex flex-col justify-center w-full">
          <div className="text-xs text-secondary500">
            <BeansTimeAgo date={comment.comment_date} />
          </div>
          <div className="font-semibold border-b border-gray-300 pb-1 mb-2 flex items-center">
            <div className="text-slate-500">{comment.comment_author}</div>
            {userRank && <div>{userRank}</div>}
          </div>
          <div className="text-gray-600">{htmlParser(formattedContent)}</div>

          <div className="flex items-center">
            <div className="hover:cursor-pointer mr-2">
              <FaAngleUp className={` ${userVote === "up" ? "text-primary500" : "text-gray-300"}`} onClick={() => handleVote("up")} disabled={votingLoading} />
            </div>

            <div className={`font-bold ${countColor}`}>{totalVotes}</div>

            <div className="hover:cursor-pointer ml-2">
              <FaAngleDown className={` ${userVote === "down" ? "text-primary500" : "text-gray-300"}`} onClick={() => handleVote("down")} disabled={votingLoading} />
            </div>

            {user ? (
              <>
                {depth < 3 && (
                  <div className="ml-4 hover:cursor-pointer flex items-center" onClick={handleReplyClick}>
                    <FaReply className="text-primary500 mr-2" /> Reply
                  </div>
                )}
              </>
            ) : (
              <div className="ml-4 text-xs">
                <a onClick={() => redirectToLogin(router)} className="font-semibold underline hover:cursor-pointer">
                  Log In to Reply
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
      <MyModal isOpen={modalIsOpen} onClose={closeModal}>
        <h2 className="text-xl font-bold mb-4">Log In To Vote</h2>
        <div>You must be logged in to register your vote.</div>
        <div>Please log in or register today</div>

        <div className="flex w-full justify-center mt-4">
          <a onClick={() => redirectToLogin(router)} className="btn hover:cursor-pointer">
            Log In
          </a>

          <Link href="/bbjregister" className="btn-off ml-2">
            Register
          </Link>
        </div>
      </MyModal>
      {showReply && (
        <div className="ml-16 mb-4">
          <div className="relative w-full border rounded-md border-gray-400 overflow-hidden p-2">
            <textarea name="reply_comment" id={`reply_to_${comment.comment_ID}`} placeholder="Write your reply..." onChange={handleReplyChange} className="comment-reply"></textarea>
            <div className="w-full flex justify-end bg-slate-100 rounded p-2">
              <div className="btn-cancel hover:cursor-pointer" onClick={handleCancel}>
                Cancel
              </div>
              <div className="btn ml-2 hover:cursor-pointer" onClick={handleReplySubmit}>
                Post Reply
              </div>
            </div>
          </div>
          {loading && <Alert severity="info">Submitting Reply....</Alert>}
          {replySuccess && <Alert severity="success">Reply submitted successfully!</Alert>}
        </div>
      )}

      {comment.replies.length > 0 && (
        <>
          {comment.replies.map(reply => (
            <div className={depth < 2 ? "pl-16" : ""} key={reply.comment_ID}>
              <CommentCard comment={reply} key={reply.comment_ID} depth={depth + 1} />
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default CommentCard;
