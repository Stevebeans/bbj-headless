"use client";

import React, { useState } from "react";
import { rankCalc } from "@/utils/rankCalc";
import Cookies from "js-cookie";
import axios from "axios";

const PostComment = ({ user, post_ID }) => {
  const userInfo = user;
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const rankInfo = rankCalc(userInfo.user_rank);
  const formattedCommentCount = new Intl.NumberFormat("en-US").format(userInfo.comment_count);
  const formattedLikeCount = new Intl.NumberFormat("en-US").format(userInfo.post_likes);
  const formattedDislikeCount = new Intl.NumberFormat("en-US").format(userInfo.post_dislikes);

  const POST_URL = process.env.NEXT_PUBLIC_COMMENTS_PATH;

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    const token = Cookies.get("token");

    try {
      await axios
        .post(
          POST_URL,
          {
            post: post_ID,
            parent: 0,
            content: comment,
            author_name: userInfo.user_display_name,
            author_email: userInfo.user_email,
            author: userInfo.user_id
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`
            }
          }
        )
        .then(response => {
          setComment("");
          setSuccess(true);
        })
        .catch(error => {
          console.error("Failed to post comment", error);
          setError(error.message);
        });
    } catch (error) {
      console.error("Failed to post comment", error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3">
      <div className="p-2 border border-primary400 rounded-lg h-fit">
        <div className="font-semibold text-secondary500 flex">
          <div>Welcome, {userInfo.user_display_name}</div>

          <div className="w-fit">{rankInfo}</div>
        </div>
        <div className="flex py-1">
          <div className="text-sm ">
            <div className="font-semibold">Stats:</div>
            <div className="text-xs">
              Comment Count: {formattedCommentCount} | Likes: {formattedLikeCount} | Dislikes: {formattedDislikeCount}
            </div>
          </div>
        </div>
      </div>
      <div className="md:col-span-2 pl-2">
        <div className="relative w-full border rounded-md border-gray-400 overflow-hidden p-2">
          <textarea name="reply_comment" id="post_comment" placeholder="Write your thoughts..." className="comment-reply" value={comment} onChange={e => setComment(e.target.value)}></textarea>
          <div className="w-full flex justify-end bg-slate-100 rounded p-2">
            <button type="submit" className="btn ml-2 hover:cursor-pointer" disabled={isSubmitting} onClick={handleSubmit}>
              {isSubmitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
          {error && <div className="text-red-500">{error}</div>}
          {success && <div className="text-green-500">Comment posted successfully!</div>}
        </div>
      </div>
    </div>
  );
};

export default PostComment;
