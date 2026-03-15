"use client";

import { useState } from "react";
import { generateTitle } from "@/lib/api/editor";

// Errata #8: Receives `editor` prop to get content directly instead of DOM query
export default function SEOPanel({ title, slug, setSlug, onSave, onTitleChange, editor }) {
  const [generating, setGenerating] = useState(false);

  const titleLength = title?.length || 0;
  const titleColor =
    titleLength >= 40 && titleLength <= 60 ? "text-green-500" :
    titleLength >= 30 && titleLength <= 70 ? "text-yellow-500" : "text-red-500";

  async function handleGenerateTitle() {
    setGenerating(true);
    try {
      const content = editor?.getText() || "";
      const result = await generateTitle(content, "Big Brother");
      // Errata #7: Use prop callback instead of custom event
      onTitleChange?.(result.title);
    } catch (err) {
      console.error("Title generation failed:", err);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">SEO Title</label>
          <span className={`text-xs font-mono ${titleColor}`}>{titleLength}/60</span>
        </div>
        <button
          onClick={handleGenerateTitle}
          disabled={generating}
          className="w-full py-1.5 bg-gray-100 hover:bg-gray-200 text-sm rounded text-center transition disabled:opacity-50"
        >
          {generating ? "Generating..." : "\u2728 Generate AI Title"}
        </button>
      </div>

      <div>
        <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">Slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => { setSlug(e.target.value); onSave?.(); }}
          className="w-full mt-1 p-2 border border-gray-200 rounded text-sm focus:border-primary-400 focus:outline-none text-gray-500"
          placeholder="auto-generated-from-title"
        />
      </div>
    </div>
  );
}
