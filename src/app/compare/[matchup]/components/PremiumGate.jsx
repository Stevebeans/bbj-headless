"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { FaLock, FaCrown } from "react-icons/fa";

const SUPPORTER_ROLES = ["administrator", "editor", "supporter", "lifetime"];

/**
 * Premium gate overlay for comparison content.
 * Content is always rendered in DOM for SEO — non-premium users see it blurred.
 */
export function PremiumGate({ children }) {
  const { user, isAuthenticated } = useAuth();

  const roles = Array.isArray(user?.user_roles) ? user.user_roles : [];
  const isPremium = isAuthenticated && roles.some((role) => SUPPORTER_ROLES.includes(role));

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Content still in DOM for Google indexing */}
      <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 rounded-xl">
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <FaLock className="w-5 h-5 text-secondary-500" />
          </div>
          <h4 className="font-semibold text-slate-800 dark:text-white mb-1">
            Unlock Player Comparisons
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            Get full head-to-head stats with a premium membership
          </p>
          <Link
            href="/become-supporter"
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-500 hover:bg-secondary-600 text-white font-medium rounded-lg transition-colors"
          >
            <FaCrown className="w-4 h-4" />
            Go Premium
          </Link>
        </div>
      </div>
    </div>
  );
}
