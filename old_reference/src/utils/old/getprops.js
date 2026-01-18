// This file is used to fetch data from the API and cache it for a certain amount of time.

// export async function getStaticProps() {
//   const fetchUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

//   const postsRes = await fetch(`${fetchUrl}posts?per_page=20`);
//   const feedUpdatesRes = await fetch(`${fetchUrl}live-feed-updates?per_page=20=_fields=${fieldsToPull}`);

//   const posts = await postsRes.json();
//   const feedUpdates = await feedUpdatesRes.json();

//   return {
//     props: {
//       initialPosts: posts,
//       initialFeedUpdates: feedUpdates
//     },
//     revalidate: 60 // Revalidate the data every 60 seconds
//   };
// }

export const fieldsToPull = ["id", "title", "excerpt", "slug", "date", "author", "categories", "tags", "featured_media", "comment_status", "ping_status", "format", "meta", "sticky", "_links", "_embedded"].join(",");
