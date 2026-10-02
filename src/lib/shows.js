// Display names for bbj_show slugs (Phase 1: hardcoded, mirrors the composer's SHOWS list).
export const SHOW_LABELS = { survivor: "Survivor", traitors: "The Traitors" };

export function showLabel(slug) {
  return SHOW_LABELS[slug] || (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : "");
}
