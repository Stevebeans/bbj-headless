"use client";

import { FaStar, FaCrown } from "react-icons/fa";

/**
 * SupporterBadge - Displays supporter or lifetime member badge
 *
 * @param {string} type - 'supporter' or 'lifetime'
 * @param {string} size - 'sm', 'md', or 'lg'
 */
export default function SupporterBadge({ type, size = "sm" }) {
  if (!type) return null;

  const isLifetime = type === "lifetime";

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  if (isLifetime) {
    return (
      <span
        className={`
          inline-flex items-center gap-1 rounded-full font-semibold
          ${sizeClasses[size]}
          bg-gradient-to-r from-amber-400 to-yellow-500
          text-amber-900
          ring-2 ring-amber-300 ring-offset-1
          shadow-sm
        `}
        title="Lifetime Supporter"
      >
        <FaCrown className={iconSizes[size]} />
        <span>Lifetime</span>
      </span>
    );
  }

  // Regular supporter
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-semibold
        ${sizeClasses[size]}
        bg-yellow-100 dark:bg-yellow-900/40
        text-yellow-700 dark:text-yellow-400
      `}
      title="Supporter"
    >
      <FaStar className={iconSizes[size]} />
      <span>Supporter</span>
    </span>
  );
}

/**
 * Compact inline version for tight spaces
 */
export function SupporterBadgeInline({ type }) {
  if (!type) return null;

  const isLifetime = type === "lifetime";
  const Icon = isLifetime ? FaCrown : FaStar;
  const colorClass = isLifetime
    ? "text-amber-500"
    : "text-yellow-500";

  return (
    <span
      className={`inline-flex items-center ${colorClass}`}
      title={isLifetime ? "Lifetime Supporter" : "Supporter"}
    >
      <Icon className="w-3.5 h-3.5" />
    </span>
  );
}
