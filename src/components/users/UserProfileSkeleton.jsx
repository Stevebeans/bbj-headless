/**
 * UserProfileSkeleton - Loading state for user profile page
 */
export default function UserProfileSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Hero skeleton */}
      <div className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm mb-4">
        {/* Gradient header */}
        <div className="bg-slate-200 dark:bg-slate-700 h-24 sm:h-32" />

        {/* Content */}
        <div className="px-4 sm:px-6 pb-6">
          {/* Avatar */}
          <div className="relative flex justify-between items-end -mt-16 sm:-mt-20 mb-4">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-slate-300 dark:bg-slate-600 ring-4 ring-white dark:ring-slate-800" />
            {/* Follow button placeholder */}
            <div className="w-24 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
          </div>

          {/* Name */}
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-48 mb-2" />
          {/* Username */}
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-4" />

          {/* Badges */}
          <div className="flex gap-2 mb-4">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-28" />
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-24" />
          </div>

          {/* Stats */}
          <div className="flex gap-4 mb-3">
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-24" />
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-20" />
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-24" />
          </div>

          {/* Member since */}
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-40" />
        </div>
      </div>

      {/* Bio section skeleton */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm mb-4">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-3" />
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        </div>
      </div>

      {/* Favorite player skeleton */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm mb-4">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-32 mb-3" />
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg bg-slate-200 dark:bg-slate-700" />
          <div className="flex-1">
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-40 mb-2" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-32" />
          </div>
        </div>
      </div>

      {/* Comment history skeleton */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 shadow-sm">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-36 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-3" />
              <div className="flex gap-4">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
