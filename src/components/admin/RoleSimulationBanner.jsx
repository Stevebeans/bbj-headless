"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function RoleSimulationBanner() {
  const [roleName, setRoleName] = useState(null);

  useEffect(() => {
    const name = sessionStorage.getItem("bbj_simulate_role_name");
    if (name) setRoleName(name);

    // Listen for storage changes (when simulation starts/stops in admin)
    const handleStorage = () => {
      const updated = sessionStorage.getItem("bbj_simulate_role_name");
      setRoleName(updated);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Also re-check on route changes by polling sessionStorage
  useEffect(() => {
    const interval = setInterval(() => {
      const current = sessionStorage.getItem("bbj_simulate_role_name");
      if (current !== roleName) setRoleName(current);
    }, 500);
    return () => clearInterval(interval);
  }, [roleName]);

  if (!roleName) return null;

  const handleExit = () => {
    sessionStorage.removeItem("bbj_simulate_role");
    sessionStorage.removeItem("bbj_simulate_role_name");
    setRoleName(null);
    // If on admin page, reload to restore real permissions
    if (window.location.pathname.startsWith("/admin")) {
      window.location.reload();
    }
  };

  return (
    <div className="bg-amber-400 dark:bg-amber-600">
      <div className="max-w-screen-xl mx-auto px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-900 dark:text-amber-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
            Previewing as: <strong>{roleName}</strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/settings"
            className="text-xs font-medium text-amber-800 dark:text-amber-200 hover:text-amber-950 dark:hover:text-white underline"
          >
            Permissions
          </Link>
          <button
            onClick={handleExit}
            className="text-xs font-semibold text-amber-900 dark:text-amber-100 bg-amber-200 dark:bg-amber-800 hover:bg-amber-100 dark:hover:bg-amber-700 px-3 py-1 rounded-full transition-colors"
          >
            Exit Preview
          </button>
        </div>
      </div>
    </div>
  );
}
