// Ad placeholder component - displays a placeholder until ad system is integrated
// Server Component - no interactivity needed

export function AdPlaceholder({ slot, className = "", minHeight = "250px" }) {
  return (
    <div
      className={`v2-ad-container ${className}`}
      style={{ minHeight }}
      data-ad-slot={slot}
      aria-label="Advertisement"
    >
      <div className="text-center text-gray-400 dark:text-gray-500 p-4">
        <p className="text-xs uppercase tracking-wide">Advertisement</p>
        <p className="text-[10px] mt-1 text-gray-300 dark:text-gray-600">
          {slot}
        </p>
      </div>
    </div>
  );
}
