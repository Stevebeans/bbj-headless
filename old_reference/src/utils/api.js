import axios from "axios";

export const searchContent = async query => {
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  try {
    const [postsResponse, pagesResponse] = await Promise.all([axios.get(`${apiUrl}posts`, { params: { search: query } }), axios.get(`${apiUrl}pages`, { params: { search: query } })]);

    return {
      posts: postsResponse.data,
      pages: pagesResponse.data
    };
  } catch (error) {
    console.error("Error fetching search results:", error.response ? error.response.data : error.message);
    return { posts: [], pages: [] };
  }
};
