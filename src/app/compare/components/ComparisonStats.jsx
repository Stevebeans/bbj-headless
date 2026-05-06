/**
 * Side-by-side career statistics comparison
 * Each row: [P1 value] [label] [P2 value], higher value highlighted
 */
export function ComparisonStats({ player1, player2 }) {
  const s1 = player1.stats || {};
  const s2 = player2.stats || {};

  const rows = [
    { label: "Seasons", key: "total_seasons", icon: <CalendarIcon /> },
    { label: "HoH Wins", key: "total_hoh", icon: <CrownIcon /> },
    { label: "PoV Wins", key: "total_pov", icon: <MedalIcon /> },
    { label: "Nominated", key: "total_nom", icon: <TargetIcon />, lowerBetter: true },
    { label: "Votes", key: "total_votes", icon: <VoteIcon />, lowerBetter: true },
    { label: "Days", key: "total_days", icon: <ClockIcon /> },
  ];

  return (
    <section>
      <h2 className="v2-primary-subheader mb-4">Career Statistics</h2>
      <div className="space-y-2">
        {rows.map(({ label, key, icon, lowerBetter }) => {
          const v1 = s1[key] || 0;
          const v2 = s2[key] || 0;
          const p1Leads = lowerBetter ? v1 < v2 : v1 > v2;
          const p2Leads = lowerBetter ? v2 < v1 : v2 > v1;
          const tie = v1 === v2;

          return (
            <div
              key={key}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 px-4 py-3"
            >
              {/* Player 1 value */}
              <div className="text-right">
                <span
                  className={`text-xl md:text-2xl font-display font-bold tabular-nums ${
                    !tie && p1Leads
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {v1}
                </span>
              </div>

              {/* Label */}
              <div className="flex flex-col items-center min-w-[90px] md:min-w-[120px]">
                <div className="text-primary-500 dark:text-primary-400 mb-0.5">{icon}</div>
                <span className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300 text-center">
                  {label}
                </span>
              </div>

              {/* Player 2 value */}
              <div className="text-left">
                <span
                  className={`text-xl md:text-2xl font-display font-bold tabular-nums ${
                    !tie && p2Leads
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {v2}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// Icons — reused from PlayerStats pattern
function CalendarIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function MedalIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function VoteIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
