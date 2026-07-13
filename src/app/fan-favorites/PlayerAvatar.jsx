"use client";

// Circular player photo with an initials fallback for players whose photo is
// missing (empty string), instead of a broken <img src="">.
export function playerInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] || "" : "";
  return (first + last).toUpperCase();
}

export default function PlayerAvatar({ player, size = 28, className = "" }) {
  const base = `shrink-0 rounded-full ${className}`;
  if (player?.photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={player.photo}
        alt={player.name}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={`${base} object-cover bg-gray-100 dark:bg-gray-800`}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size * 0.38)) }}
      className={`${base} inline-flex items-center justify-center bg-gray-200 dark:bg-gray-700 font-semibold text-gray-600 dark:text-gray-300 select-none`}
    >
      {playerInitials(player?.name)}
    </span>
  );
}
