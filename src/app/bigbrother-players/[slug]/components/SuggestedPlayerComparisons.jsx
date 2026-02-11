import Image from "next/image";
import Link from "next/link";

/**
 * Suggested comparison links shown on player profile pages.
 * Picks notable castmates to compare against.
 */
export function SuggestedPlayerComparisons({ player, relatedPlayers }) {
  const suggestions = getSuggestions(player, relatedPlayers);

  if (suggestions.length === 0) return null;

  return (
    <section>
      <h2 className="v2-primary-subheader mb-3">
        Compare {player.first_name || player.name?.split(" ")[0]}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {suggestions.map(({ slug, name, photo }) => {
          const [s1, s2] =
            player.slug <= slug
              ? [player.slug, slug]
              : [slug, player.slug];

          return (
            <Link
              key={slug}
              href={`/compare/${s1}-vs-${s2}`}
              className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-2 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-sm transition-all group"
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-600">
                {photo ? (
                  <Image src={photo} alt={name} fill className="object-cover" sizes="32px" />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-400">
                    {name?.charAt(0)}
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                vs {name?.split(" ")[0]}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function getSuggestions(player, relatedSeasons) {
  if (!relatedSeasons || !Array.isArray(relatedSeasons)) return [];

  const seen = new Set([player.slug]);
  const results = [];

  // Collect all castmates, prioritize notable ones
  const all = [];
  for (const season of relatedSeasons) {
    for (const p of season.players || []) {
      const slug = extractSlug(p.permalink);
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);

      all.push({
        slug,
        name: p.name,
        photo: p.photo || null,
        status: p.status,
        priority: statusPriority(p.status),
      });
    }
  }

  // Sort by priority (winners first), then alphabetically
  all.sort((a, b) => b.priority - a.priority || a.name.localeCompare(b.name));

  return all.slice(0, 6);
}

function statusPriority(status) {
  if (status === "winner") return 3;
  if (status === "afp" || status === "runner_up") return 2;
  if (status === "hoh" || status === "pov") return 1;
  return 0;
}

function extractSlug(permalink) {
  if (!permalink) return null;
  try {
    const url = new URL(permalink);
    const parts = url.pathname.split("/").filter(Boolean);
    return parts[parts.length - 1] || null;
  } catch {
    const parts = permalink.split("/").filter(Boolean);
    return parts[parts.length - 1] || null;
  }
}
