import Image from "next/image";
import Link from "next/link";
import { toRelativeHref } from "@/lib/utils/url";

/**
 * Live Now section showing current HoH, PoV, and nominees
 */
export function LiveNowSection({ hoh, pov, nominees, juryCount, evictedCount, season }) {
  return (
    <section id="live">
      <div className="sech"><h2>Live Now</h2><span className="sub">Current week</span></div>
      <div className="card">

      <div className="grid grid-cols-2 gap-3">
        {/* Head of Household */}
        <StatusCard
          title="Head of Household"
          player={hoh}
          bgColor="bg-emerald-600"
          emptyText="No HoH Yet"
        />

        {/* Power of Veto */}
        <StatusCard
          title="Power of Veto"
          player={pov}
          bgColor="bg-yellow-500"
          emptyText="No PoV Yet"
        />
      </div>

      {/* Nominees */}
      <div className="mt-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="w-full bg-red-500 text-white text-center text-xs p-1 font-semibold">
          On the Block
        </div>
        <div className="p-3 flex flex-wrap gap-2 items-center justify-center min-h-[70px]">
          {nominees && nominees.length > 0 ? (
            nominees.slice(0, 3).map((player) => (
              <Link
                key={player.id}
                href={player.permalink ? toRelativeHref(player.permalink) : "#"}
                className="flex flex-col items-center hover:opacity-80"
              >
                {player.photo ? (
                  <Image
                    src={player.photo}
                    alt={player.name}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 font-medium">
                    {player.first_name?.charAt(0) || "?"}
                  </div>
                )}
                <span className="text-xs font-display text-center mt-1 text-gray-700 dark:text-gray-300">
                  {player.first_name}
                </span>
              </Link>
            ))
          ) : (
            <span className="text-center text-gray-500 dark:text-gray-400 italic text-xs">
              No Nominees Yet
            </span>
          )}
          {nominees && nominees.length > 3 && (
            <span className="text-xs text-slate-500">+{nominees.length - 3}</span>
          )}
        </div>
      </div>

      {/* Jury and Evicted counts */}
      <div className="mt-3 grid grid-cols-2 gap-3 text-center">
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
          <div className="text-slate-500 text-xs font-semibold">Jury</div>
          <div className="font-semibold text-lg">{juryCount}</div>
        </div>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3">
          <div className="text-slate-500 text-xs font-semibold">Evicted</div>
          <div className="font-semibold text-lg">{evictedCount}</div>
        </div>
      </div>
      </div>
    </section>
  );
}

function StatusCard({ title, player, bgColor, emptyText }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
      <div className={`w-full ${bgColor} text-white text-center text-xs p-1 font-semibold`}>
        {title}
      </div>
      <div className="p-3 flex flex-col items-center justify-center min-h-[80px]">
        {player ? (
          <Link
            href={player.permalink ? toRelativeHref(player.permalink) : "#"}
            className="flex flex-col items-center hover:opacity-80"
          >
            {player.photo ? (
              <Image
                src={player.photo}
                alt={player.name}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-500 font-medium">
                {player.first_name?.charAt(0) || "?"}
              </div>
            )}
            <span className="text-sm font-display text-center mt-1 text-gray-700 dark:text-gray-300">
              {player.first_name}
            </span>
          </Link>
        ) : (
          <span className="text-center text-gray-500 dark:text-gray-400 italic text-sm">
            {emptyText}
          </span>
        )}
      </div>
    </div>
  );
}
