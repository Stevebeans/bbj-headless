/**
 * Auto-link entity mentions in HTML content
 * Links first occurrence of each entity name, skipping existing links and headings
 */
// Pre-compiled tag patterns to avoid re-creating regexes per entity
const SKIP_TAGS = ["a", "h1", "h2", "h3", "h4", "h5", "h6"];
const TAG_PATTERNS = SKIP_TAGS.map((tag) => ({
  open: new RegExp(`<${tag}[\\s>]`, "gi"),
  close: new RegExp(`</${tag}>`, "gi"),
}));

export function autoLinkEntities(html, entities) {
  if (!html || !entities || entities.length === 0) return html;

  let result = html;

  for (const { name, url } of entities) {
    if (result.includes(`href="${url}"`)) continue;

    // Iterate matches: if the first mention sits inside a heading or existing
    // link, try the NEXT mention instead of giving up on the entity entirely.
    const regex = new RegExp(`(?<![\\w-])${escapeRegex(name)}(?![\\w-])`, "gi");
    let match;
    while ((match = regex.exec(result)) !== null) {
      const before = result.substring(0, match.index);
      if (isInsideTag(before)) continue;

      const link = `<a href="${url}" class="auto-link">${match[0]}</a>`;
      result = result.substring(0, match.index) + link + result.substring(match.index + match[0].length);
      break;
    }
  }

  return result;
}

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isInsideTag(textBefore) {
  for (const { open, close } of TAG_PATTERNS) {
    open.lastIndex = 0;
    close.lastIndex = 0;

    let openCount = 0;
    let closeCount = 0;

    while (open.exec(textBefore) !== null) openCount++;
    while (close.exec(textBefore) !== null) closeCount++;

    if (openCount > closeCount) return true;
  }
  return false;
}

/**
 * Build entity map from seasons data
 */
export function buildSeasonEntityMap(seasons) {
  const entities = [];

  for (const season of seasons) {
    const url = `/bigbrother-seasons/${season.slug}`;
    if (season.name) entities.push({ name: season.name, url });
    if (season.abbreviation && season.abbreviation !== season.name) {
      entities.push({ name: season.abbreviation, url });
    }
  }

  entities.sort((a, b) => b.name.length - a.name.length);
  return entities;
}

/**
 * Build entity map from players data.
 *
 * Disambiguation rules ("Adam and Shelly" problem — bare first names are
 * shared across 27 seasons):
 *   - FULL names ("Adam Poch") link for every player, any era.
 *   - BARE first names only link for the CURRENT season's roster (in a BB28
 *     post, "Rome" means Rome Seymour), and only when no two roster members
 *     share that first name.
 */
export function buildPlayerEntityMap(players = [], currentRoster = []) {
  const entities = [];

  // Some endpoints send slug, others only a permalink — accept either
  const slugOf = (p) =>
    p?.slug ||
    ((p?.permalink || "").match(/\/bigbrother-players\/([^/]+)\/?$/)?.[1] ?? null);

  for (const p of players) {
    const name = (p?.name || "").trim();
    const slug = slugOf(p);
    if (!slug || !name || !name.includes(" ")) continue;
    entities.push({ name, url: `/bigbrother-players/${slug}` });
  }

  const firstNameOf = (p) =>
    ((p?.first_name || (p?.name || "").split(/\s+/)[0]) || "").trim();

  const counts = new Map();
  for (const p of currentRoster) {
    const fn = firstNameOf(p).toLowerCase();
    if (fn.length >= 3) counts.set(fn, (counts.get(fn) || 0) + 1);
  }

  for (const p of currentRoster) {
    const fn = firstNameOf(p);
    const slug = slugOf(p);
    if (slug && fn.length >= 3 && counts.get(fn.toLowerCase()) === 1) {
      entities.push({ name: fn, url: `/bigbrother-players/${slug}` });
    }
  }

  return entities;
}

/**
 * Merge entity maps, longest names first so "Angela Murray" wins over "Angela"
 * and "Big Brother 28" wins over "Big Brother".
 */
export function mergeEntityMaps(...maps) {
  return maps.flat().sort((a, b) => b.name.length - a.name.length);
}
