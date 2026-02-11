"use client";

import { FaMapMarkerAlt, FaFire, FaLayerGroup, FaCrosshairs, FaLock } from "react-icons/fa";

/** Map display mode definitions */
const MODES = [
  { id: "markers", label: "Markers", icon: FaMapMarkerAlt, premium: false },
  { id: "colored", label: "Color-coded", icon: FaMapMarkerAlt, premium: true },
  { id: "heatmap", label: "Heatmap", icon: FaFire, premium: true },
  { id: "states", label: "States", icon: FaLayerGroup, premium: true },
];

/**
 * Floating toolbar for switching map modes
 */
export default function MapControls({
  mode,
  onModeChange,
  isPremium,
  onFindNearest,
}) {
  return (
    <div className="absolute top-2 right-2 z-[1000] flex flex-col gap-1">
      {MODES.map((m) => {
        const Icon = m.icon;
        const isActive = mode === m.id;
        const locked = m.premium && !isPremium;

        return (
          <button
            key={m.id}
            onClick={() => !locked && onModeChange(m.id)}
            title={locked ? `${m.label} (Premium)` : m.label}
            className={`
              relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
              transition-all shadow-sm border
              ${isActive
                ? "bg-primary-500 text-white border-primary-600"
                : locked
                ? "bg-white/80 dark:bg-slate-800/80 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed"
                : "bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
              }
              backdrop-blur-sm
            `}
          >
            <Icon className="w-3 h-3" />
            <span className="hidden sm:inline">{m.label}</span>
            {locked && <FaLock className="w-2.5 h-2.5 text-slate-400" />}
          </button>
        );
      })}

      {isPremium && (
        <>
          <div className="border-t border-slate-200 dark:border-slate-700 my-0.5" />
          <button
            onClick={onFindNearest}
            title="Find nearest player"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium
              bg-white/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300
              border border-slate-200 dark:border-slate-700
              hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400
              backdrop-blur-sm shadow-sm transition-all"
          >
            <FaCrosshairs className="w-3 h-3" />
            <span className="hidden sm:inline">Find Nearest</span>
          </button>
        </>
      )}
    </div>
  );
}
