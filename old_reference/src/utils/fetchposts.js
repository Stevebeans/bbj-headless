// fetchPosts.js

const fetchPosts = async (per_page = 10, page = 1) => {
  const POSTS_PER_PAGE = per_page;
  const offset = (page - 1) * POSTS_PER_PAGE;
  const postURL = `${process.env.NEXT_PUBLIC_API_CUSTOM}blog_posts?per_page=${POSTS_PER_PAGE}&offset=${offset}`;

  try {
    const [blogPosts] = await Promise.all([fetch(postURL).then(res => res.json())]);

    return {
      blogPosts
    };
  } catch (error) {
    console.error("Error fetching data", error);
    return null;
  }
};

export default fetchPosts;
