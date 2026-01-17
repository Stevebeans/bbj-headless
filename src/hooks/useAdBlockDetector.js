"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Hook to detect if user has an ad blocker enabled
 * Uses the "bait" method - creates an element that ad blockers typically hide
 *
 * DEV: Add ?adblock=1 to URL to simulate ad blocker for testing
 */
export function useAdBlockDetector() {
  const [isBlocked, setIsBlocked] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // DEV: Check for testing override
    const testOverride = searchParams.get("adblock");
    if (testOverride === "1" || testOverride === "true") {
      setIsBlocked(true);
      setIsChecked(true);
      return;
    }

    // Create a bait element that ad blockers will hide
    const bait = document.createElement("div");
    bait.className = "ad ads adsbox ad-placement advertisement advertising banner-ad";
    bait.style.cssText = "position:absolute;top:-10px;left:-10px;width:1px;height:1px;";
    bait.innerHTML = "&nbsp;";

    document.body.appendChild(bait);

    // Give ad blockers a moment to process
    const timer = setTimeout(() => {
      const isHidden =
        bait.offsetParent === null ||
        bait.offsetHeight === 0 ||
        bait.offsetWidth === 0 ||
        window.getComputedStyle(bait).display === "none" ||
        window.getComputedStyle(bait).visibility === "hidden";

      setIsBlocked(isHidden);
      setIsChecked(true);

      // Clean up
      if (bait.parentNode) {
        bait.parentNode.removeChild(bait);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (bait.parentNode) {
        bait.parentNode.removeChild(bait);
      }
    };
  }, []);

  return { isBlocked, isChecked };
}
