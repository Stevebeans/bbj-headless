"use client";
import axios from "axios";
import Cookies from "js-cookie";

export const commentVoting = async (comment_id, vote, user_id, post_id) => {
  const API_URL = process.env.NEXT_PUBLIC_API_CUSTOM + "comment_vote";
  const unixDate = new Date().getTime();

  const token = Cookies.get("token");

  try {
    await axios
      .post(
        API_URL,
        {
          comment_id,
          vote,
          user_id,
          post_id,
          date: unixDate
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      )
      .catch(error => {
        console.error("Error voting on comment:", error);
        throw error;
      });
  } catch (error) {
    console.error("Error voting on comment:", error);
    throw error; // rethrow to handle in component
  }
};
