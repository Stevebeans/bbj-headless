"use client";

/**
 * Elimination fields for player elimination status
 * Includes finish place, jury checkbox, and eviction date
 */
export function EliminationFields({
  playerId,
  isEliminated,
  onEliminatedChange,
  finishPlace,
  onFinishPlaceChange,
  isJury,
  onJuryChange,
  evictedDate,
  onEvictedDateChange,
  disabled = false
}) {
  // Unique name for radio group per player
  const radioName = `eliminated-${playerId}`;

  return (
    <div className="space-y-3">
      {/* Finish Place - always visible for finale players */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
          Finish:
        </label>
        <input
          type="number"
          min="1"
          max="50"
          value={finishPlace || ""}
          onChange={(e) => onFinishPlaceChange(e.target.value ? parseInt(e.target.value, 10) : null)}
          placeholder="#"
          disabled={disabled}
          className="w-16 px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        <span className="text-xs text-slate-400">(1=Winner, 2=2nd...)</span>
      </div>

      {/* Eliminated toggle */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Eliminated?</span>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name={radioName}
              checked={!isEliminated}
              onChange={() => onEliminatedChange(false)}
              disabled={disabled}
              className="w-4 h-4 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">No</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="radio"
              name={radioName}
              checked={isEliminated}
              onChange={() => onEliminatedChange(true)}
              disabled={disabled}
              className="w-4 h-4 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">Yes</span>
          </label>
        </div>
      </div>

      {/* Elimination details - shown when eliminated */}
      {isEliminated && (
        <div className="pl-4 border-l-2 border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-4">
            {/* Jury Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isJury}
                onChange={(e) => onJuryChange(e.target.checked)}
                disabled={disabled}
                className="w-4 h-4 text-indigo-500 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">Jury?</span>
            </label>

            {/* Eviction Date */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
                Date:
              </label>
              <input
                type="date"
                value={evictedDate || ""}
                onChange={(e) => onEvictedDateChange(e.target.value || null)}
                disabled={disabled}
                className="px-2 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
