"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AdContext = createContext({
  shouldShowAds: true,
  isPWA: false,
  isAdBlocked: false,
  sdkReady: false,
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

export function AdProvider({ children, initialShouldShowAds = true }) {
  const [isPWA, setIsPWA] = useState(false);
  const [isAdBlocked, setIsAdBlocked] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    setIsPWA(detectPWA());

    if (!initialShouldShowAds) return;

    const checkSDK = () => {
      if (window.freestar && window.freestar.config) {
        setSdkReady(true);
        return true;
      }
      return false;
    };

    if (checkSDK()) return;

    const interval = setInterval(() => {
      if (checkSDK()) clearInterval(interval);
    }, 500);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!window.freestar || !window.freestar.config) {
        setIsAdBlocked(true);
      }
    }, SDK_TIMEOUT_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [initialShouldShowAds]);

  return (
    <AdContext.Provider
      value={{
        shouldShowAds: initialShouldShowAds,
        isPWA,
        isAdBlocked,
        sdkReady,
      }}
    >
      {children}
    </AdContext.Provider>
  );
}

export function useAds() {
  return useContext(AdContext);
}
