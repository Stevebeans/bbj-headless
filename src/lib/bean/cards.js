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

/* ============================================================
   PLAYER CARDS — identified via the top retrieved player match
   ============================================================ */

/** Map a player status to a tag color class. */
function statusCls(status) {
  if (status === "winner") return "win";
  if (status === "runner_up") return "ru";
  if (status === "afp") return "afp";
  if (status === "jury") return "jury";
  return "";
}

/**
 * Is this player clearly named in the question? Avoids spurious cards from
 * short common first names ("Will", "Amy") — needs the full name or a token ≥5.
 */
export function playerNamedIn(name, question) {
  const q = (question || "").toLowerCase();
  const full = (name || "").toLowerCase();
  if (full.length >= 5 && q.includes(full)) return true;
  return (name || "")
    .toLowerCase()
    .split(/\s+/)
    .some((tok) => tok.length >= 5 && new RegExp(`\\b${tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(q));
}

/** Shape a player detail record into a card (uses safe career aggregates). */
export function shapePlayerCard(p) {
  const s = p.stats || {};
  const hoh = s.total_hoh ?? s.hoh ?? 0;
  const pov = s.total_pov ?? s.pov ?? 0;
  const nom = s.total_nom ?? s.nom ?? 0;
  const days = s.total_days ?? 0;
  const seasonsN = s.total_seasons ?? (Array.isArray(p.seasons) ? p.seasons.length : 0);
  const tags = [];
  if (seasonsN) tags.push({ label: `${seasonsN} season${seasonsN > 1 ? "s" : ""}`, cls: "" });
  if (p.status_label) tags.push({ label: p.status_label, cls: statusCls(p.status) });
  return {
    kind: "player",
    name: p.name,
    sub: [p.occupation, p.hometown].filter(Boolean).join(" · "),
    photo: p.photo || "",
    initial: (p.name || "?").trim().charAt(0).toUpperCase(),
    tags,
    stats: [
      { k: "HoH", n: hoh, cls: "hoh" },
      { k: "Veto", n: pov, cls: "pov" },
      { k: "Noms", n: nom, cls: "nom" },
      { k: "Days", n: days, cls: "" },
    ],
    url: p.permalink ? new URL(p.permalink).pathname : "",
  };
}

/**
 * Build a player card from retrieved matches: take the top player match, confirm
 * the player is actually named in the question, then fetch their full record.
 * @param {string} question
 * @param {Array} matches  retrieve() results (have type/title/url)
 */
export async function buildPlayerCard(question, matches = []) {
  const hit = matches.find((m) => m.type === "player" && m.title && m.url);
  if (!hit || !playerNamedIn(hit.title, question)) return null;
  const slug = hit.url.split("/").filter(Boolean).pop();
  if (!slug) return null;
  try {
    const p = await fetch(`${WP}/bbjd/v1/players/${slug}`).then((r) => (r.ok ? r.json() : null));
    const player = p?.player || p;
    if (!player?.name) return null;
    return shapePlayerCard(player);
  } catch {
    return null;
  }
}

/** Flatten a card into a plain facts string to ground the model's prose answer. */
export function cardFacts(card) {
  if (!card) return "";
  if (card.kind === "player") {
    const parts = [`${card.name}${card.sub ? ` — ${card.sub}` : ""}.`];
    if (card.tags?.length) parts.push(`${card.tags.map((t) => t.label).join(", ")}.`);
    parts.push(`Competition stats: ${card.stats.map((s) => `${s.n} ${s.k}`).join(", ")}.`);
    return parts.join(" ");
  }
  const parts = [`${card.title}${card.sub ? ` (${card.sub})` : ""}.`];
  for (const r of card.rows) if (r.names.length) parts.push(`${r.lab}: ${r.names.join(", ")}.`);
  if (card.evicted?.length) parts.push(`Evicted: ${card.evicted.join(", ")}.`);
  return parts.join(" ");
}

export const _COLS = COLS;
