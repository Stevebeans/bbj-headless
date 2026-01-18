import HomePage from "@/pages/HomePage";
import fetchFeedUpdates from "@/utils/fetchFeedUpdates";
import fetchPosts from "@/utils/fetchposts";

export const getStaticProps = async () => {
  const initialFeedUpdates = await fetchFeedUpdates(20);
  const initialPosts = await fetchPosts(10);

  return {
    props: {
      initialFeedUpdates,
      initialPosts
    },
    revalidate: 10
  };
};

const Home = ({ initialFeedUpdates, initialPosts }) => {
  return <HomePage initialFeedUpdates={initialFeedUpdates} initialPosts={initialPosts} />;
};

export default Home;
