"use client";

import { useState } from "react";
import Image from "next/image";

/**
 * Member avatar with a "mystery man" silhouette fallback, shown when the
 * member has no avatar or their avatar URL fails to load (gravatar
 * unreachable locally, deleted remote images).
 */
function MysteryMan({ size }) {
  return (
    <span
      className="rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-end justify-center shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        width={size * 0.82}
        height={size * 0.82}
        className="text-slate-400 dark:text-slate-500"
        fill="currentColor"
      >
        <path d="M12 12c2.7 0 4.9-2.2 4.9-4.9S14.7 2.2 12 2.2 7.1 4.4 7.1 7.1 9.3 12 12 12zm0 2.2c-3.9 0-9.8 2-9.8 5.9V22h19.6v-1.9c0-3.9-5.9-5.9-9.8-5.9z" />
      </svg>
    </span>
  );
}

export default function Avatar({ src, name, size = 44 }) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    return <MysteryMan size={size} />;
  }

  return (
    <Image
      src={src}
      alt={name || "User"}
      width={size}
      height={size}
      className="rounded-full object-cover shrink-0"
      style={{ width: size, height: size }}
      unoptimized
      onError={() => setBroken(true)}
    />
  );
}
