"use client";

export default function SEOPanel({ title, slug, setSlug, onSave }) {
  const titleLength = title?.length || 0;
  const titleColor =
    titleLength >= 40 && titleLength <= 60 ? "text-green-500" :
    titleLength >= 30 && titleLength <= 70 ? "text-yellow-500" : "text-red-500";

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">SEO Title</label>
        <span className={`text-xs font-mono ${titleColor}`}>{titleLength}/60</span>
      </div>

      <div>
        <label className="text-xs font-semibold text-secondary-500 uppercase tracking-wider">Slug</label>
        <input
          type="text"
          value={slug || ""}
          onChange={(e) => { setSlug(e.target.value); onSave?.(); }}
          className="w-full mt-1 p-2 border border-gray-200 rounded text-sm focus:border-primary-400 focus:outline-none text-gray-500"
          placeholder="auto-generated-from-title"
        />
      </div>
    </div>
  );
}
