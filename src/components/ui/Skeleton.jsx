/**
 * Reusable skeleton loading components
 */

// Base skeleton with pulse animation
export function Skeleton({ className = "", ...props }) {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      {...props}
    />
  );
}

// Text line skeleton
export function SkeletonText({ lines = 1, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}

// Circle skeleton (avatars)
export function SkeletonCircle({ size = "md", className = "" }) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };
  return <Skeleton className={`rounded-full ${sizes[size]} ${className}`} />;
}

// Post card skeleton
export function SkeletonPostCard({ className = "" }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow ${className}`}>
      {/* Image */}
      <Skeleton className="w-full h-48 rounded-none" />
      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category */}
        <Skeleton className="h-4 w-20" />
        {/* Title */}
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
        {/* Meta */}
        <div className="flex items-center gap-2 pt-2">
          <SkeletonCircle size="sm" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );
}

// Hero post skeleton (larger featured post)
export function SkeletonHeroPost({ className = "" }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow ${className}`}>
      <Skeleton className="w-full h-64 md:h-80 rounded-none" />
      <div className="p-6 space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-2/3" />
        <SkeletonText lines={2} />
        <div className="flex items-center gap-3 pt-2">
          <SkeletonCircle size="md" />
          <div className="space-y-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Sidebar widget skeleton
export function SkeletonWidget({ className = "" }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow ${className}`}>
      <Skeleton className="h-5 w-32 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-16 h-16 rounded flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Comment skeleton
export function SkeletonComment({ className = "" }) {
  return (
    <div className={`flex gap-3 ${className}`}>
      <SkeletonCircle size="md" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <SkeletonText lines={2} />
        <div className="flex gap-4 pt-1">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
    </div>
  );
}

// Player card skeleton
export function SkeletonPlayerCard({ className = "" }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow ${className}`}>
      <Skeleton className="w-full aspect-square rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-5 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto" />
      </div>
    </div>
  );
}

// Feed update skeleton
export function SkeletonFeedUpdate({ className = "" }) {
  return (
    <div className={`border-l-4 border-gray-200 dark:border-gray-600 pl-4 py-2 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}
