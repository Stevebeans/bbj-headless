"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { useAuth } from "@/context/AuthContext";
import { isStandalone } from "@/lib/pwa";
import { isSupporterUser } from "@/lib/supporterRoles";

const PREVIEW_COOKIE_NAME = "bbj_ad_preview";
const PREVIEW_ADMIN_ROLES = ["administrator", "editor"];

// Routes that never show ads. The supporter sales page sells ad removal —
// Freestar's auto-managed dynamic in-content was injecting units inside the
// pricing cards there (bigbrotherjunkies_articles_dynamic_incontent).
const AD_FREE_ROUTES = ["/become-supporter", "/billing/plans", "/checkout/success", "/checkout/cancel", "/login"];
const ADFREE_RELOAD_KEY = "bbj_adfree_reload";

const AdContext = createContext({
  shouldShowAds: true,
  isPWA: false,
  isAdBlocked: false,
  disabledPlacements: [],
  pwaSuppressed: [],
  previewMode: false,
  isSupporter: false,
});

const SDK_TIMEOUT_MS = 5000;

// Single source of truth lives in lib/pwa.js (also used by InstallBanner).
const detectPWA = isStandalone;

export function AdProvider({
  children,
  initialShouldShowAds = true,
  supporterRoles = [],
  disabledPlacements = [],
  pwaSuppressed = [],
}) {
  const [isPWA, setIsPWA] = useState(false);
  const [isAdBlocked, setIsAdBlocked] = useState(false);
  const [previewCookie, setPreviewCookie] = useState(false);
  const pathname = usePathname();
  const isFirstRender = useRef(true);
  const { user } = useAuth();
  const userEmail = user?.user_email;

  // Supporter detection runs client-side against hydrated auth state.
  // During the brief window before hydration, `user` is null so isSupporter=false
  // and ads are shown by default (matching anonymous behavior). After AuthContext
  // hydrates (~20-80ms), supporters will see ad slots unmount.
  // Baseline roles union the admin-configured list — see lib/supporterRoles.js.
  const isSupporter = isSupporterUser(user, supporterRoles);

  const shouldShowAds = initialShouldShowAds && !isSupporter && !AD_FREE_ROUTES.includes(pathname);

  // Preview mode: cookie present AND user is admin/editor.
  // Always false for logged-out, non-admin, or cookie-absent users.
  const isAdmin =
    user &&
    Array.isArray(user.user_roles) &&
    user.user_roles.some((role) => PREVIEW_ADMIN_ROLES.includes(role));
  const previewMode = previewCookie && isAdmin;

  // PWA detection
  useEffect(() => {
    setIsPWA(detectPWA());
  }, []);

  // Ad-free routes only stay clean on a FRESH load — if the fan browsed other
  // pages first, the Freestar SDK is already booted and its auto-managed units
  // (sticky footer, dynamic in-content) can't be un-injected by React; they
  // ended up INSIDE the supporter pricing cards. Arriving on an ad-free route
  // with the SDK live → hard-reload once; the fresh load never boots the SDK
  // (shouldShowAds is false from the first render). Session guard stops loops;
  // it re-arms on any clean ad-free load so later SPA re-entries reload too.
  useEffect(() => {
    if (!AD_FREE_ROUTES.includes(pathname)) return;
    if (typeof window === "undefined") return;
    if (window.freestar) {
      if (sessionStorage.getItem(ADFREE_RELOAD_KEY) !== "1") {
        sessionStorage.setItem(ADFREE_RELOAD_KEY, "1");
        window.location.reload();
      }
    } else {
      sessionStorage.removeItem(ADFREE_RELOAD_KEY);
    }
  }, [pathname]);

  // Read preview-mode cookie on mount and whenever auth state changes
  useEffect(() => {
    const value = Cookies.get(PREVIEW_COOKIE_NAME);
    setPreviewCookie(value === "1");
  }, [user?.user_email]);

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
        previewMode,
        isSupporter,
      }}
    >
      {children}
    </AdContext.Provider>
  );
}

export function useAds() {
  return useContext(AdContext);
}
