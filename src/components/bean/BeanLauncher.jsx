"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Cookies from "js-cookie";
import { useAds } from "@/context/AdContext";
import BeanChat from "./BeanChat";

const TEASER_COOKIE = "bean_teaser_dismissed";
const BEAN_WAVE = "/bean/bean-wave.png";

// Site-wide floating launcher: a bean button bottom-right that opens the docked
// "Ask the Bean" chat. Teaser bubble is dismissible (1-week cookie for now;
// logged-in permanent account-setting is a Phase 2 follow-up).
export default function BeanLauncher() {
  const pathname = usePathname();
  const { shouldShowAds } = useAds();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [showTeaser, setShowTeaser] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDismissed(Cookies.get(TEASER_COOKIE) === "1");
  }, []);

  // Reveal the teaser only once the reader has engaged (scrolled past the fold)
  // so it never covers above-the-fold content on load. Falls back to a delayed
  // reveal on short pages, then auto-collapses so it stays a nudge, not a
  // persistent overlay camped over the article.
  useEffect(() => {
    if (!mounted || dismissed || open) return;
    let hideTimer;
    function reveal() {
      setShowTeaser(true);
      window.removeEventListener("scroll", onScroll);
      clearTimeout(fallbackTimer);
      hideTimer = setTimeout(() => setShowTeaser(false), 9000);
    }
    function onScroll() {
      if (window.scrollY > 500) reveal();
    }
    const fallbackTimer = setTimeout(reveal, 12000);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(hideTimer);
      clearTimeout(fallbackTimer);
    };
  }, [mounted, dismissed, open]);

  // Skip on the dedicated /search page (full chat already lives there).
  if (!mounted || pathname === "/search") return null;

  function dismissTeaser() {
    setDismissed(true);
    setShowTeaser(false);
    Cookies.set(TEASER_COOKIE, "1", { expires: 30 });
  }

  function openChat() {
    setOpen(true);
    dismissTeaser(); // engaging once retires the teaser
  }

  return (
    <div className={`bean-app${shouldShowAds ? " ads-on" : ""}`} data-accent="blue">
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
