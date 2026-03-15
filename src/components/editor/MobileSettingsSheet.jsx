"use client";

import { useEffect, useRef } from "react";
import EditorSidebar from "./EditorSidebar";

export default function MobileSettingsSheet({ open, onClose, ...sidebarProps }) {
  const sheetRef = useRef(null);

  // Close on escape
  useEffect(() => {
    function handleEsc(e) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] overflow-y-auto animate-slide-up"
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="flex justify-between items-center px-4 pb-2 border-b border-gray-100">
          <h3 className="font-bold text-sm text-secondary-600">Post Settings</h3>
          <button onClick={onClose} className="text-gray-400 text-lg">{"\u2715"}</button>
        </div>

        <EditorSidebar {...sidebarProps} />
      </div>
    </div>
  );
}
