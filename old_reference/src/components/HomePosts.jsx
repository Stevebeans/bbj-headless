import React from "react";
import PostCard from "./sub-components/PostCard";
import ArchivePostCard from "./sub-components/ArchivePostCard";
import Link from "next/link";

const HomePosts = ({ remaining_posts = [], error }) => {
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      {remaining_posts.map(post => (
        <div key={post.ID} className="mx-2">
          <ArchivePostCard post={post} />
        </div>
      ))}
    </div>
  );
};

export default HomePosts;
