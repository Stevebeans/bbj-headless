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
 * @param {string} [now]  human label for the current time, e.g. "morning (Wednesday, 9:25 AM Pacific)"
 * @returns {{ system: Array, messages: Array }}
 */
export function buildChatPrompt(question, matches = [], history = [], guide = VOICE_GUIDE, now = null, opts = {}) {
  const { userName = "", memorySummary = "" } = opts;
  const firstName = (userName || "").trim().split(/\s+/)[0] || "";

  const system = [
    { type: "text", text: guide, cache_control: { type: "ephemeral" } },
  ];

  const context = matches.length
    ? matches.map(formatSource).join("\n\n")
    : "(no matching context found in the archive)";

  const guidance = matches.length
    ? "The CONTEXT above is private background — the fan can't see it, so never mention it. Use it for factual claims, weave facts in as if you already knew them, and if it's irrelevant to what they said, ignore it and just talk."
    : "No background notes for this one. Don't invent site facts — answer from general knowledge if you can, flag uncertainty in voice, or just say you don't have it. If they're only chatting, just chat.";

  // Greetings are a first-message thing only — mid-conversation the Bean should
  // answer like a continuing text thread, not restart with "Good morning" each turn.
  const midConversation = history.length > 0;

  const timeLine = now
    ? midConversation
      ? `RIGHT NOW it's ${now} — for time references only. You're mid-conversation: no greeting, no mentioning the time of day, just reply.\n\n`
      : `RIGHT NOW it's ${now}. If your opening greeting mentions a time of day, match this. Don't say evening when it's morning.\n\n`
    : "";

  const identityLine = firstName
    ? midConversation
      ? `You're talking to ${firstName}, a logged-in BBJ member; never ask who they are. Don't re-open with their name — you're mid-thread.\n\n`
      : `You're talking to ${firstName}, a logged-in BBJ member. Greet them naturally by name when it fits; never ask who they are.\n\n`
    : "";

  const memoryBlock = memorySummary
    ? `WHAT YOU REMEMBER ABOUT ${firstName || "them"} (private notes from past chats — never recite verbatim, just let it inform how you talk):\n${memorySummary}\n\n`
    : "";

  const content =
    timeLine +
    identityLine +
    memoryBlock +
    `CONTEXT:\n${context}\n\n` +
    `${guidance}\n\n` +
    `FAN'S MESSAGE: ${question}`;

  return { system, messages: [...history, { role: "user", content }] };
}
