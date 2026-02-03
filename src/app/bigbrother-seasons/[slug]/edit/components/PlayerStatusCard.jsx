"use client";

import Image from "next/image";

const STAT_FIELDS = [
  { key: "hoh", label: "HoH" },
  { key: "pov", label: "PoV" },
  { key: "nom", label: "Nom" },
  { key: "veto_played", label: "Veto" },
  { key: "misc", label: "Misc" },
  { key: "saved", label: "Saved" },
  { key: "havenot", label: "H/N" },
  { key: "votes_received", label: "Votes" },
];

const STATUS_OPTIONS = [
  { key: "hoh", label: "HoH", activeClass: "bg-emerald-600 text-white border-emerald-600" },
  { key: "pov", label: "PoV", activeClass: "bg-yellow-500 text-slate-900 border-yellow-500" },
  { key: "nom", label: "Nom", activeClass: "bg-red-500 text-white border-red-500" },
  { key: "safe", label: "Safe", activeClass: "bg-green-400 text-slate-900 border-green-400" },
  { key: "havenot", label: "HN", activeClass: "bg-amber-700 text-white border-amber-700" },
  { key: "misc", label: "Misc", activeClass: "bg-slate-500 text-white border-slate-500" },
];

const INACTIVE_CLASS = "bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500 border-slate-300 dark:border-slate-600";

/**
 * Compact full-width player row for roster status editing
 * Designed for maximum density — see many players at once
 */
