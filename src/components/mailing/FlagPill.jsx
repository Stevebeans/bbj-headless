const FLAG_META = {
  hard_bounced: {
    label: "Hard bounced",
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/20",
    tip: "Permanent delivery failure. Already auto-unsubscribed by the bounce webhook.",
  },
  soft_bouncing: {
    label: "Soft bouncing",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    tip: "3+ temporary delivery failures. Mailbox is likely abandoned.",
  },
  never_opened: {
    label: "Never opened",
    dot: "bg-orange-500",
    text: "text-orange-700 dark:text-orange-400",
    bg: "bg-orange-50 dark:bg-orange-900/20",
    tip: "Received 5+ emails but never opened. Dead address or aggressive spam filter.",
  },
  dormant: {
    label: "Dormant",
    dot: "bg-slate-500",
    text: "text-slate-700 dark:text-slate-300",
    bg: "bg-slate-100 dark:bg-slate-800",
    tip: "Has not opened any email in 90+ days. Engagement lapsed.",
  },
};

export default function FlagPill({ flag }) {
  const meta = FLAG_META[flag];
  if (!meta) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${meta.bg} ${meta.text}`}
      title={meta.tip}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export { FLAG_META };
