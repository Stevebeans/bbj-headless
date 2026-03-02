"use client";

import { useState } from "react";
import CreatePost from "@/components/admin/content-engine/CreatePost";
import NewsFeed from "@/components/admin/content-engine/NewsFeed";
import Generator from "@/components/admin/content-engine/Generator";
import Queue from "@/components/admin/content-engine/Queue";
import PostLog from "@/components/admin/content-engine/PostLog";
import Settings from "@/components/admin/content-engine/Settings";

const SUB_TABS = [
  { id: "create", label: "Create Post" },
  { id: "news", label: "News Feed" },
  { id: "generate", label: "Generate" },
  { id: "queue", label: "Queue" },
  { id: "log", label: "Post Log" },
  { id: "settings", label: "Settings" },
];

export default function ContentEnginePage() {
  const [activeTab, setActiveTab] = useState("create");

  return (
    <div>
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 mb-6">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-primary-500 text-primary-500"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "create" && <CreatePost />}
      {activeTab === "news" && <NewsFeed />}
      {activeTab === "generate" && <Generator />}
      {activeTab === "queue" && <Queue />}
      {activeTab === "log" && <PostLog />}
      {activeTab === "settings" && <Settings />}
    </div>
  );
}
