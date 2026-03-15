import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request) {
  try {
    const { content, categoryName } = await request.json();

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 100,
      messages: [
        {
          role: "user",
          content: `Generate an SEO-optimized blog post title for a Big Brother fan site (BigBrotherJunkies.com).

Category: ${categoryName || "General"}

Post content:
${content.substring(0, 2000)}

Requirements:
- 40-60 characters ideal
- Include relevant keywords naturally
- Engaging for Big Brother fans
- Do NOT use clickbait
- Return ONLY the title text, nothing else`,
        },
      ],
    });

    const title = message.content[0].text.trim().replace(/^["']|["']$/g, "");
    return NextResponse.json({ title });
  } catch (error) {
    console.error("Title generation error:", error);
    return NextResponse.json({ error: "Failed to generate title" }, { status: 500 });
  }
}
