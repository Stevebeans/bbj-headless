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
 * the per-query context goes in the latest user turn (dynamic → not cached).
 * Prior within-session turns ride along as plain history so the Bean can hold a
 * conversation (this is NOT the premium cross-session memory — just the open chat).
 * @param {string} question  the fan's newest message
 * @param {Array<{type,title,url,date,text}>} matches  retrieved grounding (may be empty)
 * @param {Array<{role:'user'|'assistant',content:string}>} history  prior turns this session
 * @param {string} [guide]  the persona Voice Guide (defaults to public Steve Beans)
 * @returns {{ system: Array, messages: Array }}
 */
export function buildChatPrompt(question, matches = [], history = [], guide = VOICE_GUIDE) {
  const system = [
    { type: "text", text: guide, cache_control: { type: "ephemeral" } },
  ];

  const context = matches.length
    ? matches.map(formatSource).join("\n\n")
    : "(no matching context found in the archive)";

  const guidance = matches.length
    ? "The CONTEXT above is private background — the fan can't see it, so never mention it. Use it for factual claims, weave facts in as if you already knew them, and if it's irrelevant to what they said, ignore it and just talk."
    : "No background notes for this one. Don't invent site facts — answer from general knowledge if you can, flag uncertainty in voice, or just say you don't have it. If they're only chatting, just chat.";

  const content =
    `CONTEXT:\n${context}\n\n` +
    `${guidance}\n\n` +
    `FAN'S MESSAGE: ${question}`;

  return { system, messages: [...history, { role: "user", content }] };
}
