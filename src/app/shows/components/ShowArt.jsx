/**
 * Inline SVG art for the Shows pages. No image requests, themable, and the
 * flicker is pure CSS (shows.css), which honors prefers-reduced-motion.
 */

/** A tiki torch. `lit={false}` renders it snuffed (empty states). */
export function Torch({ lit = true, className = "" }) {
  return (
    <svg
      className={`shw-torch${lit ? "" : " is-out"} ${className}`}
      viewBox="0 0 24 96"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <radialGradient id="shw-halo-g" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFBF0F" stopOpacity=".55" />
          <stop offset="100%" stopColor="#FFBF0F" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="shw-flame-g" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#D23B2B" />
          <stop offset="45%" stopColor="#FA910A" />
          <stop offset="100%" stopColor="#FFD970" />
        </linearGradient>
      </defs>
      <circle className="shw-halo" cx="12" cy="16" r="16" fill="url(#shw-halo-g)" />
      <path
        className="shw-flame"
        d="M12 2c3 5 7 8 7 14a7 7 0 0 1-14 0c0-4 2-6 4-9 0 3 1 4 2 5 1-3 0-6 1-10Z"
        fill="url(#shw-flame-g)"
      />
      <path
        className="shw-flame-in"
        d="M12 11c1.5 2.5 3 4 3 6.5a3 3 0 0 1-6 0c0-2 1.5-3.5 3-6.5Z"
        fill="#FFF3C4"
      />
      {/* bamboo cup + wrap */}
      <path d="M6 24h12l-2 12H8L6 24Z" fill={lit ? "#5C3B1E" : "#4B5563"} />
      <path d="M6.6 27.5h10.8M7.2 31h9.6" stroke={lit ? "#8A5A2B" : "#6B7280"} strokeWidth="1.2" />
      {/* pole with nodes */}
      <rect x="10.5" y="36" width="3" height="60" rx="1.5" fill={lit ? "#7A5230" : "#6B7280"} />
      <path d="M10 52h4M10 70h4" stroke={lit ? "#5C3B1E" : "#4B5563"} strokeWidth="1.5" />
      {!lit && <path d="M12 21c-2-3 1-5-1-8" stroke="#9CA3AF" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity=".7" />}
    </svg>
  );
}

/** A dripping candle, for The Traitors tile. */
export function Candle({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 46 72" aria-hidden="true" focusable="false">
      <ellipse cx="23" cy="14" rx="10" ry="12" fill="#C9A6E8" opacity=".18" />
      <path d="M23 4c2.5 4 4.5 6 4.5 9.5a4.5 4.5 0 0 1-9 0C18.5 10 20.5 8 23 4Z" fill="#FFD970" />
      <path d="M23 9.5c1 1.6 1.8 2.6 1.8 4a1.8 1.8 0 0 1-3.6 0c0-1.4.8-2.4 1.8-4Z" fill="#FFF3C4" />
      <path d="M15 22h16v46a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3V22Z" fill="#E9E1F0" />
      <path d="M15 22h16v6c-2 0-2 6-4 6s-1-4-3-4-1 9-3.5 9S19 29 17 29s-2 3-2 3V22Z" fill="#FFFFFF" opacity=".9" />
      <path d="M23 17v5" stroke="#3B2340" strokeWidth="1.4" />
    </svg>
  );
}
