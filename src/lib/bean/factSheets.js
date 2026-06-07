// src/lib/bean/factSheets.js
// Builds canonical "fact-sheet" content items from the site's STRUCTURED data
// (season winners/placements + week-by-week HoH/Veto/Noms/Evictions). These get
// chunked + indexed like any other content, so the Bean can answer hard facts
// (who won, who was HoH week N) instead of guessing from blog-post retrieval.
import { toRelative } from "./content.js";

const WP = process.env.WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

/**
 * Build one season fact-sheet content item.
 * @param {object} season  from /bbjd/v1/seasons (has winner/runner_up/afp)
 * @param {object} [detail] from /bbjd/v1/seasons/by-slug/{slug} (has weeks[], players[])
 * @returns {{id:number,type:string,title:string,url:string,date:string,text:string}}
 */
export function buildSeasonFactSheet(season, detail = {}) {
  const year = (season.end_date || season.start_date || "").slice(0, 4);
  const label = `${season.name}${season.abbreviation ? ` (${season.abbreviation})` : ""}`;
  const lines = [`${label}${year ? `, ${year}` : ""}. Big Brother US season facts.`];

  if (season.winner?.name) lines.push(`Winner: ${season.winner.name}.`);
  if (season.runner_up?.name) lines.push(`Runner-up: ${season.runner_up.name}.`);
  if (season.afp?.name) lines.push(`America's Favorite Player: ${season.afp.name}.`);

  const cast = (detail.players || []).map((p) => p.name).filter(Boolean);
  if (cast.length) lines.push(`Cast (${cast.length}): ${cast.join(", ")}.`);

  const weekLines = [];
  for (const w of detail.weeks || []) {
    const parts = [];
    if (w.hoh?.length) parts.push(`HoH ${w.hoh.join(", ")}`);
    if (w.pov?.length) parts.push(`Veto ${w.pov.join(", ")}`);
    if (w.noms?.length) parts.push(`Nominees ${w.noms.join(", ")}`);
    if (w.evicted?.length) parts.push(`Evicted ${w.evicted.join(", ")}`);
    if (parts.length) weekLines.push(`Week ${w.week_num}: ${parts.join("; ")}.`);
  }
  if (weekLines.length) lines.push("Week by week:", ...weekLines);

  return {
    id: season.id,
    type: "season",
    title: label,
    url: toRelative(season.permalink || ""),
    date: season.start_date || "",
    text: lines.join(" "),
  };
}

/** Fetch all season fact-sheets (list endpoint + per-season detail for weeks/roster). */
export async function fetchSeasonFactSheets() {
  const res = await fetch(`${WP}/bbjd/v1/seasons`);
  if (!res.ok) throw new Error(`seasons: ${res.status}`);
  const data = await res.json();
  const seasons = data.seasons || data;
  const out = [];
  for (const s of seasons) {
    let detail = {};
    if (s.slug) {
      const d = await fetch(`${WP}/bbjd/v1/seasons/by-slug/${s.slug}`);
      if (d.ok) detail = await d.json();
    }
    out.push(buildSeasonFactSheet(s, detail));
  }
  return out;
}
