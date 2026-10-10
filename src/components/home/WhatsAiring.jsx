import Image from "next/image";
import Link from "next/link";
import { SectionHeader } from "./SectionHeader";

const commentLabel = (n) => (n === 0 ? "No comments yet" : n === 1 ? "1 comment" : `${n} comments`);

/**
 * Off-season homepage: one card per non-BB show (newest recap thread + a
 * link to that show's page). Data comes from the /homepage `shows` block.
 */
export function WhatsAiring({ shows = [] }) {
  if (shows.length === 0) return null;

  return (
    <section className="v2-primary-container-inner p-5 md:p-[22px]" aria-labelledby="whats-airing-heading">
      <SectionHeader id="whats-airing-heading" href="/shows">
        What&apos;s Airing
      </SectionHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {shows.map((show) => (
          <article
            key={show.slug}
            className="flex flex-col overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:shadow transition-shadow"
          >
            <Link href={`/${show.post.slug}`} className="group relative block">
              <div className="aspect-[16/9] overflow-hidden bg-gray-100 dark:bg-gray-900">
                {show.post.featured_image && (
                  <Image
                    src={show.post.featured_image}
                    alt={show.post.title}
                    width={480}
                    height={270}
                    className="h-full w-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    sizes="(min-width: 640px) 50vw, 100vw"
                  />
                )}
              </div>
              <span className="absolute top-3 left-3 bg-accent-red px-2 py-1 font-osw text-[11px] uppercase tracking-wider text-white">
                {show.name}
              </span>
            </Link>

            <div className="flex flex-1 flex-col p-4">
              <h3 className="font-display text-2xl md:text-3xl leading-tight text-gray-900 dark:text-gray-100">
                <Link href={`/${show.post.slug}`} className="no-underline hover:text-primary-500 dark:hover:text-secondary-500">
                  {show.post.title}
                </Link>
              </h3>
              <div className="mt-2 font-osw text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <time dateTime={show.post.date}>{show.post.date_formatted}</time>
                <span> · </span>
                <span>{commentLabel(show.post.comment_count)}</span>
              </div>
              <Link
                href={show.href}
                className="mt-auto pt-3 font-osw text-sm uppercase tracking-wider text-primary-500 dark:text-secondary-500 hover:underline"
              >
                More {show.name} →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Off-season sidebar card: replaces the BB season stats table. */
export function OurShows({ shows = [] }) {
  return (
    <section className="v2-primary-container-inner p-4" aria-labelledby="our-shows-title">
      <h2 id="our-shows-title" className="v2-primary-subheader">
        Our Shows
      </h2>
      <ul className="mt-3 divide-y divide-gray-200 dark:divide-gray-700">
        <li className="py-2 first:pt-0">
          <Link href="/bigbrother-seasons" className="font-semibold text-primary-500 dark:text-primary-400 hover:underline">
            Big Brother
          </Link>
          <span className="block text-xs text-gray-500 dark:text-gray-400">Seasons, players and stats archive</span>
        </li>
        {shows.map((show) => (
          <li key={show.slug} className="py-2">
            <Link href={show.href} className="font-semibold text-primary-500 dark:text-primary-400 hover:underline">
              {show.name}
            </Link>
            <span className="block text-xs text-gray-500 dark:text-gray-400">
              Latest: {show.post.title}
            </span>
          </li>
        ))}
      </ul>
      <Link href="/shows" className="mt-3 inline-block font-osw text-sm uppercase tracking-wider text-primary-500 dark:text-secondary-500 hover:underline">
        All shows →
      </Link>
    </section>
  );
}
