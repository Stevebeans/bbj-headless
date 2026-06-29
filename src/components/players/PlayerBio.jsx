/**
 * Player bio content section
 * Renders HTML content from WordPress with proper styling
 */
export function PlayerBio({ content, className = "" }) {
  if (!content || content.trim() === "") {
    return null;
  }

  return (
    <article
      className={`prose-base prose-slate
        max-w-none dark:prose-invert
        break-words selection:bg-yellow-200 selection:text-black
        prose-headings:font-display prose-h2:scroll-mt-24 prose-h3:scroll-mt-24
        prose-a:underline prose-a:text-primary-500 hover:prose-a:text-primary-600
        prose-img:rounded-lg prose-img:mx-auto
        prose-figcaption:text-sm prose-figcaption:text-slate-500
        list-disc list-inside prose-li:marker:text-primary-500
        prose-code:bg-slate-100 dark:prose-code:bg-slate-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
        prose-pre:rounded-md prose-pre:p-4
        prose-table:w-full prose-th:text-left prose-td:p-2
        ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
