// pages/[slug].js
import React from "react";
import { useRouter } from "next/router";
import { GET_POST_BY_SLUG, GET_PAGINATED_POSTS } from "@/utils/graphQueries";
import createApolloClient from "@/utils/apolloClient";

const PostPage = ({ post }) => {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Loading...G</div>;
  }

  return (
    <div>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </div>
  );
};

export default PostPage;
