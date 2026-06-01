import { Index } from "@upstash/vector";

let _index;
function index() {
  if (!_index) {
    _index = new Index({
      url: process.env.UPSTASH_VECTOR_REST_URL,
      token: process.env.UPSTASH_VECTOR_REST_TOKEN,
    });
  }
  return _index;
}

/**
 * Upsert chunks. Built-in-embedding index: pass `data` (raw text), Upstash embeds it.
 * @param {Array<{id:string,text:string,metadata:object}>} chunks
 */
export async function upsertChunks(chunks) {
  if (!chunks.length) return { upserted: 0 };
  const payload = chunks.map((c) => ({ id: c.id, data: c.text, metadata: c.metadata }));
  await index().upsert(payload);
  return { upserted: payload.length };
}

/**
 * Semantic search by raw text. Returns matches flattened with their metadata.
 * @param {string} text
 * @param {number} topK
 */
export async function queryText(text, topK = 6) {
  const res = await index().query({ data: text, topK, includeMetadata: true });
  return (res || []).map((m) => ({ id: m.id, score: m.score, ...m.metadata }));
}

/** Delete all chunks for a source item (used on re-index/update). */
export async function deleteSource(type, sourceId) {
  await index().delete({ prefix: `${type}:${sourceId}#` });
}
