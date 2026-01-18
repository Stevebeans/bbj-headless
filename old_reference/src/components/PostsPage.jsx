import React from "react";
import Pagination from "./sub-components/Pagination";
import Link from "next/link";
import ArchivePostCard from "./sub-components/ArchivePostCard";

const PostsPage = () => {
  return (
    <div>
      <h1>Blog - Page {currentPage}</h1>
      <Pagination currentPage={currentPage} totalCount={totalCount} postsPerPage={POSTS_PER_PAGE} />
      <ul>
        {posts.map(post => (
          <li key={post.id}>
            <Link href={`/${post.slug}`}>
              <ArchivePostCard post={post} />
            </Link>
          </li>
        ))}
      </ul>
      <Pagination currentPage={currentPage} totalCount={totalCount} postsPerPage={POSTS_PER_PAGE} />
    </div>
  );
};

export default PostsPage;
