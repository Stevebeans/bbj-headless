// src/lib/bean/cards.js
// Rich answer cards for the Bean — built from STRUCTURED data (the seasons API),
// not the vector index, so they're always accurate. When a fan's question clearly
// references a season (and optionally a week), we attach a visual card to the answer.
const WP = process.env.WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";

/**
 * Detect a season (and optional week) reference in a question.
 * Matches "BB14", "bb 14", "Big Brother 14", "season 14"; week via "week 8"/"wk 8".
 * @returns {{number:number, week:number|null} | null}
 */
export function detectSeasonRef(question) {
  const q = (question || "").toLowerCase();
  const m =
    q.match(/\bbb\s?(\d{1,2})\b/) ||
    q.match(/\bbig\s+brother\s+(\d{1,2})\b/) ||
    q.match(/\bseason\s+(\d{1,2})\b/);
  if (!m) return null;
  const number = parseInt(m[1], 10);
  if (!number || number < 1 || number > 60) return null;
  const wk = q.match(/\b(?:week|wk)\s+(\d{1,2})\b/);
  return { number, week: wk ? parseInt(wk[1], 10) : null };
}

const COLS = ["hoh", "pov", "nom"]; // colored top-bars, reused for both card kinds

/** Shape a season's structured data into a card object the client can render. */
export function shapeSeasonCard(season, ref, detail) {
  const year = (season.end_date || season.start_date || "").slice(0, 4);

  if (ref.week && detail?.weeks?.length) {
    const w = detail.weeks.find((x) => Number(x.week_num) === ref.week);
    if (w) {
      return {
        kind: "week",
        title: `${season.name}`,
        sub: `Week ${w.week_num}`,
        rows: [
          { lab: "HoH", cls: "hoh", names: w.hoh || [] },
          { lab: "Veto", cls: "pov", names: w.pov || [] },
          { lab: "Noms", cls: "nom", names: w.noms || [] },
        ],
        evicted: w.evicted || [],
        url: season.permalink ? new URL(season.permalink).pathname : "",
      };
    }
  }

  return {
    kind: "season",
    title: `${season.name}`,
    sub: year || "Season",
    rows: [
      { lab: "Winner", cls: "hoh", names: season.winner?.name ? [season.winner.name] : [] },
      { lab: "Runner-up", cls: "pov", names: season.runner_up?.name ? [season.runner_up.name] : [] },
      { lab: "AFP", cls: "nom", names: season.afp?.name ? [season.afp.name] : [] },
    ],
    evicted: [],
    url: season.permalink ? new URL(season.permalink).pathname : "",
  };
}

/**
 * Build a card for a question, or null if it doesn't reference a season we have.
 * Fetches the seasons list (for winner/RU/AFP) + by-slug detail (for weeks).
 */
export async function buildAnswerCard(question) {
  const ref = detectSeasonRef(question);
  if (!ref) return null;
  try {
    const list = await fetch(`${WP}/bbjd/v1/seasons`).then((r) => (r.ok ? r.json() : null));
    const seasons = list?.seasons || list;
    if (!Array.isArray(seasons)) return null;
    const season = seasons.find((s) => Number(s.season_number) === ref.number);
    if (!season) return null;

    let detail = null;
    if (ref.week && season.slug) {
      detail = await fetch(`${WP}/bbjd/v1/seasons/by-slug/${season.slug}`).then((r) => (r.ok ? r.json() : null));
    }
    const card = shapeSeasonCard(season, ref, detail);
    // Don't attach an empty card (e.g. a season with no recorded winner/weekly data).
    if (!card.rows.some((row) => row.names.length)) return null;
    return card;
  } catch {
    return null;
  }
}

/** Flatten a card into a plain facts string to ground the model's prose answer. */
export function cardFacts(card) {
  if (!card) return "";
  const parts = [`${card.title}${card.sub ? ` (${card.sub})` : ""}.`];
  for (const r of card.rows) if (r.names.length) parts.push(`${r.lab}: ${r.names.join(", ")}.`);
  if (card.evicted?.length) parts.push(`Evicted: ${card.evicted.join(", ")}.`);
  return parts.join(" ");
}

export const _COLS = COLS;
