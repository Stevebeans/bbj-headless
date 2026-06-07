"use client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { isStandalone, isIOS, installAffordance } from "@/lib/pwa";

const DISMISS_KEY = "bbj-install-dismissed";
const DISMISS_DAYS = 14;
// Hold off surfacing on first paint so we don't fight LCP or feel pushy.
const SHOW_DELAY_MS = 2500;

function wasDismissed() {
  try {
    const ts = parseInt(localStorage.getItem(DISMISS_KEY) || "", 10);
    return !Number.isNaN(ts) && Date.now() - ts < DISMISS_DAYS * 86400000;
  } catch {
    return false;
  }
}

/**
 * Site-wide "add to home screen" prompt.
 * - Android / desktop Chromium: captures `beforeinstallprompt` and fires the
 *   native install dialog from our own button.
 * - iOS Safari: no prompt API exists, and push notifications DON'T WORK until
 *   the PWA is installed — so we show a manual "Share → Add to Home Screen" hint.
 * Hidden once installed (standalone) or dismissed (persisted ~14 days).
 *
 * Client component — safe to mount in the server layout without opting the tree
 * into dynamic rendering. See layout.jsx caching notes.
 */
export default function InstallBanner() {
  const [ios, setIos] = useState(false);
  const [prompt, setPrompt] = useState(null); // deferred beforeinstallprompt event
  const [dismissed, setDismissed] = useState(false);
  const [shown, setShown] = useState(false); // delay gate
  const [entered, setEntered] = useState(false); // slide-in transition

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* private mode — just hide for this session */
    }
    setDismissed(true);
  }, []);

  useEffect(() => {
    // Installed users never need this, and we skip listeners entirely for them.
    if (isStandalone() || wasDismissed()) return;
    setIos(isIOS());

    const onBeforeInstallPrompt = (e) => {
      e.preventDefault(); // keep the mini-infobar from auto-showing; we drive it
      setPrompt(e);
    };
    const onInstalled = () => dismiss();

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    const t = setTimeout(() => setShown(true), SHOW_DELAY_MS);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      clearTimeout(t);
    };
  }, [dismiss]);

  // standalone is handled by the early return above, so it's always false here.
  const mode = installAffordance({ standalone: false, ios, hasPrompt: !!prompt, dismissed });
  const visible = shown && mode !== "none";

  // Trigger the slide-in once we're about to render.
  useEffect(() => {
    if (!visible) return;
    const r = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(r);
  }, [visible]);

  const install = useCallback(async () => {
    if (!prompt) return;
    prompt.prompt();
    try {
      await prompt.userChoice;
    } catch {
      /* user choice rejected/unavailable — fall through to dismiss */
    }
    setPrompt(null);
    dismiss();
  }, [prompt, dismiss]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-4 sm:pb-6 pointer-events-none">
      <div
        role="dialog"
        aria-label="Install Big Brother Junkies"
        className={`pointer-events-auto w-full max-w-md rounded-2xl border border-black/5 bg-white shadow-2xl ring-1 ring-black/5 dark:border-white/10 dark:bg-slate-800 transition-all duration-300 ${
          entered ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        }`}
      >
        <div className="flex items-start gap-3 p-4">
          <Image
            src="/icons/icon-192.png"
            alt="Big Brother Junkies"
            width={44}
            height={44}
            className="h-11 w-11 flex-shrink-0 rounded-xl"
          />
          <div className="min-w-0 flex-1">
            <h3 className="font-osw text-base font-semibold text-gray-900 dark:text-white">
              {mode === "prompt" ? "Install Big Brother Junkies" : "Add BBJ to your Home Screen"}
            </h3>
            {mode === "prompt" ? (
              <>
                <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
                  Add our app for instant spoiler alerts and one-tap access.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={install}
                    className="rounded-lg bg-secondary-500 px-4 py-2 text-sm font-bold text-primary-600 transition hover:bg-secondary-400"
                  >
                    Install
                  </button>
                  <button
                    onClick={dismiss}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Not now
                  </button>
                </div>
              </>
            ) : (
              <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
                Tap{" "}
                <ShareIcon className="mx-0.5 -mt-0.5 inline h-4 w-4 align-middle text-primary-500" />{" "}
                then <span className="font-semibold">Add to Home Screen</span> to get push alerts.
              </p>
            )}
          </div>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="-mr-1 -mt-1 flex-shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-black/5 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-200"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// iOS share glyph (square with up-arrow) used inline in the A2HS hint.
function ShareIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0-12L8.5 6.5M12 3l3.5 3.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 11H5a1 1 0 00-1 1v7a1 1 0 001 1h14a1 1 0 001-1v-7a1 1 0 00-1-1h-1" />
    </svg>
  );
}
