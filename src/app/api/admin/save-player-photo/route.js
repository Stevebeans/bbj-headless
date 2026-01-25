/**
 * Save player photo by proxying to WordPress
 * Downloads image, crops to 375x375, converts to WebP
 * This runs server-side to avoid CORS issues
 */

import { NextResponse } from "next/server";

const WP_API_URL = process.env.WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

// Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(request) {
  try {
    // Get auth token from request
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { playerId, imageUrl } = await request.json();

    if (!playerId || !imageUrl) {
      return Response.json({
        success: false,
        message: "Player ID and image URL required"
      }, { status: 400 });
    }

    // Proxy request to WordPress
    const wpResponse = await fetch(
      `${WP_API_URL}/bbjd/v1/admin/players/${playerId}/select-photo`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({ image_url: imageUrl }),
      }
    );

    const result = await wpResponse.json();

    if (!wpResponse.ok) {
      return Response.json({
        success: false,
        message: result.message || `WordPress error: ${wpResponse.status}`
      }, { status: wpResponse.status });
    }

    return Response.json(result);

  } catch (error) {
    console.error("Save player photo error:", error);
    return Response.json({
      success: false,
      message: error.message || "Save failed"
    }, { status: 500 });
  }
}
