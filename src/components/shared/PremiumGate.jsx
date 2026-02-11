"use client";

import Link from "next/link";
import { FaLock, FaCrown } from "react-icons/fa";
import { usePremium } from "@/hooks/usePremium";

/**
 * Premium gate overlay. Content is always rendered in DOM for SEO —
 * non-premium users see it blurred with a lock overlay.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to gate
 * @param {string} [props.title="Unlock This Feature"] - Lock overlay heading
 * @param {string} [props.description="Get access with a premium membership"] - Lock overlay text
 * @param {string} [props.ctaText="Go Premium"] - CTA button text
 * @param {string} [props.ctaHref="/become-supporter"] - CTA link destination
 */
export function PremiumGate({
  children,
  title = "Unlock This Feature",
  description = "Get access with a premium membership",
  ctaText = "Go Premium",
  ctaHref = "/become-supporter",
}) {
  const { isPremium } = usePremium();

  if (isPremium) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="blur-sm pointer-events-none select-none" aria-hidden="true">
        {children}
      </div>

      <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-slate-900/60 rounded-xl">
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-secondary-100 dark:bg-secondary-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
            <FaLock className="w-5 h-5 text-secondary-500" />
          </div>
          <h4 className="font-semibold text-slate-800 dark:text-white mb-1">
            {title}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
            {description}
          </p>
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary-500 hover:bg-secondary-600 text-white font-medium rounded-lg transition-colors"
          >
            <FaCrown className="w-4 h-4" />
            {ctaText}
          </Link>
        </div>
      </div>
    </div>
  );
}
