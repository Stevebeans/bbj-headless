import { queryText } from "./vectorStore.js";

/** Keep only the top-scoring chunk per source, preserving order. */
export function dedupeBySource(matches) {
  const seen = new Set();
  const out = [];
  for (const m of matches) {
    const key = `${m.type}:${m.sourceId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(m);
  }
  return out;
}

/**
 * Retrieve the most relevant content for a question.
 * @param {string} query
 * @param {{topK?:number, max?:number, withText?:boolean}} [opts]
 * @returns {Promise<Array<{id,sourceId,type,title,url,date,score,text?}>>}
 */
export async function retrieve(query, { topK = 12, max = 6, withText = false } = {}) {
  const matches = await queryText(query, topK, { includeData: withText });
  return dedupeBySource(matches).slice(0, max);
}
