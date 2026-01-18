/**
 * Generic stat card component for displaying numeric values with labels
 * Used in player stats, season stats, and anywhere numeric data needs display
 */

export function StatCard({
  label,
  value,
  icon,
  tooltip,
  className = "",
  size = "md",
}) {
  const sizeClasses = {
    sm: {
      container: "p-2",
      value: "text-xl",
      label: "text-xs",
    },
    md: {
      container: "p-3",
      value: "text-2xl md:text-3xl",
      label: "text-xs md:text-sm",
    },
    lg: {
      container: "p-4",
      value: "text-3xl md:text-4xl",
      label: "text-sm",
    },
  };

  const sizes = sizeClasses[size] || sizeClasses.md;

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 text-center ${sizes.container} ${className}`}
      title={tooltip}
    >
      {icon && (
        <div className="flex justify-center mb-1 text-primary-500 dark:text-primary-400">
          {icon}
        </div>
      )}
      <div
        className={`font-display font-bold text-primary-500 dark:text-primary-400 ${sizes.value}`}
      >
        {value ?? "—"}
      </div>
      <div
        className={`font-sans text-gray-500 dark:text-gray-400 uppercase tracking-wide ${sizes.label}`}
      >
        {label}
      </div>
    </div>
  );
}

/**
 * Grid wrapper for multiple stat cards
 */
export function StatCardGrid({ children, columns = 4, className = "" }) {
  const colClasses = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  };

  return (
    <div className={`grid gap-2 md:gap-3 ${colClasses[columns] || colClasses[4]} ${className}`}>
      {children}
    </div>
  );
}
