const MAX_WORDS = 900;
const OVERLAP_WORDS = 100;

/**
 * Turn one normalized content item into vector chunks.
 * @param {{id:number,type:string,title:string,url:string,date:string,text:string}} item
 * @returns {Array<{id:string,text:string,metadata:object}>}
 */
export function chunkItem(item) {
  const clean = (item.text || "").replace(/\s+/g, " ").trim();
  if (!clean) return [];

  const prefix = item.title ? `${item.title} ` : "";
  const titled = `${prefix}${clean}`;
  const words = titled.split(" ");
  const chunks = [];

  if (words.length <= MAX_WORDS) {
    chunks.push(makeChunk(item, 0, titled));
    return chunks;
  }

  let start = 0;
  let i = 0;
  while (start < words.length) {
    const slice = words.slice(start, start + MAX_WORDS).join(" ");
    chunks.push(makeChunk(item, i, slice));
    if (start + MAX_WORDS >= words.length) break;
    start += MAX_WORDS - OVERLAP_WORDS;
    i += 1;
  }
  return chunks;
}

function makeChunk(item, i, text) {
  return {
    id: `${item.type}:${item.id}#${i}`,
    text,
    metadata: {
      sourceId: item.id,
      type: item.type,
      title: item.title || "",
      url: item.url || "",
      date: item.date || "",
    },
  };
}
