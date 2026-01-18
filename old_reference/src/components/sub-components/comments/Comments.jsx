"use client";

import React, { useState } from "react";
import SubHeader from "../SubHeader";
import Image from "next/image";
import CommentCard from "./CommentCard";
import { useAuth } from "@/context/AuthContext";
import PostComment from "./PostComment";
import Link from "next/link";

import { useRouter } from "next/router";
import { redirectToLogin } from "@/utils/navigation";

// add nested comments
const nestedCommentsBuilder = (comments, parent) => {
  return comments
    .filter(comment => comment.parent === parent)
    .map(comment => ({
      ...comment,
      children: nestedCommentsBuilder(comments, comment.id)
    }));
};

// loop through comments and add children to first level
const nestedReplies = (comments, parents) => {
  return parents.map(parent => {
    const children = nestedCommentsBuilder(comments, parent.id);
    return {
      ...parent,
      children: children.length ? nestedReplies(comments, children) : []
    };
  });
};

const Comments = ({ comments, count }) => {
  const { user } = useAuth();
  const [sortOrder, setSortOrder] = useState("newest");
  const router = useRouter();

  const handleSortChange = e => {
    setSortOrder(e.target.value);
  };

  const sortedComments = [...comments].sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.comment_date) - new Date(a.comment_date);
    } else if (sortOrder === "oldest") {
      return new Date(a.comment_date) - new Date(b.comment_date);
    } else if (sortOrder === "popular") {
      return b.comment_likes - a.comment_likes;
    } else if (sortOrder === "least") {
      return a.comment_likes - b.comment_likes;
    }
  });

  if (!comments.length) {
    return <p>No comments yet. Be the first to comment!</p>;
  }

  const post_ID = comments[0].post_ID;

  return (
    <div className="p-2">
      <div className="flex justify-between items-center mb-4 border-b border-primary400">
        <div>
          <SubHeader title={`${count} Comments`} />
        </div>
        <div>
          <label htmlFor="sortOrder" className="mr-2">
            Sort by:
          </label>
          <select id="sortOrder" value={sortOrder} onChange={handleSortChange} className="border p-1 rounded">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="popular">Most Popular</option>
            <option value="least">Least Popular</option>
          </select>
        </div>
      </div>

      <div className="">
        {user ? (
          <PostComment user={user} post_ID={post_ID} />
        ) : (
          <div className="flex items-center justify-center">
            <p className="text-sm">
              Please{" "}
              <a onClick={() => redirectToLogin(router)} className="hover:cursor-pointer">
                Log In
              </a>{" "}
              to post a comment
            </p>
          </div>
        )}
      </div>

      {sortedComments.map(comment => (
        <div className="mb-10" key={comment.comment_ID}>
          <CommentCard comment={comment} />
        </div>
      ))}
    </div>
  );
};

export default Comments;
