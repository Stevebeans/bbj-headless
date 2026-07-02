// src/lib/bean/memory.js
// Maintains the per-user evolving "about you" note. Called server-side after a
// Full Bean turn; cheap (Haiku), capped, and best-effort (caller swallows errors).
import Anthropic from "@anthropic-ai/sdk";
import { MODELS } from "./tiers";

const MAX_SUMMARY_CHARS = 1000;
// A note this long is "established" — a rewrite that collapses it to under
// 40% is treated as a model glitch and discarded in favor of the prior note.
const ESTABLISHED_CHARS = 300;

/**
 * Cap a note without guillotining it mid-sentence: cut at the last sentence
 * terminator inside the cap when one exists, else hard-cut at the cap.
 */
export function capNote(text, max = MAX_SUMMARY_CHARS) {
  if (text.length <= max) return text;
  const head = text.slice(0, max);
  const lastStop = Math.max(head.lastIndexOf(". "), head.lastIndexOf(".\n"));
  return lastStop > 0 ? head.slice(0, lastStop + 1) : head;
}

/**
 * Guard against destructive rewrites: an empty result, or one that collapses
 * an established note to a fraction of its size, keeps the prior note. The
 * note is user-facing memory — losing it silently is worse than one stale turn.
 */
export function chooseNote(prior, candidate) {
  const next = (candidate || "").trim();
  if (!next) return prior;
  if (prior.length >= ESTABLISHED_CHARS && next.length < prior.length * 0.4) return prior;
  return next;
}

export async function updateMemory({ priorSummary = "", userMessage, beanReply, userName = "" }) {
  const firstName = (userName || "").trim().split(/\s+/)[0] || "the fan";
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const system =
    `You maintain a concise running note about ${firstName} for a Big Brother chatbot named Steve Beans. ` +
    `Given the CURRENT NOTE and the latest exchange, return an UPDATED note in EXACTLY this format:\n` +
    `FACTS:\n- one durable fact per line (favorite players/seasons, stated preferences, who they root for, recurring topics)\n` +
    `STYLE:\n- how they like to talk (tone, depth, banter)\n` +
    `Rules: NEVER remove a FACTS line unless the latest exchange contradicts or updates it — facts are permanent until then. ` +
    `Add new durable facts from the exchange; drop one-off trivia (single-question topics that reveal nothing about ${firstName}); ` +
    `NEVER store sensitive personal data (health, finances, home address, passwords). ` +
    `If the CURRENT NOTE is not in this format yet, restructure it, keeping everything durable. ` +
    `Write in third person about ${firstName}. Keep it under ${MAX_SUMMARY_CHARS} characters — when trimming for space, ` +
    `condense STYLE and old trivia first, never FACTS. ` +
    `Return ONLY the note text — no preamble, no quotes, no markdown fences.`;

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
  return chooseNote(priorSummary, capNote(text));
}
