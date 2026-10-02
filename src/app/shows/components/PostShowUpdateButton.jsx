"use client";

import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

/**
 * Staff-only shortcut: opens the site-wide FloatingUpdater with this show
 * already picked, so a Survivor post can't land in Big Brother by accident.
 * Same gate as the updater itself (feed_updates permission).
 */
export function PostShowUpdateButton({ show, label }) {
  const { isAuthenticated } = useAuth();
  const { hasPermission } = usePermissions();
  if (!isAuthenticated || !hasPermission("feed_updates")) return null;

  return (
    <button
      type="button"
      className="shw-post-btn"
      onClick={() => window.dispatchEvent(new CustomEvent("bbjd:open-updater", { detail: { show } }))}
    >
      <span aria-hidden="true">+</span> {label}
    </button>
  );
}
