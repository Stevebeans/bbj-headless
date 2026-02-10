import Image from "next/image";
import Link from "next/link";

/**
 * Suggested comparison matchup links.
 * Algorithm: cross-compare castmates, prioritize winners/AFP, deduplicate.
 * Not behind premium gate — drives internal linking for SEO.
 */
export function SuggestedComparisons({ player1, player2, relatedPlayers1, relatedPlayers2 }) {
  const suggestions = generateSuggestions(player1, player2, relatedPlayers1, relatedPlayers2);

  if (suggestions.length === 0) return null;

  return (
    <section>
      <h2 className="v2-primary-subheader mb-4">More Comparisons</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map(({ slug, p1, p2 }) => (
          <Link
            key={slug}
            href={`/compare/${slug}`}
            className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-3 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm transition-all group"
          >
            {/* Player 1 mini photo */}
            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-100 dark:border-gray-600">
              {p1.photo ? (
                <Image src={p1.photo} alt={p1.name} fill className="object-cover" sizes="40px" />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
                  {p1.name?.charAt(0)}
                </div>
              )}
            </div>

            {/* Label */}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                {p1.name} <span className="text-gray-400 dark:text-gray-500 font-normal">vs</span> {p2.name}
              </div>
            </div>

            {/* Player 2 mini photo */}
            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-100 dark:border-gray-600">
              {p2.photo ? (
                <Image src={p2.photo} alt={p2.name} fill className="object-cover" sizes="40px" />
              ) : (
                <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
                  {p2.name?.charAt(0)}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * Generate up to 8 suggested matchup links from castmate data.
 */
function generateSuggestions(player1, player2, related1, related2) {
  const currentPair = canonicalSlug(player1.slug, player2.slug);
  const seen = new Set([currentPair]);
  const suggestions = [];

  // Collect all castmates from related_players
  const castmates1 = extractCastmates(related1);
  const castmates2 = extractCastmates(related2);

  // 1. Cross-compare: each player vs the other's notable castmates
  addCrossSuggestions(player1, castmates2, seen, suggestions);
  addCrossSuggestions(player2, castmates1, seen, suggestions);

  // 2. Each player vs their own notable castmates (winners/AFP first)
  addSelfSuggestions(player1, castmates1, seen, suggestions);
  addSelfSuggestions(player2, castmates2, seen, suggestions);

  return suggestions.slice(0, 8);
}

function extractCastmates(relatedSeasons) {
  if (!relatedSeasons || !Array.isArray(relatedSeasons)) return [];

  const all = [];
  for (const season of relatedSeasons) {
    for (const p of season.players || []) {
      all.push({
        id: p.id,
        name: p.name,
        slug: extractSlug(p.permalink),
        photo: p.photo || null,
        status: p.status,
      });
    }
  }

  // Deduplicate by id
  const unique = new Map();
  for (const p of all) {
    if (!unique.has(p.id)) unique.set(p.id, p);
  }

  // Prioritize interesting players (winners first, then by name)
  return Array.from(unique.values()).sort((a, b) => {
    const aScore = statusScore(a.status);
    const bScore = statusScore(b.status);
    if (aScore !== bScore) return bScore - aScore;
    return (a.name || "").localeCompare(b.name || "");
  });
}

function statusScore(status) {
  if (status === "winner") return 3;
  if (status === "afp") return 2;
  if (status === "runner_up") return 1;
  return 0;
}

function addCrossSuggestions(player, otherCastmates, seen, out) {
  for (const castmate of otherCastmates) {
    if (out.length >= 8) break;
    if (!castmate.slug) continue;

    const slug = canonicalSlug(player.slug, castmate.slug);
    if (seen.has(slug)) continue;
    seen.add(slug);

    const [s1, s2] = slug.split("-vs-");
    const p1Data = s1 === player.slug ? player : castmate;
    const p2Data = s1 === player.slug ? castmate : player;

    out.push({
      slug,
      p1: { name: p1Data.name, photo: p1Data.photo?.url || p1Data.photo || null },
      p2: { name: p2Data.name, photo: p2Data.photo?.url || p2Data.photo || null },
    });
  }
}

function addSelfSuggestions(player, castmates, seen, out) {
  for (const castmate of castmates) {
    if (out.length >= 8) break;
    if (!castmate.slug) continue;

    const slug = canonicalSlug(player.slug, castmate.slug);
    if (seen.has(slug)) continue;
    seen.add(slug);

    const [s1, s2] = slug.split("-vs-");
    const p1Data = s1 === player.slug ? player : castmate;
    const p2Data = s1 === player.slug ? castmate : player;

    out.push({
      slug,
      p1: { name: p1Data.name, photo: p1Data.photo?.url || p1Data.photo || null },
      p2: { name: p2Data.name, photo: p2Data.photo?.url || p2Data.photo || null },
    });
  }
}

function canonicalSlug(slug1, slug2) {
  return slug1 <= slug2 ? `${slug1}-vs-${slug2}` : `${slug2}-vs-${slug1}`;
}

function extractSlug(permalink) {
  if (!permalink) return null;
  try {
    const url = new URL(permalink);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || null;
  } catch {
    // Already a path or slug
    const parts = permalink.split("/").filter(Boolean);
    return parts[parts.length - 1] || null;
  }
}
