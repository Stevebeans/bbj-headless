"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Build-time inlined; the pixel is dormant until the env var is set in Vercel
// (and a deploy runs). No consent gating: US audience, mirrors GA/Freestar.
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

function bootstrapFbq() {
  if (window.fbq) return;
  const n = (window.fbq = function () {
    n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
  });
  if (!window._fbq) window._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  const t = document.createElement("script");
  t.async = true;
  t.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(t);
}

/**
 * Meta Pixel - fires PageView on load and on every client-side route change.
 * Renders nothing; skips localhost so dev browsing never pollutes audiences.
 */
export function MetaPixel() {
  const pathname = usePathname();
  const initialized = useRef(false);

  useEffect(() => {
    if (!PIXEL_ID) return;
    const host = window.location.hostname;
    if (host === "localhost" || host.endsWith(".localhost")) return;

    if (!initialized.current) {
      bootstrapFbq();
      window.fbq("init", PIXEL_ID);
      initialized.current = true;
    }
    window.fbq("track", "PageView");
  }, [pathname]);

  return null;
}
