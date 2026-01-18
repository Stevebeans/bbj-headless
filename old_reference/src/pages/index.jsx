// src/pages/index.jsx

import React from "react";
import Divider from "@/components/utils/Divider";
import PageHeader from "@/components/utils/PageHeader";
import { globalVariables } from "@/utils/globalVars";
import MainPostCard from "@/components/cards/MainPost";

const HomePage = ({ postsData, feedUpdatesData }) => {
  console.log("POSTS DATA", postsData);
  const first_post = postsData.posts[0];

  //console.log("FEED UPDATES DATA", feedUpdatesData);
  return (
    <React.Fragment>
      <section>
        <PageHeader text={`${globalVariables.currentSeason} Spoilers`} />
      </section>

      {/* Top Post */}
      <MainPostCard first_post={first_post} />
    </React.Fragment>
  );
};

export const getStaticProps = async () => {
  const POST_URL = process.env.NEXT_PUBLIC_API_URL_BBJ + "/blog_posts?per_page=10";

  const posts = await fetch(POST_URL);
  const postsData = await posts.json();

  //const feedUpdates = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/feed_updates?per_page=20`);
  //const feedUpdatesData = await feedUpdates.json();

  return {
    props: {
      postsData
      //feedUpdatesData
    },
    revalidate: 60
  };
};

export default HomePage;
