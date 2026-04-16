import Link from "next/link";
import { SearchBar } from "@/components/search/SearchBar";

export const metadata = {
  title: "Page Not Found",
  description: "The page you're looking for doesn't exist or has been moved.",
};

export default function NotFound() {
  return (
    <main className="v2-primary-container">
      <div className="v2-primary-container-inner p-8 text-center">
        {/* 404 Header */}
        <div className="mb-8">
          <h1 className="font-display text-8xl md:text-9xl text-primary-500 dark:text-primary-400 mb-2">
            404
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 font-osw">
            Oops! This page has been evicted.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Try searching for what you&apos;re looking for:
          </p>
          <SearchBar />
        </div>

        {/* Quick Links */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Or check out these popular pages:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 bg-primary-500 text-white rounded-full text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              Home
            </Link>
            <Link
              href="/bigbrother-players"
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Players
            </Link>
            <Link
              href="/bigbrother-seasons"
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Seasons
            </Link>
            <Link
              href="/live-feed-updates"
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Feed Updates
            </Link>
            <Link
              href="/contact"
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
