#!/usr/bin/env node
/**
 * Ask the Bean — throwaway voice-tuning harness.
 * Usage:
 *   node --env-file=.env.local scripts/bean-chat.mjs            # Haiku (default)
 *   BEAN_MODEL=sonnet node --env-file=.env.local scripts/bean-chat.mjs
 * Type a Big Brother question, watch "Steve" answer (streamed). Ctrl+C to quit.
 * This is for validating the Voice Guide — NOT shipped.
 */
import readline from "node:readline";
import Anthropic from "@anthropic-ai/sdk";
import { retrieve } from "../src/lib/bean/retrieve.js";
import { buildChatPrompt } from "../src/lib/bean/prompt.js";

const MODELS = { haiku: "claude-haiku-4-5-20251001", sonnet: "claude-sonnet-4-6" };
const model = MODELS[process.env.BEAN_MODEL] || MODELS.haiku;
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.on("close", () => process.exit(0)); // clean exit on Ctrl+C / EOF
console.log(`\n🫘 Ask the Bean harness — model: ${model}\n(type a question, Ctrl+C to quit)\n`);

function ask() {
  if (rl.closed) return;
  rl.question("You: ", async (q) => {
    if (!q.trim()) return ask();
    try {
      const matches = await retrieve(q, { withText: true });
      const { system, messages } = buildChatPrompt(q, matches);
      process.stdout.write("\nSteve Beans · AI:\n  ");
      const stream = client.messages.stream({ model, max_tokens: 1024, system, messages });
      stream.on("text", (t) => process.stdout.write(t.replace(/\n/g, "\n  ")));
      await stream.finalMessage();
      const srcs = matches.map((m) => m.title).filter(Boolean).slice(0, 3);
      if (srcs.length) process.stdout.write(`\n\n  (sources: ${srcs.join("; ")})`);
      console.log("\n");
    } catch (err) {
      console.error("\n[harness error]", err.message, "\n");
    }
    ask();
  });
}
ask();
