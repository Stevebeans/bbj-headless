// src/lib/bean/sharedFacts.js
// Steve's shared "site facts" sheet — admin-curated knowledge injected into
// every user's Bean chats. When Steve (canEdit) says something like "save that
// to memory for others" mid-chat, the chat route calls updateSharedFacts to
// fold the fact into the sheet. Same cheap-Haiku/best-effort pattern as the
// per-user memory in memory.js.
import Anthropic from "@anthropic-ai/sdk";
import { MODELS } from "./tiers";
import { capNote, chooseNote } from "./memory";

const MAX_FACTS_CHARS = 3500;
// How many trailing turns the extractor sees to resolve "that"/"this".
const CONTEXT_TURNS = 4;

// "save that to memory for others", "remember this for everyone",
// "add that to your notes for all users", … — a save-ish verb followed
// (within a short span) by an others/everyone audience.
export const SAVE_FOR_OTHERS_RE =
  /\b(save|remember|note|add|store|keep)\b[\s\S]{0,80}?\b(others|other users|everyone|everybody|all (users|fans|members))\b/i;

export async function updateSharedFacts({ priorFacts = "", history = [], userMessage }) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const recent = history
    .slice(-CONTEXT_TURNS)
    .map((m) => `${m.role === "user" ? "Steve" : "Bean"}: ${m.content}`)
    .join("\n");

  const system =
    `You maintain the SHARED FACT SHEET for a Big Brother chatbot named Steve Beans — ` +
    `durable facts the site owner (the real Steve) wants the bot to know when talking to ALL fans. ` +
    `Steve just asked, mid-conversation, to save something to this sheet. Work out WHAT from his ` +
    `message and the recent exchange (resolve "that"/"this" to the actual claim), then return the ` +
    `FULL updated sheet: one fact per line as "- " bullets, each self-contained and understandable ` +
    `with no conversation context. ` +
    `Rules: NEVER remove or rewrite an existing line unless the new fact contradicts it or Steve ` +
    `explicitly asks; otherwise append. No opinions about individual site members, no sensitive ` +
    `personal data. Keep the sheet under ${MAX_FACTS_CHARS} characters — condense oldest lines first ` +
    `if needed. Return ONLY the sheet text — no preamble, no quotes, no markdown fences.`;

  const content =
    `CURRENT SHEET:\n${priorFacts || "(empty)"}\n\n` +
    `RECENT EXCHANGE:\n${recent || "(none)"}\n\n` +
    `STEVE'S REQUEST: ${userMessage}\n\n` +
    `Return the updated sheet.`;

  const res = await client.messages.create({
    model: MODELS.haiku,
    max_tokens: 1000,
    system,
    messages: [{ role: "user", content }],
  });

  const text = (res.content || [])
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
  return chooseNote(priorFacts, capNote(text, MAX_FACTS_CHARS));
}
