import React, { useState, useEffect } from "react";
import fetchPosts from "@/utils/fetchposts";
import { useRouter } from "next/router";
import ArchivePostCard from "@/components/sub-components/ArchivePostCard";
import Spinner from "@/components/Spinner";
import Pagination from "@/components/sub-components/Pagination";
import SubPageHeaders from "@/components/sub-components/SubPageHeaders";

export const getStaticProps = async ({ params }) => {
  try {
    const page = params.page ? parseInt(params.page, 10) : 1;
    const allPosts = await fetchPosts(POSTS_PER_PAGE, page);

    return {
      props: {
        allPosts: allPosts || { blogPosts: { posts: [], total_count: 0 } },
        page
      },
      revalidate: 10
    };
  } catch (error) {
    console.error("Error fetching posts:", error);
    return {
      props: {
        allPosts: { blogPosts: { posts: [], total_count: 0 } },
        page
      },
      revalidate: 10
    };
  }
};
export const getStaticPaths = async () => {
  try {
    const allPosts = await fetchPosts(1); // Get only the total count
    const totalCount = allPosts?.blogPosts?.total_count || 0;
    const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);
    const paths = [];

    // Pre-generate only the first 10 pages
    const preGeneratePages = Math.min(10, totalPages);
    for (let i = 1; i <= preGeneratePages; i++) {
      paths.push({
        params: { page: i.toString() }
      });
    }

    return {
      paths,
      fallback: true // Enable on-demand generation
    };
  } catch (error) {
    console.error("Error fetching posts for paths:", error);
    return {
      paths: [],
      fallback: true
    };
  }
};

const POSTS_PER_PAGE = 25;

const BlogPage = ({ allPosts, page }) => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(page);
  const [posts, setPosts] = useState(allPosts?.blogPosts?.posts || []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const newPosts = await fetchPosts(POSTS_PER_PAGE, currentPage);
        setPosts(newPosts?.blogPosts?.posts || []);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setPosts([]);
      }
    };

    if (currentPage !== page) {
      fetchData();
    }
  }, [currentPage, page]);

  if (router.isFallback) {
    return <Spinner />;
  }

  const totalCount = allPosts?.blogPosts?.total_count || 0;
  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  const handlePageChange = newPage => {
    setCurrentPage(newPage);
    router.push(`/page/${newPage}`);
  };

  return (
    <div>
      <SubPageHeaders text="Big Brother Page Archives" /> Page {currentPage}
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      {posts.map(post => (
        <ArchivePostCard post={post} key={post.ID} />
      ))}
      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
    </div>
  );
};

export default BlogPage;
