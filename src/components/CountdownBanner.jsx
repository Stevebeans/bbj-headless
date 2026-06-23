"use client";

import { useEffect, useState } from "react";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

function computeParts(target) {
  const ms = Date.parse(target) - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60000);
  return {
    days: Math.floor(totalMinutes / 1440),
    hours: Math.floor((totalMinutes % 1440) / 60),
    minutes: totalMinutes % 60,
    underTwoHours: ms < TWO_HOURS_MS,
  };
}

export default function CountdownBanner({ enabled, label, target }) {
  const [mounted, setMounted] = useState(false);
  const [parts, setParts] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!enabled || !target) {
      setParts(null);
      return;
    }
    const tick = () => setParts(computeParts(target));
    tick();
    const id = setInterval(tick, 1000); // 1s so it flips to minutes at 2h and hides at 0
    return () => clearInterval(id);
  }, [enabled, target]);

  // Render nothing until mounted (avoids hydration mismatch + stale-expired flash),
  // or when disabled / no target / expired.
  if (!mounted || !enabled || !target || !parts) return null;

  const segments = parts.underTwoHours
    ? [
        { value: parts.hours, unit: "h" },
        { value: parts.minutes, unit: "m" },
      ]
    : [
        { value: parts.days, unit: "d" },
        { value: parts.hours, unit: "h" },
      ];

  return (
    <div className="w-full bg-primary-600 text-white">
      <div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-3 py-2 text-center">
        {label && (
          <span className="font-display text-base font-bold uppercase tracking-wide sm:text-lg">
            {label}
          </span>
        )}
        <span className="flex items-center gap-2 font-mono font-bold tabular-nums">
          {segments.map((seg, i) => (
            <span key={seg.unit} className="flex items-baseline">
              <span className="text-lg sm:text-xl">{seg.value}</span>
              <span className="ml-0.5 text-xs opacity-80">{seg.unit}</span>
              {i === 0 && <span className="mx-1 opacity-50">:</span>}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
