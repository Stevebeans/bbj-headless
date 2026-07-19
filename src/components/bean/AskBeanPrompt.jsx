import Link from "next/link";

/**
 * "Ask the Bean about this" touchpoint for high-traffic content pages
 * (funnel audit E1: the free Bean tier IS the premium trial, but almost
 * nobody enters it). Cache-safe by design: pure static markup, identical
 * HTML for every visitor, no client fetches - safe on 30-day CF pages.
 */
export default function AskBeanPrompt({ question, label = "Questions about this?" }) {
  return (
    <Link
      href={`/search?q=${encodeURIComponent(question)}`}
      className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-amber-200 dark:border-amber-700/40 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
    >
      <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
        <span className="text-xl" aria-hidden>🫘</span>
        <span>
          <b>{label}</b>{" "}
          <span className="text-slate-500 dark:text-slate-400">
            The Bean reads every feed report and remembers all of it.
          </span>
        </span>
      </span>
      <span className="shrink-0 text-sm font-semibold text-amber-700 dark:text-amber-400">
        Ask the Bean →
      </span>
    </Link>
  );
}
