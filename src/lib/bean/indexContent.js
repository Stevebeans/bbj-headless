import { chunkItem } from "./chunk.js";
import { upsertChunks, deleteSource } from "./vectorStore.js";

/**
 * Index a batch of normalized items. Idempotent per source (clears old chunks first).
 * @param {Array} items
 * @param {(msg:string)=>void} [log]
 */
export async function indexItems(items, log = () => {}) {
  let totalChunks = 0;
  const BATCH = 50;
  for (let i = 0; i < items.length; i += BATCH) {
    const slice = items.slice(i, i + BATCH);
    const chunks = slice.flatMap((item) => chunkItem(item));
    if (chunks.length) {
      await upsertChunks(chunks);
      totalChunks += chunks.length;
    }
    log(`indexed ${Math.min(i + BATCH, items.length)}/${items.length} items (${totalChunks} chunks)`);
  }
  return { items: items.length, chunks: totalChunks };
}

/** Re-index one item (clear old chunks, add new). Used by the publish webhook. */
export async function reindexItem(item) {
  await deleteSource(item.type, item.id);
  return indexItems([item]);
}
