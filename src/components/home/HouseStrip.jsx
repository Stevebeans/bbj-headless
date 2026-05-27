import Image from "next/image";
import Link from "next/link";
import { toRelativeHref } from "@/lib/utils/url";

const GROUPS = [
  { key: "hoh", label: "HOH", bg: "bg-emerald-600" },
  { key: "pov", label: "VETO", bg: "bg-orange-500" },
  { key: "nominees", label: "NOMS", bg: "bg-red-600" },
  { key: "have_nots", label: "HAVE-NOTS", bg: "bg-purple-600" },
];

export function HouseStrip({ houseboard, season }) {
  const seasonLabel = season?.name || "Big Brother";

  return (
    <section className="bbj-card bbj-house-strip">
      <div className="flex items-center gap-6 flex-wrap">
        <div
          className="leading-tight pr-6 border-r shrink-0 border-gray-200 dark:border-gray-700"
        >
          <div className="font-osw uppercase tracking-wider text-sm text-primary-500 dark:text-secondary-500">
            The House
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {seasonLabel}
          </div>
        </div>

        <div className="flex justify-around flex-grow gap-4 flex-wrap">
          {GROUPS.map(({ key, label, bg }) => (
            <HouseGroup
              key={key}
              players={houseboard?.[key] || []}
              label={label}
              bg={bg}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function HouseGroup({ players, label, bg }) {
  const isEmpty = players.length === 0;
  const names = players.map((p) => p.name).filter(Boolean).join(" · ");

  return (
    <div className="flex items-center gap-3 shrink-0">
      <div className="flex -space-x-2">
        {isEmpty ? (
          <span
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500 font-osw text-base"
            aria-hidden="true"
          >
            —
          </span>
        ) : (
          players.map((p) => (
            <Link
              key={p.id}
              href={p.permalink ? toRelativeHref(p.permalink) : "#"}
              aria-label={p.name}
              className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-white font-osw font-semibold text-sm border-2 border-white dark:border-gray-800 overflow-hidden no-underline ${bg}`}
            >
              {p.image ? (
                <Image
                  src={p.image}
                  alt={p.name}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                  unoptimized
                />
              ) : (
                <span>{(p.name || "").charAt(0).toUpperCase()}</span>
              )}
            </Link>
          ))
        )}
      </div>
      <div className="leading-tight">
        <div className="text-[10px] font-osw uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {label}
        </div>
        <div
          className={`text-sm font-semibold ${
            isEmpty
              ? "text-gray-400 dark:text-gray-500"
              : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {isEmpty ? "TBD" : names}
        </div>
      </div>
    </div>
  );
}
