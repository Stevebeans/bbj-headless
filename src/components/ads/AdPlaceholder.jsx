"use client";

/**
 * Ad slot placeholder rendered in place of a real Freestar ad when admin
 * preview mode is active. Visually communicates the slot's size and label
 * while reserving the same height as the real ad would occupy.
 */
export function AdPlaceholder({ placementName, config, hiddenOnMobile = false, className = "" }) {
  const desktop = config?.desktop || { width: 300, height: 250 };
  const mobile = config?.mobile || { width: 300, height: 250 };
  const label = config?.label || "Ad Slot";

  // Build a compact size string. If desktop and mobile dims differ, show both.
  const sameSize =
    desktop.width === mobile.width && desktop.height === mobile.height;
  const desktopSize = `${desktop.width} × ${desktop.height}`;
  const mobileSize = `${mobile.width} × ${mobile.height}`;

  return (
    <div
      className={`flex items-center justify-center ${
        hiddenOnMobile ? "hidden md:block" : ""
      } ${className}`}
      style={{
        "--ad-h": `${mobile.height}px`,
        "--ad-h-desktop": `${desktop.height}px`,
      }}
      aria-label="Ad slot preview placeholder"
      data-placement={placementName}
    >
      <div
        className="w-full h-[var(--ad-h)] md:h-[var(--ad-h-desktop)] flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-600 rounded text-center px-3"
      >
        <div className="font-display text-xl md:text-2xl font-bold text-primary-500 dark:text-primary-400 leading-tight">
          {sameSize ? desktopSize : (
            <>
              <span className="hidden md:inline">{desktopSize}</span>
              <span className="md:hidden">{mobileSize}</span>
            </>
          )}
        </div>
        <div className="mt-1 font-osw uppercase tracking-wider text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
          {label}
        </div>
        <div className="mt-1 font-mono text-[9px] text-slate-400 dark:text-slate-500 truncate max-w-full">
          {placementName}
        </div>
      </div>
    </div>
  );
}

export default AdPlaceholder;
