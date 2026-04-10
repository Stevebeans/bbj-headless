"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const AdContext = createContext({
  shouldShowAds: true,
  isPWA: false,
  isAdBlocked: false,
  disabledPlacements: [],
  pwaSuppressed: [],
});

const SDK_TIMEOUT_MS = 5000;

function detectPWA() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    window.navigator.standalone === true
  );
}

export function AdProvider({
  children,
  initialShouldShowAds = true,
  supporterRoles = [],
  disabledPlacements = [],
  pwaSuppressed = [],
}) {
  const [isPWA, setIsPWA] = useState(false);
  const [isAdBlocked, setIsAdBlocked] = useState(false);
  const pathname = usePathname();
  const isFirstRender = useRef(true);
  const { user } = useAuth();
  const userEmail = user?.user_email;

  // Supporter detection runs client-side against hydrated auth state.
  // During the brief window before hydration, `user` is null so isSupporter=false
  // and ads are shown by default (matching anonymous behavior). After AuthContext
  // hydrates (~20-80ms), supporters will see ad slots unmount.
  const isSupporter =
    user &&
    Array.isArray(user.user_roles) &&
    supporterRoles.length > 0 &&
    user.user_roles.some((role) => supporterRoles.includes(role));

  const shouldShowAds = initialShouldShowAds && !isSupporter;

  // PWA detection
  useEffect(() => {
    setIsPWA(detectPWA());
  }, []);

  // Ad-blocker detection — check if full SDK loaded after timeout
  useEffect(() => {
    if (!shouldShowAds) return;

    const timeout = setTimeout(() => {
      if (typeof window.freestar?.newAdSlots !== "function") {
        setIsAdBlocked(true);
      }
    }, SDK_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [shouldShowAds]);

  // SPA route tracking — skip initial render (SDK tracks first page view itself)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!shouldShowAds) return;
    import("@freestar/pubfig-adslot-react-component").then((m) => {
      if (typeof m.default?.trackPageview === "function") {
        m.default.trackPageview();
      }
    }).catch(() => {
      // SDK not loaded (ad-blocker or network issue) — non-critical
    });
  }, [pathname, shouldShowAds]);

  // HEM email passthrough — pass logged-in user's email to Freestar for identity matching
  useEffect(() => {
    if (!shouldShowAds || !userEmail) return;
    window.freestar?.queue?.push(function () {
      window.freestar?.identity?.setIdentity({ email: userEmail });
    });
  }, [shouldShowAds, userEmail]);

  return (
    <AdContext.Provider
      value={{
        shouldShowAds,
        isPWA,
        isAdBlocked,
        disabledPlacements,
        pwaSuppressed,
      }}
    >
      {children}
    </AdContext.Provider>
  );
}

export function useAds() {
  return useContext(AdContext);
}
