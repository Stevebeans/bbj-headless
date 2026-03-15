"use client";

export default function PublishChecklist({ checklist }) {
  const items = [
    { key: "category", label: "Category selected" },
    { key: "featuredImage", label: "Featured image uploaded" },
    { key: "title", label: "Title set" },
    { key: "content", label: "Content added (100+ chars)" },
  ];

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <h4 className="text-xs font-semibold text-secondary-500 uppercase tracking-wider mb-2">
        Publish Checklist
      </h4>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.key} className="flex items-center gap-2 text-sm">
            <span className={checklist[item.key] ? "text-green-500" : "text-red-500"}>
              {checklist[item.key] ? "\u2713" : "\u2717"}
            </span>
            <span className={checklist[item.key] ? "text-gray-700" : "text-gray-400"}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
