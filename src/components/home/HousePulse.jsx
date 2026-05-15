function colorForRatio(ratio) {
  if (ratio === 0) return "bg-gray-200 dark:bg-gray-700";
  if (ratio <= 0.2) return "bg-amber-200";
  if (ratio <= 0.5) return "bg-amber-400";
  if (ratio <= 0.8) return "bg-red-400";
  return "bg-red-600";
}

export function HousePulse({ housePulse }) {
  if (!housePulse?.active) return null;

  const { buckets = [], total = 0 } = housePulse;
  if (buckets.length === 0) return null;

  const max = Math.max(...buckets.map((b) => b.count), 0);

  return (
    <section
      id="house-pulse"
      className="bbj-card bbj-house-pulse"
      aria-label="Feed activity last 8 hours"
    >
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="font-osw text-lg md:text-xl uppercase tracking-wide text-primary-500 dark:text-secondary-500 m-0">
          House Pulse
        </h2>
        <span className="text-xs text-gray-500 dark:text-gray-400 font-osw uppercase tracking-wider">
          Updates/hr · last 8 hours
        </span>
      </div>

      {total === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Quiet house · no updates in the last 8 hours.
        </p>
      ) : (
        <>
          <div
            className="flex gap-1 items-end h-12"
            role="img"
            aria-label="Updates per hour, last 8 hours"
          >
            {buckets.map((b, i) => {
              const ratio = max > 0 ? b.count / max : 0;
              const heightPct = Math.max(10, Math.round(ratio * 100));
              return (
                <div
                  key={`${b.hour}-${i}`}
                  className={`flex-1 ${colorForRatio(ratio)} rounded-sm`}
                  style={{ height: `${heightPct}%` }}
                >
                  <span className="sr-only">
                    {b.count} updates at {b.label}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-1 mt-1 text-[10px] text-gray-500 dark:text-gray-400 font-osw uppercase tracking-wider">
            {buckets.map((b, i) => (
              <div key={`${b.hour}-label-${i}`} className="flex-1 text-center">
                {i % 2 === 0 ? b.label : " "}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
