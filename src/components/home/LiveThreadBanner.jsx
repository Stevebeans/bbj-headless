import Link from "next/link";
import { getActiveLiveThread } from "@/lib/api/liveThread";

export async function LiveThreadBanner() {
  const liveThread = await getActiveLiveThread();
  if (!liveThread) return null;

  return (
    <div className="mb-4 rounded-lg overflow-hidden border-2 border-red-500/30 bg-gradient-to-r from-red-50 via-white to-red-50 dark:from-red-950/40 dark:via-gray-900 dark:to-red-950/40">
      <Link
        href={`/${liveThread.slug}`}
        className="flex items-center gap-3 p-4 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors"
      >
        <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          LIVE NOW
        </span>
        <span className="flex-grow font-display text-xl md:text-2xl text-primary-500 dark:text-primary-300 font-bold">
          {liveThread.title}
        </span>
        <span className="text-primary-500 dark:text-primary-300 font-bold hidden sm:inline">
          Join the thread →
        </span>
      </Link>
    </div>
  );
}
