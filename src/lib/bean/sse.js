// src/lib/bean/sse.js
// Tiny Server-Sent-Events helpers shared by the chat route (encode) and the
// client stream reader (parse).

/** Encode an object as a single SSE `data:` frame. */
export function sseEvent(obj) {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

/**
 * Parse a buffer of SSE text into complete JSON events.
 * @param {string} buffer
 * @returns {{events: object[], rest: string}} rest = trailing incomplete frame
 */
export function parseSse(buffer) {
  const events = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  for (const part of parts) {
    const line = part.split("\n").find((l) => l.startsWith("data: "));
    if (line) {
      try {
        events.push(JSON.parse(line.slice(6)));
      } catch {
        /* ignore malformed frame */
      }
    }
  }
  return { events, rest };
}
