// Player memorable quotes: Steve-approved houseguest lines, newest first.
export function PlayerQuotes({ quotes }) {
  if (!quotes?.length) return null;
  return (
    <div
      className="prose-base prose-slate
        max-w-none dark:prose-invert
        break-words selection:bg-yellow-200 selection:text-black
        prose-headings:font-display prose-h2:scroll-mt-24 prose-h3:scroll-mt-24
        prose-a:underline prose-a:text-primary-500 hover:prose-a:text-primary-600
        prose-img:rounded-lg prose-img:mx-auto
        prose-figcaption:text-sm prose-figcaption:text-slate-500
        list-disc list-inside prose-li:marker:text-primary-500
        prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
        prose-pre:rounded-md prose-pre:p-4
        prose-table:w-full prose-th:text-left prose-td:p-2"
    >
      <h3>Memorable Quotes</h3>
      <ul className="space-y-3">
        {quotes.map((q) => (
          <li key={q.id} className="text-sm">
            <blockquote className="italic">“{q.quote_text}”</blockquote>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {q.said_on ? q.said_on : null}
              {q.said_on && q.context ? " · " : null}
              {q.context ? q.context : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
