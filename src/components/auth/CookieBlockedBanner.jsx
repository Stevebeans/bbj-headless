"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Shows when a login succeeded but the browser refused to persist the auth
 * cookie (per-site blocks, security suites like ESET, "clear on exit" lists).
 * Without this, the member is silently logged out on the next page load and
 * writes in about "having to log in every time" — the site now diagnoses it.
 */
export function CookieBlockedBanner() {
  const { cookiesBlocked } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!cookiesBlocked || dismissed) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-[80] bg-amber-500 text-amber-950 shadow-lg" role="alert">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-start gap-3 text-sm">
        <span className="text-lg leading-none mt-0.5" aria-hidden="true">&#9888;&#65039;</span>
        <div className="flex-1">
          <strong>Heads up: your browser is blocking cookies for this site,</strong>{" "}
          so your login will not survive leaving this page. To stay logged in, allow
          cookies for bigbrotherjunkies.com in your browser settings (Settings &gt;
          Privacy &gt; Third-party cookies &gt; sites that can always use cookies), and
          check any security software (ESET, Norton, etc.) or privacy extensions for a
          cookie-blocking or cookie-cleanup feature. Then log in once more.
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 font-bold px-2 py-1 rounded hover:bg-amber-400 transition-colors"
          aria-label="Dismiss"
        >
          &#10005;
        </button>
      </div>
    </div>
  );
}
