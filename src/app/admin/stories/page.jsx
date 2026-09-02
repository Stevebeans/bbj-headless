"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import { getStoriesSettings } from "@/lib/api/stories";
import InboxView from "@/components/admin/stories/InboxView";
import SourcesView from "@/components/admin/stories/SourcesView";
import SettingsView from "@/components/admin/stories/SettingsView";

const VIEWS = [
  { id: "inbox", label: "Inbox" },
  { id: "sources", label: "Sources" },
  { id: "settings", label: "Settings" },
];

export default function StoriesAdminPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-500">Loading…</div>}>
      <StoriesAdminPageInner />
    </Suspense>
  );
}

function StoriesAdminPageInner() {
  const { hasPermission, loading: permLoading } = usePermissions();
  const router = useRouter();
  const params = useSearchParams();
  const view = VIEWS.some((v) => v.id === params.get("view")) ? params.get("view") : "inbox";
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState(null);

  const reload = () =>
    getStoriesSettings()
      .then((res) => setSettings(res.settings))
      .catch((e) => setError(e.message));

  useEffect(() => {
    if (!permLoading && hasPermission("stories_manage")) reload();
  }, [permLoading, hasPermission]);

  if (permLoading) return <div className="p-6 text-slate-500">Loading…</div>;
  if (!hasPermission("stories_manage")) return <div className="p-6 text-red-600">You do not have access to Stories.</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!settings) return <div className="p-6 text-slate-500">Loading…</div>;

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stories</h1>
        {settings.paused && <span className="rounded bg-amber-100 px-2 py-1 text-sm text-amber-800">Paused</span>}
      </div>
      <nav className="flex gap-2 border-b">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => router.replace(`/admin/stories?view=${v.id}`)}
            className={`px-3 py-2 text-sm ${view === v.id ? "border-b-2 border-slate-900 font-semibold" : "text-slate-500"}`}
          >
            {v.label}
          </button>
        ))}
      </nav>
      {view === "inbox" && <InboxView settings={settings} />}
      {view === "sources" && <SourcesView settings={settings} onSaved={setSettings} />}
      {view === "settings" && <SettingsView settings={settings} onSaved={setSettings} />}
    </div>
  );
}
