/**
 * Generic badge component for status indicators and awards
 * Variants match the CLAUDE.md color palette for houseguest statuses
 */

const variantStyles = {
  // Award badges
  winner: "bg-yellow-300 text-primary-500",
  "runner-up": "bg-slate-300 text-primary-500",
  afp: "bg-violet-300 text-primary-500",

  // Status badges (from spoiler bar)
  hoh: "bg-emerald-600 text-white",
  pov: "bg-yellow-500 text-primary-500",
  nom: "bg-red-500 text-white",
  jury: "bg-indigo-500 text-white",
  evicted: "bg-slate-400 text-white",
  active: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  safe: "bg-green-100 text-green-800 dark:bg-green-400 dark:text-green-900",
  havenot: "bg-amber-700 text-white",

  // Generic variants
  default: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
  primary: "bg-primary-500 text-white",
  secondary: "bg-secondary-500 text-primary-500",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-3 py-1 text-sm",
  lg: "px-4 py-1.5 text-base",
};

const icons = {
  winner: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  "runner-up": (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
    </svg>
  ),
  afp: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
    </svg>
  ),
};

export function Badge({
  variant = "default",
  size = "md",
  icon,
  showIcon = true,
  children,
  className = "",
}) {
  const variantClass = variantStyles[variant] || variantStyles.default;
  const sizeClass = sizeStyles[size] || sizeStyles.md;
  const iconElement = showIcon && icons[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-semibold tracking-wider ${variantClass} ${sizeClass} ${className}`}
    >
      {iconElement || icon}
      {children}
    </span>
  );
}
