import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/api/verifyAuth";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json({ error: "Image URL is required" }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "url", url: imageUrl },
            },
            {
              type: "text",
              text: "Write a concise, descriptive alt text for this image. Context: this is for a Big Brother reality TV fan website. Keep it under 125 characters. Return ONLY the alt text, nothing else.",
            },
          ],
        },
      ],
    });

    const altText = message.content[0].text.trim().replace(/^["']|["']$/g, "");
    return NextResponse.json({ altText });
  } catch (error) {
    console.error("Alt text generation error:", error);
    return NextResponse.json({ error: "Failed to generate alt text" }, { status: 500 });
  }
}
