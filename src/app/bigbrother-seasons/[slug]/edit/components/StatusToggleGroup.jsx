"use client";

/**
 * Status toggle chips for player status selection
 * Allows multi-select with visual feedback using status colors
 */

const STATUS_OPTIONS = [
  { key: "hoh", label: "HoH", color: "emerald", activeClass: "bg-emerald-600 text-white border-emerald-600" },
  { key: "pov", label: "PoV", color: "yellow", activeClass: "bg-yellow-500 text-slate-900 border-yellow-500" },
  { key: "nom", label: "Nom", color: "red", activeClass: "bg-red-500 text-white border-red-500" },
  { key: "safe", label: "Safe", color: "green", activeClass: "bg-green-400 text-slate-900 border-green-400" },
  { key: "havenot", label: "HN", color: "amber", activeClass: "bg-amber-700 text-white border-amber-700" },
  { key: "misc", label: "Misc", color: "slate", activeClass: "bg-slate-500 text-white border-slate-500" },
];

const INACTIVE_CLASS = "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-300 dark:border-slate-600";

export function StatusToggleGroup({ statuses, onChange, miscNotes, onMiscNotesChange, disabled = false }) {
  const handleToggle = (key) => {
    if (disabled) return;

    const newStatuses = { ...statuses };
    newStatuses[key] = !newStatuses[key];

    // If misc is toggled off, clear misc_notes
    if (key === "misc" && !newStatuses[key]) {
      onMiscNotesChange?.("");
    }

    onChange(newStatuses);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {STATUS_OPTIONS.map((option) => {
          const isActive = statuses[option.key];
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => handleToggle(option.key)}
              disabled={disabled}
              className={`
                px-3 py-1 text-xs font-medium rounded-full border-2 transition-all
                ${isActive ? option.activeClass : INACTIVE_CLASS}
                ${disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-80 cursor-pointer"}
              `}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {/* Misc notes input - shown when misc is active */}
      {statuses.misc && (
        <input
          type="text"
          value={miscNotes || ""}
          onChange={(e) => onMiscNotesChange?.(e.target.value)}
          placeholder="Custom label (e.g., Hacker, Coup d'Etat)"
          disabled={disabled}
          className="w-full px-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      )}
    </div>
  );
}
