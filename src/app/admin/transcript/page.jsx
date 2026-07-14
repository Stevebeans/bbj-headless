"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/api/admin";
import { TranscriptCard } from "../social/TranscriptCard";

// Transcript gets its own tab: a full day's collected posts is too tall to
// share the Social Intel page. The card itself lives with its siblings in
// admin/social/ — this page just hosts it and feeds it the current season.
export default function AdminTranscriptPage() {
  const [currentSeason, setCurrentSeason] = useState(null);

  useEffect(() => {
    let alive = true;
    adminFetch("/social/config")
      .then((data) => {
        if (alive) setCurrentSeason(data.current_season || null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-osw font-bold text-slate-800 dark:text-white mb-6">
        Transcript
      </h1>
      <TranscriptCard currentSeason={currentSeason} />
    </div>
  );
}
