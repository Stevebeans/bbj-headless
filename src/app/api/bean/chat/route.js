// src/app/api/bean/chat/route.js
// Ask the Bean — login-gated streaming chat endpoint (MVP, stateless).
import Anthropic from "@anthropic-ai/sdk";
import { verifyAuth } from "@/lib/api/verifyAuth";
import { resolvePersona } from "@/lib/bean/persona";
import { retrieve } from "@/lib/bean/retrieve";
import { buildChatPrompt } from "@/lib/bean/prompt";
import { buildAnswerCard, cardFacts } from "@/lib/bean/cards";
import { sseEvent } from "@/lib/bean/sse";

export const runtime = "nodejs"; // needs the SDK + env, not edge
export const dynamic = "force-dynamic"; // per-user, auth-gated — never cached (Bean is always dynamic)

const MODEL = "claude-haiku-4-5-20251001"; // MVP = free tier (Haiku); tiering is Phase 2
const MAX_HISTORY = 20; // trust at most this many prior turns from the client

export async function POST(request) {
  // 1. Login gate — no anonymous chat.
  const user = await verifyAuth(request);
  if (!user) {
    return Response.json({ error: "Log in to chat with the Bean." }, { status: 401 });
  }

  // 2. Validate input.
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }
  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (!question || question.length > 2000) {
    return Response.json({ error: "Ask a question (under 2000 chars)." }, { status: 400 });
  }
  const history = Array.isArray(body.history)
    ? body.history
        .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-MAX_HISTORY)
    : [];

  // 3. Persona (seam for a future private persona) + grounding + prompt.
  const { guide } = resolvePersona(user);
  const [matches, card] = await Promise.all([
    retrieve(question, { withText: true }),
    buildAnswerCard(question), // structured card for explicit season/week questions
  ]);
  // If we have a structured card, inject its verified facts as top-priority grounding
  // so the prose answer matches the card (and never hedges on facts we actually have).
  const grounding = card
    ? [{ type: "season", title: card.title, url: card.url, text: cardFacts(card) }, ...matches]
    : matches;
  const { system, messages } = buildChatPrompt(question, grounding, history, guide);
  const sources = matches.map((m) => ({ title: m.title, url: m.url, type: m.type }));

  // 4. Stream the answer as SSE.
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (o) => controller.enqueue(encoder.encode(sseEvent(o)));
      try {
        send({ type: "sources", sources });
        if (card) send({ type: "card", card });
        const ai = client.messages.stream({ model: MODEL, max_tokens: 1024, system, messages });
        ai.on("text", (t) => send({ type: "delta", text: t }));
        await ai.finalMessage();
        send({ type: "done" });
      } catch (err) {
        send({ type: "error", message: "Steve's taking a nap, try again 🫘" });
        console.error("bean chat error:", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
