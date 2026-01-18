// lib/api.js

const FETCH_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const FETCH_V1_URL = process.env.NEXT_PUBLIC_API_CUSTOM;
const FETCH_LOCAL = process.env.NEXT_LOCAL_LOCAL_API;

// Fetch all slugs for pages and posts
export async function fetchAllSlugs() {
  const pagesRes = await fetch(`${FETCH_URL}pages`);
  const postsRes = await fetch(`${FETCH_URL}posts`);

  const pages = await pagesRes.json();
  const posts = await postsRes.json();

  const pageSlugs = pages.map(page => ({ slug: page.slug }));
  const postSlugs = posts.map(post => ({ slug: post.slug }));

  return [...pageSlugs, ...postSlugs];
}

// Fetch page or post data based on slug
export async function fetchPageOrPostData(slug) {
  let content = null;

  const pageRes = await fetch(`${FETCH_V1_URL}single_page?slug=${slug}`);
  const pageData = await pageRes.json();

  if (pageData.length) {
    content = pageData[0];
    content.type = "page";
  } else {
    const postRes = await fetch(`${FETCH_V1_URL}single_page?slug=${slug}`);
    const postData = await postRes.json();

    if (postData.length) {
      content = postData[0];
      content.type = "post";
    }
  }

  return content;
}

// Fetch comments based on post ID
export async function fetchComments(postId) {
  const commentsRes = await fetch(`${FETCH_V1_URL}bbj_comments?post_id=${postId}&per_page=10`);

  const commentsData = await commentsRes.json();

  return commentsData;
}