export function PlayerStatusCard({ player, onChange, disabled = false, season }) {
  const statuses = {
    hoh: player.game_status?.hoh || false,
    pov: player.game_status?.pov || false,
    nom: player.game_status?.nom || false,
    safe: player.game_status?.safe || false,
    havenot: player.game_status?.havenot || false,
    misc: player.game_status?.misc || false,
  };

  const isJury = player.game_status?.jury || false;
  const isEvicted = player.game_status?.evicted || false;
  const isEliminated = isEvicted || isJury;
  const finishPlace = player.finish_place || null;
  const evictedDate = player.evicted_date || null;
  const miscNotes = player.game_status?.misc_notes || "";

  const playerId = player.player_id || player.id;
  const isWinner = finishPlace === 1;
  const isRunnerUp = finishPlace === 2;
  const isAFP = season?.afp_id && playerId === season.afp_id;
  const radioName = `eliminated-${playerId}`;

  const getBorderColor = () => {
    if (isWinner) return "border-l-yellow-500";
    if (isRunnerUp) return "border-l-sky-500";
    if (isAFP && isEliminated) return "border-l-pink-500";
    if (statuses.hoh) return "border-l-emerald-600";
    if (statuses.pov) return "border-l-yellow-500";
    if (statuses.safe) return "border-l-green-400";
    if (statuses.nom) return "border-l-red-500";
    if (statuses.havenot) return "border-l-amber-700";
    if (isJury) return "border-l-indigo-500";
    if (isEliminated) return "border-l-slate-400";
    return "border-l-slate-300 dark:border-l-slate-600";
  };

  const handleStatusToggle = (key) => {
    if (disabled) return;
    const newStatuses = { ...statuses, [key]: !statuses[key] };
    if (key === "misc" && !newStatuses[key]) {
      onChange({
        ...player,
        game_status: { ...player.game_status, ...newStatuses, misc_notes: "" },
      });
      return;
    }
    onChange({
      ...player,
      game_status: { ...player.game_status, ...newStatuses },
    });
  };

  const handleEliminatedChange = (eliminated) => {
    onChange({
      ...player,
      game_status: {
        ...player.game_status,
        evicted: eliminated,
        hoh: eliminated ? false : player.game_status?.hoh,
        pov: eliminated ? false : player.game_status?.pov,
        nom: eliminated ? false : player.game_status?.nom,
        safe: eliminated ? false : player.game_status?.safe,
      },
      finish_place: eliminated ? player.finish_place : null,
    });
  };

  const handleStatChange = (field, value) => {
    onChange({
      ...player,
      stats: {
        ...player.stats,
        [field]: value === "" ? 0 : parseInt(value, 10) || 0,
      },
    });
  };

  const fullName = player.name || `${player.first_name || ""} ${player.last_name || ""}`.trim();
  const displayName = player.nickname ? `"${player.nickname}"` : player.first_name || player.name?.split(" ")[0] || "Player";

  return (
    <div className={`bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 border-l-4 ${getBorderColor()}`}>
      <div className="px-3 py-2 space-y-2">

        {/* Line 1: [Icon + Name] ... [Pill + Finish]  |  Stats */}
        <div className="flex items-center gap-2">
          {/* Left side: justify-between so finish/pill push right */}
          <div className="flex items-center justify-between flex-1 min-w-0">
            {/* Icon + Name */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative w-8 h-8 flex-shrink-0 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700">
                {player.photo ? (
                  <Image
                    src={player.photo}
                    alt={fullName}
                    fill
                    className={`object-cover ${isEliminated && !isJury ? "grayscale opacity-70" : ""} ${isJury ? "grayscale-[50%] opacity-80" : ""}`}
                    sizes="32px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">
                    {displayName.charAt(0).replace(/["']/g, "")}
                  </div>
                )}
              </div>
              <span className="font-medium text-sm text-slate-900 dark:text-white truncate">
                {fullName}
              </span>
            </div>

            {/* Pill + Finish — flush right against stats divider */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isWinner && <span className="px-1.5 py-0.5 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded text-[10px] font-bold text-slate-900">Winner</span>}
              {isRunnerUp && <span className="px-1.5 py-0.5 bg-gradient-to-r from-sky-400 to-sky-600 rounded text-[10px] font-bold text-white">2nd</span>}
              {isAFP && <span className="px-1.5 py-0.5 bg-gradient-to-r from-pink-400 to-pink-600 rounded text-[10px] font-bold text-white">AFP</span>}
              {finishPlace && finishPlace > 2 && <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-[10px] font-medium text-slate-500">#{finishPlace}</span>}
              <span className="text-[10px] text-slate-400">Fin</span>
              <input
                type="number"
                min="1"
                max="50"
                value={finishPlace || ""}
                onChange={(e) => onChange({ ...player, finish_place: e.target.value ? parseInt(e.target.value, 10) : null })}
                placeholder="#"
                disabled={disabled}
                className="w-10 px-0.5 py-0 text-xs text-center border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Right side: Stats — fixed width so columns align across rows */}
          <div className="flex-shrink-0 w-[400px] flex items-center justify-between gap-0.5 pl-2 border-l border-slate-200 dark:border-slate-700">
            {STAT_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex flex-col items-center w-[46px]">
                <span className="text-[9px] leading-none text-slate-400 dark:text-slate-500">{label}</span>
                <input
                  type="number"
                  min="0"
                  value={player.stats?.[key] ?? 0}
                  onChange={(e) => handleStatChange(key, e.target.value)}
                  disabled={disabled}
                  className="w-full px-0 py-0 text-[11px] text-center border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-primary-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Line 2: [Status chips + Elim + Jury] ... [Date] — justify-between */}
        <div className="flex items-center justify-between">
          {/* Left: status toggles + elimination + jury */}
          <div className="flex items-center gap-1.5">
            {/* Status toggle chips (active players only) */}
            {!isEliminated && STATUS_OPTIONS.map((opt) => {
              const isActive = statuses[opt.key];
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleStatusToggle(opt.key)}
                  disabled={disabled}
                  className={`px-2 py-0 text-[10px] font-medium rounded-full border transition-all ${isActive ? opt.activeClass : INACTIVE_CLASS} ${disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-80 cursor-pointer"}`}
                >
                  {opt.label}
                </button>
              );
            })}

            {/* Misc notes inline input */}
            {!isEliminated && statuses.misc && (
              <input
                type="text"
                value={miscNotes}
                onChange={(e) => onChange({ ...player, game_status: { ...player.game_status, misc_notes: e.target.value } })}
                placeholder="Label..."
                disabled={disabled}
                className="w-28 px-1.5 py-0 text-[10px] border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-primary-500"
              />
            )}

            {!isEliminated && <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />}

            {/* Eliminated radio */}
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Elim?</span>
            <label className="flex items-center gap-0.5 cursor-pointer">
              <input type="radio" name={radioName} checked={!isEliminated} onChange={() => handleEliminatedChange(false)} disabled={disabled} className="w-3 h-3 text-primary-500 focus:ring-primary-500" />
              <span className="text-[10px] text-slate-500">N</span>
            </label>
            <label className="flex items-center gap-0.5 cursor-pointer">
              <input type="radio" name={radioName} checked={isEliminated} onChange={() => handleEliminatedChange(true)} disabled={disabled} className="w-3 h-3 text-primary-500 focus:ring-primary-500" />
              <span className="text-[10px] text-slate-500">Y</span>
            </label>

            {/* Jury checkbox */}
            {isEliminated && (
              <>
                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                <label className="flex items-center gap-0.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isJury}
                    onChange={(e) => onChange({ ...player, game_status: { ...player.game_status, jury: e.target.checked } })}
                    disabled={disabled}
                    className="w-3 h-3 text-indigo-500 rounded focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500">Jury</span>
                </label>
              </>
            )}
          </div>

          {/* Right: evicted date — flush right */}
          {isEliminated && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-[10px] text-slate-400">Date:</span>
              <input
                type="date"
                value={evictedDate || ""}
                onChange={(e) => onChange({ ...player, evicted_date: e.target.value || null })}
                disabled={disabled}
                className="px-1 py-0 text-[10px] border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-1 focus:ring-primary-500"
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
