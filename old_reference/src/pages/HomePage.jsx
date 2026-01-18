import React from "react";
import FeedUpdates from "@/components/FeedUpdates";
//import HomePosts from "@/components/HomePosts";
import { globalVariables } from "@/utils/globalVariables";
import MainPostCard from "@/components/sub-components/MainPostCard";
import SubHeader from "@/components/sub-components/SubHeader";
import Link from "next/link";
import { FaChevronRight } from "react-icons/fa6";
import HomePosts from "@/components/HomePosts";
import SubPageHeaders from "@/components/sub-components/SubPageHeaders";

const HomePage = ({ initialFeedUpdates, initialPosts }) => {
  if (!initialFeedUpdates || !initialPosts) {
    return <div>Loading...</div>;
  }

  const feed_updates = initialFeedUpdates.feed_updates;
  const blog_posts = initialPosts.blogPosts.posts;

  const first_post = blog_posts[0];

  // get remaining 9 posts
  const remaining_posts = blog_posts.slice(1, 10);

  // console.log(initialPosts);

  return (
    <div className="">
      <section id="page-header" className="p-2">
        <SubPageHeaders text={`${globalVariables.currentSeason} Spoilers`} />
      </section>

      {/* Top Post Section */}
      <section id="latest-post" className="w-full flex-grow mb-4">
        <div className="flex flex-grow p-0 md:p-2 flex-col " id="main-feeds">
          <div className="p-2">
            <SubHeader title="Latest Post" />
          </div>

          <MainPostCard first_post={first_post} />
        </div>
      </section>

      {/* Feed Updates */}
      <section id="next-feed-updates" className=" p-2">
        <SubHeader title="Feed Updates" />
        {feed_updates ? <FeedUpdates feed_updates={feed_updates} /> : <div>Loading...F</div>}
      </section>

      {/* Blog Posts */}
      <section id="latest-posts">
        <div className="w-full flex flex-col my-10 p-2">
          <SubHeader title="Latest Posts" />
          <div className="w-full flex justify-between">
            <div></div>
            <Link href="/page/2" className="btn mb-2">
              View All Posts <FaChevronRight />
            </Link>
          </div>
          <HomePosts remaining_posts={remaining_posts} />
          <div className="w-full flex justify-between">
            <div></div>
            <Link href="/page/2" className="btn mb-2">
              View All Posts <FaChevronRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
