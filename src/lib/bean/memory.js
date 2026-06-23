// src/lib/bean/memory.js
// Maintains the per-user evolving "about you" note. Called server-side after a
// Full Bean turn; cheap (Haiku), capped, and best-effort (caller swallows errors).
import Anthropic from "@anthropic-ai/sdk";
import { MODELS } from "./tiers";

const MAX_SUMMARY_CHARS = 1000;

export async function updateMemory({ priorSummary = "", userMessage, beanReply, userName = "" }) {
  const firstName = (userName || "").trim().split(/\s+/)[0] || "the fan";
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const system =
    `You maintain a concise running note about ${firstName} for a Big Brother chatbot named Steve Beans. ` +
    `Given the CURRENT NOTE and the latest exchange, return an UPDATED note.\n` +
    `Rules: keep durable facts, preferences, and relationship texture (favorite players/seasons, recurring topics, how they like to talk); ` +
    `drop one-off trivia; NEVER store sensitive personal data (health, finances, home address, passwords). ` +
    `Write in third person about ${firstName}. Keep it under ${MAX_SUMMARY_CHARS} characters. ` +
    `Return ONLY the note text — no preamble, no quotes, no markdown.`;

  const content =
    `CURRENT NOTE:\n${priorSummary || "(none yet)"}\n\n` +
    `LATEST EXCHANGE:\n${firstName}: ${userMessage}\nSteve: ${beanReply}\n\n` +
    `Return the updated note.`;

  const res = await client.messages.create({
    model: MODELS.haiku,
    max_tokens: 400,
    system,
    messages: [{ role: "user", content }],
  });

  const text = (res.content || [])
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
  return text.slice(0, MAX_SUMMARY_CHARS);
}
