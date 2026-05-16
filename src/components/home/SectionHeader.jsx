import Link from "next/link";

/**
 * Shared header used at the top of every homepage section card.
 * Hero uses as="h1"; all other sections use the h2 default.
 * Visual style is identical regardless of tag so sections read as siblings.
 */
export function SectionHeader({ children, as: Tag = "h2", href, id, className = "" }) {
  const headingClass =
    "font-display font-semibold text-2xl md:text-3xl leading-tight text-primary-500 dark:text-secondary-500 m-0";

  const inner = href ? (
    <Link
      href={href}
      className="no-underline hover:text-secondary-500 dark:hover:text-secondary-400"
    >
      {children}
    </Link>
  ) : (
    children
  );

  return (
    <div className={`pb-3 mb-5 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <Tag id={id} className={headingClass}>
        {inner}
      </Tag>
    </div>
  );
}
