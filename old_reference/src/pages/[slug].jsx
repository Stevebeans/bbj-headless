import { useRouter } from "next/router";
import React, { lazy, Suspense } from "react";
import { fetchPageOrPostData, fetchAllSlugs, fetchComments } from "@/utils/fetchPagesPosts";
import Comments from "@/components/sub-components/comments/Comments";
import Single from "@/components/Single";

export default function PageOrPost({ content, isPage, comments }) {
  const router = useRouter();

  if (router.isFallback) {
    return <div>Loading...D</div>;
  }
  return (
    <div>
      <Single content={content} />

      {isPage && (
        <Suspense fallback={<div>Loading...E</div>}>
          <Comments comments={comments} count={content.comment_count} />
        </Suspense>
      )}
    </div>
  );
}

export async function getStaticPaths() {
  const paths = await fetchAllSlugs();

  return {
    paths: paths.map(({ slug }) => ({
      params: { slug }
    })),
    fallback: true
  };
}

export async function getStaticProps({ params }) {
  const { slug, id } = params;

  const content = await fetchPageOrPostData(slug, id);

  if (!content) {
    return {
      notFound: true
    };
  }

  let comments = [];

  if (content.next_post_type === "post") {
    comments = await fetchComments(content.ID);
  }

  return {
    props: {
      content,
      isPage: content.type === "page",
      comments
    },
    revalidate: 10
  };
}
