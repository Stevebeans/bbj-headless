// src/app/api/bean/chat/route.js
// Ask the Bean — login-gated streaming chat endpoint with tier-based metering.
import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";
import { verifyAuth } from "@/lib/api/verifyAuth";
import { resolvePersona } from "@/lib/bean/persona";
import { retrieve } from "@/lib/bean/retrieve";
import { buildChatPrompt } from "@/lib/bean/prompt";
import { buildAnswerCard, buildPlayerCard, cardFacts } from "@/lib/bean/cards";
import { pacificNowLabel } from "@/lib/bean/time";
import { modelForTier, cappedMessage } from "@/lib/bean/tiers";
import { sseEvent } from "@/lib/bean/sse";
import { updateMemory } from "@/lib/bean/memory";

export const runtime = "nodejs"; // needs the SDK + env, not edge
export const dynamic = "force-dynamic"; // per-user, auth-gated — never cached

const WP = process.env.WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";
const MAX_HISTORY = 20; // trust at most this many prior turns from the client
const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
};

async function getToken(request) {
  const header = request.headers.get("Authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7);
  try {
    return (await cookies()).get("bbj_token")?.value || null;
  } catch {
    return null;
  }
}

// Tier + remaining quota from the plugin. Degrades to free/allowed if the endpoint
// isn't deployed yet, so the chat keeps working before the plugin ships.
async function beanCheck(token) {
  if (!token) return { tier: "free", allowed: true, remaining: null, cap: null };
  try {
    const res = await fetch(`${WP}/bbjd/v1/bean/check`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return { tier: "free", allowed: true, remaining: null, cap: null, _nometer: true };
    return await res.json();
  } catch {
    return { tier: "free", allowed: true, remaining: null, cap: null, _nometer: true };
  }
}

async function beanConsume(token) {
  if (!token) return null;
  try {
    const res = await fetch(`${WP}/bbjd/v1/bean/consume`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

async function beanMemoryGet(token) {
  if (!token) return "";
  try {
    const res = await fetch(`${WP}/bbjd/v1/bean/memory`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return "";
    const data = await res.json();
    return typeof data.summary === "string" ? data.summary : "";
  } catch {
    return "";
  }
}

async function beanMemorySet(token, summary) {
  if (!token || !summary) return;
  try {
    await fetch(`${WP}/bbjd/v1/bean/memory`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ summary }),
    });
  } catch {
    /* best-effort */
  }
}

function sseStream(run) {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      const send = (o) => controller.enqueue(encoder.encode(sseEvent(o)));
      try {
        await run(send);
      } catch (err) {
        send({ type: "error", message: "Steve's taking a nap, try again 🫘" });
        console.error("bean chat error:", err);
      } finally {
        controller.close();
      }
    },
  });
}

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
  const userName = typeof body.userName === "string" ? body.userName.slice(0, 80) : "";

  // 3. Tier + quota check.
  const token = await getToken(request);
  const snap = await beanCheck(token);

  // 3a. Capped — don't spend a model call; stream an in-voice nudge + upsell signal.
  if (!snap.allowed) {
    return new Response(
      sseStream(async (send) => {
        send({ type: "capped", tier: snap.tier, cap: snap.cap });
        send({ type: "delta", text: cappedMessage(snap.tier) });
        send({ type: "done" });
      }),
      { headers: SSE_HEADERS }
    );
  }

  // 4. Persona + grounding + prompt (model tiered by plan).
  const { guide } = resolvePersona(user);
  // Grounding is best-effort: if the vector store or card lookups fail (e.g. Upstash
  // misconfigured/unreachable), Bean still answers — just without site context —
  // instead of dying with the "nap" error. Logged so the degradation is visible.
  const [matches, seasonCard] = await Promise.all([
    retrieve(question, { withText: true }).catch((e) => { console.error("bean grounding (retrieve) failed:", e); return []; }),
    buildAnswerCard(question).catch(() => null),
  ]);
  const card = seasonCard || (await buildPlayerCard(question, matches).catch(() => null));
  const grounding = card
    ? [{ type: "season", title: card.title, url: card.url, text: cardFacts(card) }, ...matches]
    : matches;
  const memorySummary = snap.memory ? await beanMemoryGet(token) : "";
  const { system, messages } = buildChatPrompt(question, grounding, history, guide, pacificNowLabel(), { userName, memorySummary });
  const SOURCE_MIN_SCORE = 0.82;
  const sources =
    (matches[0]?.score ?? 0) >= SOURCE_MIN_SCORE
      ? matches.map((m) => ({ title: m.title, url: m.url, type: m.type }))
      : [];
  const model = modelForTier(snap.tier);

  // 5. Stream the answer, then meter usage.
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return new Response(
    sseStream(async (send) => {
      send({ type: "sources", sources });
      if (card) send({ type: "card", card });
      let answerText = "";
      const ai = client.messages.stream({ model, max_tokens: 1024, system, messages });
      ai.on("text", (t) => { answerText += t; send({ type: "delta", text: t }); });
      await ai.finalMessage();
      // Record the message (only when metering is live) and report remaining quota.
      if (!snap._nometer) {
        const updated = await beanConsume(token);
        if (updated) send({ type: "quota", tier: updated.tier, remaining: updated.remaining, cap: updated.cap });
      }
      send({ type: "done" });
      // Cross-session memory (Full Bean): update the evolving note. Best-effort —
      // the answer already streamed, so a failure here never affects the reply.
      if (snap.memory) {
        try {
          const newSummary = await updateMemory({ priorSummary: memorySummary, userMessage: question, beanReply: answerText, userName });
          await beanMemorySet(token, newSummary);
        } catch (err) {
          console.error("bean memory update failed:", err);
        }
      }
    }),
    { headers: SSE_HEADERS }
  );
}
