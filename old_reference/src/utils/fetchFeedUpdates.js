// fetchPosts.js

const fetchFeedUpdates = async (per_page = 20, offset_count = 0) => {
  const POSTS_PER_PAGE = per_page;
  const offset = offset_count;
  const feedURL = `${process.env.NEXT_PUBLIC_API_CUSTOM}feed_updates?per_page=${POSTS_PER_PAGE}&offset=${offset}`;

  try {
    const response = await fetch(feedURL);
    const data = await response.json();

    if (!data) {
      console.error("No feedUpdates in response", data);
      return { feedUpdates: [] }; // Always return an array for feedUpdates
    }
    return data;
  } catch (error) {
    console.error("Error fetching data", error);
    return { feedUpdates: [] };
  }
};

export default fetchFeedUpdates;
