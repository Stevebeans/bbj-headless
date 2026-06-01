#!/usr/bin/env node
/**
 * Ask the Bean — stateful conversation simulator (throwaway, for Option B voice tuning).
 * Holds the thread in tmp-bean-convo.json so the Bean remembers earlier turns.
 *
 *   node --env-file=.env.local scripts/_bean-sim.mjs "your message"   # one turn
 *   node --env-file=.env.local scripts/_bean-sim.mjs --reset           # clear the thread
 *   BEAN_MODEL=sonnet node --env-file=.env.local scripts/_bean-sim.mjs "msg"
 */
import fs from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { retrieve } from "../src/lib/bean/retrieve.js";
import { buildChatPrompt } from "../src/lib/bean/prompt.js";

const FILE = "tmp-bean-convo.json";
const MODELS = { haiku: "claude-haiku-4-5-20251001", sonnet: "claude-sonnet-4-6" };
const model = MODELS[process.env.BEAN_MODEL] || MODELS.haiku;
const arg = process.argv[2];

if (arg === "--reset") {
  if (fs.existsSync(FILE)) fs.unlinkSync(FILE);
  console.log("(conversation reset)");
  process.exit(0);
}
if (!arg) {
  console.error('Usage: scripts/_bean-sim.mjs "your message"  |  --reset');
  process.exit(1);
}

const history = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : [];
const matches = await retrieve(arg, { withText: true });
const { system, messages } = buildChatPrompt(arg, matches, history);
const res = await new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }).messages.create({
  model, max_tokens: 700, system, messages,
});
const reply = res.content[0].text;

console.log(`\n[${model.includes("sonnet") ? "SONNET" : "HAIKU"} · turn ${history.length / 2 + 1}]`);
console.log(`\nYou: ${arg}\n\nSteve Beans · AI:\n${reply}`);
const srcs = matches.map((m) => m.title).filter(Boolean).slice(0, 3);
if (srcs.length) console.log(`\n(sources: ${srcs.join("; ")})`);

history.push({ role: "user", content: arg }, { role: "assistant", content: reply });
fs.writeFileSync(FILE, JSON.stringify(history, null, 2));
