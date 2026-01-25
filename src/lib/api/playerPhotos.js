/**
 * Player Photo API functions
 * Uses Next.js API routes to avoid CORS issues
 */

/**
 * Search for player photos using Google Custom Search
 *
 * @param {string} playerName - Player's name
 * @param {string} seasonName - Season name for context
 * @param {string} token - JWT auth token
 * @returns {Promise<{success: boolean, photos: array}>}
 */
export async function searchPlayerPhotos(playerName, seasonName, token) {
  const response = await fetch("/api/admin/search-player-photos", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      playerName,
      seasonName,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * Save a photo for a player
 * Downloads the image, crops to 375x375, converts to WebP, and saves
 *
 * @param {number} playerId - The player's ID
 * @param {string} imageUrl - URL of the image to download and save
 * @param {string} token - JWT auth token
 * @returns {Promise<{success: boolean, photo: object}>}
 */
export async function savePlayerPhoto(playerId, imageUrl, token) {
  const response = await fetch("/api/admin/save-player-photo", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      playerId,
      imageUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}
