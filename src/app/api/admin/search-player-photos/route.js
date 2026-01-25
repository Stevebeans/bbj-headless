/**
 * Search for player photos using Fandom/Wikipedia APIs
 * No scraping needed - uses official MediaWiki APIs
 */

const USER_AGENT = "BBJ-PlayerPhotos/1.0 (bigbrotherjunkies.com)";

/**
 * Clean up image URL - remove thumbnail scaling to get full size
 */
function cleanImageUrl(url) {
  if (!url) return null;

  let cleaned = url;

  // Remove Fandom/Wikia thumbnail scaling
  cleaned = cleaned.replace(/\/scale-to-width-down\/\d+/g, "");
  cleaned = cleaned.replace(/\/scale-to-width\/\d+/g, "");

  // Remove Wikipedia thumbnail sizing
  if (cleaned.includes("wikipedia.org") && cleaned.includes("/thumb/")) {
    // From: /thumb/a/ab/Image.jpg/220px-Image.jpg
    // To: /a/ab/Image.jpg
    cleaned = cleaned.replace(/\/thumb\/([^/]+\/[^/]+\/[^/]+)\/\d+px-[^/]+$/, "/$1");
  }

  // Ensure https
  if (cleaned.startsWith("//")) {
    cleaned = "https:" + cleaned;
  }

  return cleaned;
}

/**
 * Query Fandom API for player images
 */
async function queryFandomAPI(playerName, seasonNumber) {
  const photos = [];

  // Try different page title formats
  const titles = [
    playerName.replace(/\s+/g, "_"),
    `${playerName.replace(/\s+/g, "_")}_(Big_Brother_${seasonNumber})`,
    `${playerName.replace(/\s+/g, "_")}_(Big_Brother_US_${seasonNumber})`,
  ];

  for (const title of titles) {
    try {
      // Query for page image
      const apiUrl = `https://bigbrother.fandom.com/api.php?` +
        `action=query&titles=${encodeURIComponent(title)}&prop=pageimages|images` +
        `&format=json&pithumbsize=500&imlimit=5`;

      const response = await fetch(apiUrl, {
        headers: { "User-Agent": USER_AGENT },
      });

      if (!response.ok) continue;

      const data = await response.json();
      const pages = data.query?.pages;

      if (!pages) continue;

      for (const pageId of Object.keys(pages)) {
        if (pageId === "-1") continue; // Page not found

        const page = pages[pageId];

        // Main page image (thumbnail)
        if (page.thumbnail?.source) {
          const cleaned = cleanImageUrl(page.thumbnail.source);
          if (cleaned && !photos.find(p => p.url === cleaned)) {
            photos.push({
              url: cleaned,
              thumbnail: page.thumbnail.source,
              source: "Big Brother Wiki",
              sourceUrl: `https://bigbrother.fandom.com/wiki/${title}`,
              type: "profile",
            });
          }
        }

        // Additional images from the page
        if (page.images) {
          for (const img of page.images) {
            // Skip non-relevant images
            if (img.title.includes("Icon") ||
                img.title.includes("Logo") ||
                img.title.includes("icon") ||
                img.title.includes("CBS") ||
                !img.title.match(/\.(jpg|jpeg|png|webp)$/i)) {
              continue;
            }

            // Get the actual image URL
            const imgInfoUrl = `https://bigbrother.fandom.com/api.php?` +
              `action=query&titles=${encodeURIComponent(img.title)}&prop=imageinfo` +
              `&iiprop=url&format=json`;

            try {
              const imgResponse = await fetch(imgInfoUrl, {
                headers: { "User-Agent": USER_AGENT },
              });
              const imgData = await imgResponse.json();
              const imgPages = imgData.query?.pages;

              if (imgPages) {
                for (const imgPageId of Object.keys(imgPages)) {
                  const imgUrl = imgPages[imgPageId]?.imageinfo?.[0]?.url;
                  if (imgUrl && !photos.find(p => p.url === imgUrl)) {
                    photos.push({
                      url: imgUrl,
                      thumbnail: imgUrl.replace(/\/revision\/latest/, "/revision/latest/scale-to-width-down/200"),
                      source: "Big Brother Wiki",
                      sourceUrl: `https://bigbrother.fandom.com/wiki/${title}`,
                      type: "gallery",
                    });
                  }
                }
              }
            } catch (e) {
              // Skip failed image lookups
            }

            if (photos.length >= 5) break;
          }
        }
      }

      // If we found the main profile photo, stop trying other titles
      if (photos.length > 0) break;

    } catch (error) {
      console.error(`Fandom API error for ${title}:`, error.message);
    }
  }

  return photos;
}

/**
 * Query Wikipedia API for player image
 */
async function queryWikipediaAPI(playerName) {
  const photos = [];

  try {
    const title = playerName.replace(/\s+/g, "_");
    const apiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;

    const response = await fetch(apiUrl, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!response.ok) return photos;

    const data = await response.json();

    if (data.thumbnail?.source) {
      const cleaned = cleanImageUrl(data.originalimage?.source || data.thumbnail.source);
      photos.push({
        url: cleaned,
        thumbnail: data.thumbnail.source,
        source: "Wikipedia",
        sourceUrl: `https://en.wikipedia.org/wiki/${title}`,
        type: "profile",
      });
    }
  } catch (error) {
    console.error("Wikipedia API error:", error.message);
  }

  return photos;
}

/**
 * Main API handler
 */
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

    // Extract season number
    const seasonMatch = seasonName?.match(/\d+/);
    const seasonNumber = seasonMatch ? seasonMatch[0] : "";

    console.log(`Searching for photos: ${playerName} (Season ${seasonNumber})`);

    // Query both sources in parallel
    const [fandomPhotos, wikipediaPhotos] = await Promise.all([
      queryFandomAPI(playerName, seasonNumber),
      queryWikipediaAPI(playerName),
    ]);

    // Combine results, prioritizing Fandom
    let allPhotos = [...fandomPhotos, ...wikipediaPhotos];

    // Remove duplicates
    const seen = new Set();
    allPhotos = allPhotos.filter(photo => {
      if (seen.has(photo.url)) return false;
      seen.add(photo.url);
      return true;
    });

    // Take top 3
    const photos = allPhotos.slice(0, 3).map((photo, index) => ({
      ...photo,
      id: index + 1,
    }));

    if (photos.length === 0) {
      return Response.json({
        success: false,
        message: "No photos found on BB Wiki or Wikipedia",
        searchedFor: playerName,
      }, { status: 404 });
    }

    console.log(`Found ${photos.length} photos for ${playerName}`);

    return Response.json({
      success: true,
      photos,
      query: playerName,
      sources: ["Big Brother Wiki", "Wikipedia"],
    });

  } catch (error) {
    console.error("Search player photos error:", error);
    return Response.json({
      success: false,
      message: error.message || "Search failed"
    }, { status: 500 });
  }
}
