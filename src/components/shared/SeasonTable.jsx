/**
 * Generic responsive table component for season/stats data
 * Handles responsive display (stacked on mobile, table on desktop)
 */

export function SeasonTable({
  columns,
  data,
  emptyText = "No data available",
  showFooter = false,
  footerData,
  className = "",
}) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 dark:text-gray-400 py-4 italic">
        {emptyText}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full table-auto text-sm">
        <thead className="bg-slate-50 text-slate-600 dark:bg-gray-800 dark:text-gray-300 text-xs uppercase">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2 ${col.align === "left" ? "text-left" : "text-center"}`}
                title={col.tooltip}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={row.id || rowIndex}
              className="border-t border-slate-200 dark:border-gray-700"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-2 ${col.align === "left" ? "text-left" : "text-center"} ${col.className || ""}`}
                >
                  {col.render ? col.render(row[col.key], row) : row[col.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {showFooter && footerData && (
          <tfoot className="bg-slate-50 dark:bg-gray-800 font-semibold">
            <tr>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-2 ${col.align === "left" ? "text-left" : "text-center"}`}
                >
                  {footerData[col.key] ?? ""}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}

/**
 * Progress bar cell for season table
 */
export function ProgressCell({ value, max = 100 }) {
  if (value === null || value === undefined) {
    return <span>—</span>;
  }

  const pct = Math.min(100, Math.max(0, value));

  return (
    <div className="flex items-center justify-end gap-2">
      <div
        className="relative h-2.5 w-28 overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-700"
        role="progressbar"
        aria-label="Progress"
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={pct}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-slate-300 to-primary-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs tabular-nums text-slate-600 dark:text-gray-300">
        {pct}%
      </span>
    </div>
  );
}

/**
 * Result cell with color coding
 */
export function ResultCell({ result }) {
  const colorMap = {
    Winner: "text-emerald-600 dark:text-emerald-400 font-semibold",
    "Runner Up": "text-sky-500 dark:text-sky-400 font-semibold",
    AFP: "text-pink-500 dark:text-pink-400 font-semibold",
    Jury: "text-indigo-500 dark:text-indigo-400",
    Evicted: "text-slate-400 dark:text-slate-500",
    Active: "text-slate-600 dark:text-slate-300",
  };

  const colorClass = colorMap[result] || "text-gray-600 dark:text-gray-300";

  return <span className={colorClass}>{result || "—"}</span>;
}
