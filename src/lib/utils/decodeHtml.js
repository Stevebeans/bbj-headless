/**
 * Decode HTML entities from WordPress content
 * Converts &amp;, &#8211;, etc. to their proper characters
 */
export function decodeHtml(html) {
  if (!html) return "";

  // Common HTML entities from WordPress
  const entities = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#039;": "'",
    "&apos;": "'",
    "&#8211;": "\u2013", // en-dash
    "&#8212;": "\u2014", // em-dash
    "&#8216;": "\u2018", // left single quote
    "&#8217;": "\u2019", // right single quote
    "&#8218;": "\u201A", // single low quote
    "&#8220;": "\u201C", // left double quote
    "&#8221;": "\u201D", // right double quote
    "&#8222;": "\u201E", // double low quote
    "&#8230;": "\u2026", // ellipsis
    "&#8242;": "\u2032", // prime
    "&#8243;": "\u2033", // double prime
    "&nbsp;": " ",
    "&#160;": " ",
    "&ndash;": "\u2013",
    "&mdash;": "\u2014",
    "&lsquo;": "\u2018",
    "&rsquo;": "\u2019",
    "&ldquo;": "\u201C",
    "&rdquo;": "\u201D",
    "&hellip;": "\u2026",
  };

  let decoded = html;

  // Replace named and numeric entities
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.split(entity).join(char);
  }

  // Handle any remaining numeric entities (&#xxxx;)
  decoded = decoded.replace(/&#(\d+);/g, (match, num) =>
    String.fromCharCode(parseInt(num, 10))
  );

  // Handle hex entities (&#xXXXX;)
  decoded = decoded.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );

  return decoded;
}

/**
 * Strip HTML tags and decode entities - useful for meta descriptions, alt text
 */
export function stripHtml(html) {
  if (!html) return "";
  return decodeHtml(html.replace(/<[^>]*>/g, ""));
}
