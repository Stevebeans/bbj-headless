"use client";

import { useState } from "react";
import AuthorModal from "@/components/comments/AuthorModal";

/**
 * Makes a post byline open the same member profile modal used for commenters.
 * Renders a plain block when there is no real user id (id 0 = system or ghost
 * author), so those bylines stay non-clickable. A div with role=button rather
 * than a real button: the byline contains its own links (comment count), and
 * interactive elements cannot nest inside a button. Clicks on inner links are
 * ignored so they keep their own behavior.
 */
export default function AuthorModalTrigger({ userId, children }) {
  const [open, setOpen] = useState(false);

  if (!userId) {
    return <div className="flex items-center gap-3 min-w-0">{children}</div>;
  }

  const activate = (e) => {
    if (e.target.closest("a")) return; // inner links win
    setOpen(true);
  };

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={activate}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            activate(e);
          }
        }}
        className="flex items-center gap-3 min-w-0 text-left hover:opacity-80 transition-opacity cursor-pointer"
        aria-haspopup="dialog"
        title="View profile"
      >
        {children}
      </div>
      {open && <AuthorModal userId={userId} isOpen={open} onClose={() => setOpen(false)} />}
    </>
  );
}
