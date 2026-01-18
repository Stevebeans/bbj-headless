/**
 * Generic related content grid component
 * Used for displaying related posts, players, seasons, etc.
 */

export function RelatedContent({
  title,
  items,
  renderCard,
  emptyText = "No related content",
  columns = 4,
  className = "",
}) {
  if (!items || items.length === 0) {
    return null;
  }

  const colClasses = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  };

  return (
    <section className={className}>
      {title && (
        <h3 className="v2-primary-subheader mb-3">{title}</h3>
      )}
      <div className={`grid gap-3 ${colClasses[columns] || colClasses[4]}`}>
        {items.map((item, index) => (
          <div key={item.id || index}>
            {renderCard(item)}
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Default card component for related content
 */
export function RelatedCard({
  href,
  image,
  title,
  subtitle,
  badge,
  className = "",
}) {
  const CardWrapper = href ? "a" : "div";

  return (
    <CardWrapper
      href={href}
      className={`block group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow ${className}`}
    >
      {image && (
        <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={title || ""}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          />
          {badge && (
            <div className="absolute top-2 right-2">
              {badge}
            </div>
          )}
        </div>
      )}
      <div className="p-2 text-center">
        <div className="font-display text-sm text-gray-800 dark:text-gray-200 truncate">
          {title}
        </div>
        {subtitle && (
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {subtitle}
          </div>
        )}
      </div>
    </CardWrapper>
  );
}
