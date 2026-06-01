// src/lib/bean/prompt.js
// Assembles the Anthropic Messages payload for one Bean chat turn.
// Shared by the CLI harness (scripts/bean-chat.mjs) and the chat route.
import { VOICE_GUIDE } from "./voiceGuide.js";

/** Format one retrieved match as a labelled source block for grounding. */
function formatSource(m, i) {
  const head = [m.title, m.type].filter(Boolean).join(" · ");
  return `[${i + 1}] ${head}${m.url ? ` (${m.url})` : ""}\n${m.text || ""}`.trim();
}

/**
 * Build the Anthropic Messages payload pieces for one chat turn.
 * The Voice Guide rides in a cached system block (static → cheap on repeat calls);
 * the per-query context goes in the user turn (dynamic → not cached).
 * @param {string} question  the fan's message
 * @param {Array<{type,title,url,date,text}>} matches  retrieved grounding (may be empty)
 * @returns {{ system: Array, messages: Array }}
 */
export function buildChatPrompt(question, matches = []) {
  const system = [
    { type: "text", text: VOICE_GUIDE, cache_control: { type: "ephemeral" } },
  ];

  const context = matches.length
    ? matches.map(formatSource).join("\n\n")
    : "(no matching context found in the archive)";

  const guidance = matches.length
    ? "Use the CONTEXT above for any factual claims. If it doesn't cover the answer, hedge honestly in voice."
    : "There is NO context from the archive for this one. Do not invent site facts — answer from general knowledge if you can, flag uncertainty in voice, or just say you don't have it.";

  const content =
    `CONTEXT:\n${context}\n\n` +
    `${guidance}\n\n` +
    `FAN'S MESSAGE: ${question}`;

  return { system, messages: [{ role: "user", content }] };
}
