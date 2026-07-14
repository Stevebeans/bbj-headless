import Link from "next/link";

// Season quote board: Steve-approved houseguest lines, newest first.
export function QuoteBoard({ quotes }) {
  if (!quotes?.length) return null;
  return (
    <div className="card facts-card">
      <h3>Quote Board</h3>
      <ul className="space-y-3">
        {quotes.map((q) => (
          <li key={q.id} className="text-sm">
            <blockquote className="italic">“{q.quote_text}”</blockquote>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              —{" "}
              {q.player_slug ? (
                <Link href={`/bigbrother-players/${q.player_slug}`} className="hover:underline">
                  {q.player_name}
                </Link>
              ) : (
                "the house"
              )}
              {q.said_on ? ` · ${q.said_on}` : null}
              {q.context ? ` · ${q.context}` : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
