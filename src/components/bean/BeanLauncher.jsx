"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import BeanChat from "./BeanChat";

const TEASER_COOKIE = "bean_teaser_dismissed";
const BEAN_WAVE = "/bean/bean-wave.png";

// Site-wide floating launcher: a bean button bottom-right that opens the docked
// "Ask the Bean" chat. Teaser bubble is dismissible (1-week cookie for now;
// logged-in permanent account-setting is a Phase 2 follow-up).
export default function BeanLauncher() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [showTeaser, setShowTeaser] = useState(false);

  useEffect(() => {
    setMounted(true);
    const isDismissed = Cookies.get(TEASER_COOKIE) === "1";
    setDismissed(isDismissed);
    if (!isDismissed) {
      const t = setTimeout(() => setShowTeaser(true), 2500);
      return () => clearTimeout(t);
    }
  }, []);

  // Skip on the dedicated /search page (full chat already lives there).
  if (!mounted || pathname === "/search") return null;

  function dismissTeaser() {
    setDismissed(true);
    setShowTeaser(false);
    Cookies.set(TEASER_COOKIE, "1", { expires: 7 });
  }

  function openChat() {
    setOpen(true);
    dismissTeaser(); // engaging once retires the teaser
  }

  return (
    <div className="bean-app" data-accent="blue">
      {open ? (
        <div className="bean-widget" role="dialog" aria-label="Ask the Bean">
          <BeanChat variant="widget" onClose={() => setOpen(false)} />
        </div>
      ) : (
        <>
          {showTeaser && !dismissed && (
            <div className="bean-teaser">
              <button className="x" onClick={dismissTeaser} aria-label="Dismiss">
                ✕
              </button>
              <b>Ask the Bean</b>
              <p>Have an AI conversation with Steve Beans about all things Big Brother.</p>
              <button className="dismiss" onClick={dismissTeaser}>
                Don&rsquo;t show again
              </button>
            </div>
          )}
          <button className="bean-launcher" onClick={openChat} aria-label="Open Ask the Bean">
            <img src={BEAN_WAVE} alt="" width={48} height={48} />
          </button>
        </>
      )}
    </div>
  );
}
