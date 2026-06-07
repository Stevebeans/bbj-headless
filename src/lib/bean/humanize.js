// src/lib/bean/humanize.js
// Strip AI "tells" from the Bean's output so fans forget they're talking to a bot.
// Applied at render time on the full accumulated text (handles cross-token cases).
// - em-dashes (and spaced en-dashes) -> commas (a dead AI giveaway)
// - stray markdown bold/italic markers -> removed (people don't bold their texts)
export function humanize(text) {
  if (!text) return text;
  return text
    .replace(/\s*—\s*/g, ", ") // em dash, always punctuation
    .replace(/ – /g, ", ") // spaced en dash (leaves number ranges like 8–10 alone)
    .replace(/\*+/g, ""); // markdown bold/italic markers
}
