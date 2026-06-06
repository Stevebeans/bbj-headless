// PWA install/standalone helpers — kept separate from push.js (the push
// subscription transport) so each module stays single-purpose.

// True when running as an installed PWA (home-screen / standalone or
// window-controls-overlay), not a browser tab. iOS uses navigator.standalone.
// This is the single source of truth — AdContext.detectPWA delegates here.
export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    window.navigator.standalone === true
  );
}

// iOS detection, incl. iPadOS 13+ which masquerades as macOS (detected via touch).
export function isIOS() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(ua) || iPadOS;
}

// Sole decision for which install affordance (if any) to surface.
// "prompt" = native beforeinstallprompt is available (Android/desktop Chromium);
// "ios"    = iOS Safari, which has no prompt API → show the manual A2HS hint;
// "none"   = already installed, dismissed, or nothing to offer.
export function installAffordance({ standalone, ios, hasPrompt, dismissed }) {
  if (standalone || dismissed) return "none";
  if (hasPrompt) return "prompt";
  if (ios) return "ios";
  return "none";
}
