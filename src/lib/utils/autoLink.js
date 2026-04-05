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

    const regex = new RegExp(`(?<![\\w-])${escapeRegex(name)}(?![\\w-])`, "i");
    const match = regex.exec(result);
    if (!match) continue;

    const before = result.substring(0, match.index);
    if (isInsideTag(before)) continue;

    const link = `<a href="${url}" class="auto-link">${match[0]}</a>`;
    result = result.substring(0, match.index) + link + result.substring(match.index + match[0].length);
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
