import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { verifyAuth } from "@/lib/api/verifyAuth";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Cap function duration — a hung/slow LLM call can't run away and rack up
// Fluid Provisioned Memory. These generations finish in a few seconds.
export const maxDuration = 30;

export async function POST(request) {
  try {
    const user = await verifyAuth(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content } = await request.json();

    if (!content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Write an SEO meta description for this Big Brother blog post.

Post content:
${content.substring(0, 3000)}

Requirements:
- 130-155 characters
- Summarize the key topic
- Include a natural call to action
- Return ONLY the meta description text, nothing else`,
        },
      ],
    });

    const description = message.content[0].text.trim().replace(/^["']|["']$/g, "");
    return NextResponse.json({ description });
  } catch (error) {
    console.error("Meta generation error:", error);
    return NextResponse.json({ error: "Failed to generate meta description" }, { status: 500 });
  }
}
