// lib/api.js

const FETCH_V1_URL = process.env.NEXT_PUBLIC_API_CUSTOM;

// Fetch page or post data based on slug
export async function fetchSpoilerBar(slug) {
  const fetchURL = `${FETCH_V1_URL}next_spoiler_bar`;
  
  
  const spoilerBar = await fetch(fetchURL);
  if (!spoilerBar.ok) {
    throw new Error("Failed to fetch spoiler bar data");
  }

  return spoilerBar.json();
}
