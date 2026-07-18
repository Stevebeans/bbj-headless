// Attribution + expectation-setting for Bean Bot's automated feed updates.
// Rendered wherever an update with author.is_bot appears (homepage cards,
// feed hub, single update page).

function RobotIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="8" width="14" height="11" rx="2" strokeWidth={2} />
      <path strokeLinecap="round" strokeWidth={2} d="M12 8V5m0 0a1.5 1.5 0 10-.001-3.001A1.5 1.5 0 0012 5zM2 12v4m20-4v4" />
      <circle cx="9.5" cy="12.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="12.5" r="1" fill="currentColor" stroke="none" />
      <path strokeLinecap="round" strokeWidth={2} d="M9.5 16h5" />
    </svg>
  );
}

export function BeanBotNotice({ className = "" }) {
  return (
    <div className={`flex items-start gap-1.5 text-[11px] leading-snug text-gray-400 dark:text-gray-500 ${className}`}>
      <RobotIcon className="w-3.5 h-3.5 mt-px shrink-0" />
      <span>
        <span className="font-semibold text-gray-500 dark:text-gray-400">Bean Bot</span> is a tool to
        help monitor the feeds. It does its best, but information may sometimes be late or slow.
      </span>
    </div>
  );
}
