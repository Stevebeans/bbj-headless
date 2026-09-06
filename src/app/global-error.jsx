"use client";

import { useEffect, useState } from "react";
import { attemptStaleBuildHeal } from "@/lib/staleBuildHeal";

// Root-level boundary: catches what app/error.jsx cannot — errors thrown in
// the root layout tree (providers, header) and build-skew failures where the
// missing chunk is the layout's own. Without this file Next renders its bare
// "Application error: a client-side exception has occurred" page and the
// nav-time heal never runs (Ruth, 2026-09-05). Must render <html>/<body>
// itself because it replaces the root layout.
export default function GlobalError({ error, reset }) {
  const [healing, setHealing] = useState(false);

  useEffect(() => {
    console.error("Application error (root):", error);
    if (attemptStaleBuildHeal(error)) setHealing(true);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#faf9f6", color: "#374151" }}>
        <main style={{ maxWidth: 480, margin: "15vh auto", padding: 32, textAlign: "center" }}>
          {healing ? (
            <p style={{ fontSize: 20 }}>Refreshing the page…</p>
          ) : (
            <>
              <h1 style={{ fontSize: 48, color: "#ef4444", margin: "0 0 8px" }}>Oops!</h1>
              <p style={{ fontSize: 18, margin: "0 0 24px" }}>Something went wrong loading Big Brother Junkies.</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{ padding: "12px 24px", borderRadius: 999, border: 0, background: "#3b82f6", color: "#fff", fontSize: 16, cursor: "pointer" }}
              >
                Reload the page
              </button>
              <p style={{ fontSize: 14, color: "#9ca3af", marginTop: 24 }}>
                If this keeps happening, close this tab and open bigbrotherjunkies.com fresh.
              </p>
            </>
          )}
        </main>
      </body>
    </html>
  );
}
