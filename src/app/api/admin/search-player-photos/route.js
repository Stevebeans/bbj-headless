/**
 * Search Google Images for player photos
 * This runs server-side to avoid CORS issues with Google API
 */

const GOOGLE_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
const GOOGLE_CX = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

export async function POST(request) {
  try {
    // Verify auth token
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { playerName, seasonName } = await request.json();

    if (!playerName) {
      return Response.json({ success: false, message: "Player name required" }, { status: 400 });
    }

    if (!GOOGLE_API_KEY || !GOOGLE_CX) {
      return Response.json({
        success: false,
        message: "Google API not configured"
      }, { status: 500 });
    }

    // Build search query
    const searchQuery = `${playerName} ${seasonName || "Big Brother"} headshot profile picture`;

    const params = new URLSearchParams({
      key: GOOGLE_API_KEY,
      cx: GOOGLE_CX,
      q: searchQuery,
      searchType: "image",
      num: "6", // Get 6 results, we'll filter to best 3
      imgSize: "medium",
      imgType: "face",
      safe: "active",
    });

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params.toString()}`
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error("Google API error:", error);
      return Response.json({
        success: false,
        message: error.error?.message || `Google API error: ${response.status}`
      }, { status: response.status });
    }

    const data = await response.json();

    // Format results
    const photos = (data.items || []).slice(0, 3).map((item, index) => ({
      id: index + 1,
      url: item.link,
      thumbnail: item.image?.thumbnailLink || item.link,
      width: item.image?.width,
      height: item.image?.height,
      source: item.displayLink,
    }));

    return Response.json({
      success: true,
      photos,
      query: searchQuery,
    });

  } catch (error) {
    console.error("Search player photos error:", error);
    return Response.json({
      success: false,
      message: error.message || "Search failed"
    }, { status: 500 });
  }
}
