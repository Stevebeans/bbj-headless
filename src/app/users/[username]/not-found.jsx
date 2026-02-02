import Link from "next/link";
import { FaUserSlash, FaHome, FaSearch } from "react-icons/fa";

export default function UserNotFound() {
  return (
    <main className="v2-primary-container">
      <div className="flex w-full flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <FaUserSlash className="w-20 h-20 text-slate-300 dark:text-slate-600 mb-6" />

        <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          User Not Found
        </h1>

        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">
          The user you&apos;re looking for doesn&apos;t exist or may have been removed.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
          >
            <FaHome className="w-4 h-4" />
            Go Home
          </Link>

          <Link
            href="/directory"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors"
          >
            <FaSearch className="w-4 h-4" />
            Browse Players
          </Link>
        </div>
      </div>
    </main>
  );
}
