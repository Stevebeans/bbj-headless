"use client";

import { FaCrown, FaMedal, FaGem, FaShieldAlt, FaStar, FaTrophy } from "react-icons/fa";

// Icon mapping
const iconMap = {
  crown: FaCrown,
  medal: FaMedal,
  gem: FaGem,
  shield: FaShieldAlt,
  star: FaStar,
  trophy: FaTrophy,
};

// Color mapping for Tailwind classes
const colorClasses = {
  // Text colors
  "gray-500": "text-gray-500",
  "orange-600": "text-orange-600",
  "cyan-600": "text-cyan-600",
  "yellow-600": "text-yellow-600",
  "purple-600": "text-purple-600",
  "teal-600": "text-teal-600",
  "red-600": "text-red-600",
  "blue-600": "text-blue-600",
  "pink-600": "text-pink-600",
  "amber-500": "text-amber-500",
  // Background colors
  "gray-100": "bg-gray-100 dark:bg-gray-800",
  "orange-100": "bg-orange-100 dark:bg-orange-900/30",
  "cyan-100": "bg-cyan-100 dark:bg-cyan-900/30",
  "yellow-100": "bg-yellow-100 dark:bg-yellow-900/30",
  "purple-100": "bg-purple-100 dark:bg-purple-900/30",
  "teal-100": "bg-teal-100 dark:bg-teal-900/30",
  "red-100": "bg-red-100 dark:bg-red-900/30",
  "blue-100": "bg-blue-100 dark:bg-blue-900/30",
  "amber-100": "bg-amber-100 dark:bg-amber-900/30",
  "amber-200": "bg-amber-200 dark:bg-amber-800/40",
  "pink-100": "bg-pink-100 dark:bg-pink-900/30",
};

// Ring colors for special ranks (must be explicit for Tailwind JIT)
const ringClasses = {
  "orange-400": "ring-2 ring-orange-400 ring-offset-1",
  "amber-400": "ring-2 ring-amber-400 ring-offset-1",
};

export default function RankBadge({ rank, showLabel = true, size = "sm" }) {
  if (!rank) return null;

  const Icon = rank.icon ? iconMap[rank.icon] : null;
  const textColor = colorClasses[rank.color] || "text-gray-500";
  const bgColor = colorClasses[rank.bg_color] || "bg-gray-100 dark:bg-gray-800";

  // Size classes
  const sizeClasses = {
    xs: "text-xs px-1.5 py-0.5",
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
  };

  const iconSizes = {
    xs: "w-2.5 h-2.5",
    sm: "w-3 h-3",
    md: "w-4 h-4",
  };

  // Special styling for special ranks
  const isSpecial = rank.is_special;
  const ringClass = rank.ring ? ringClasses[rank.ring] || "" : "";

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        ${sizeClasses[size]}
        ${bgColor}
        ${textColor}
        ${ringClass}
      `}
    >
      {Icon && <Icon className={iconSizes[size]} />}
      {showLabel && <span>{rank.name}</span>}
    </span>
  );
}

// Compact version for inline use
export function RankBadgeInline({ rank }) {
  if (!rank) return null;

  const Icon = rank.icon ? iconMap[rank.icon] : null;
  const textColor = colorClasses[rank.color] || "text-gray-500";

  return (
    <span className={`inline-flex items-center gap-1 ${textColor}`} title={rank.name}>
      {Icon && <Icon className="w-3 h-3" />}
      <span className="text-xs font-medium">{rank.name}</span>
    </span>
  );
}
