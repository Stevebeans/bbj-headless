"use client";

import { useState } from "react";
import { getToken } from "@/lib/auth/cookies";

export default function EmbedModal({ editor, onClose }) {
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePreview() {
    if (!url.trim()) return;
    setLoading(true);
    setError("");

    try {
      const apiBase = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://bigbrotherjunkies.com/wp-json";
      const token = getToken();
      const res = await fetch(
        `${apiBase}/oembed/1.0/proxy?url=${encodeURIComponent(url)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error("Could not fetch embed");
      const data = await res.json();
      setPreview(data.html);
    } catch {
      setError("Could not load embed preview. Check the URL.");
    } finally {
      setLoading(false);
    }
  }

  function handleInsert() {
    if (!url.trim()) return;

    const embedHtml = preview
      ? `<figure class="embed-container" data-embed-url="${url}">${preview}</figure>`
      : `<figure class="embed-container"><a href="${url}" target="_blank">${url}</a></figure>`;

    editor.chain().focus().insertContent(embedHtml).run();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Embed Tweet or Instagram</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">{"\u2715"}</button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste Twitter or Instagram URL..."
            className="flex-1 p-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-primary-400"
          />
          <button
            onClick={handlePreview}
            disabled={loading}
            className="px-4 py-2 bg-primary-500 text-white text-sm rounded hover:bg-primary-400 transition disabled:opacity-50"
          >
            {loading ? "..." : "Preview"}
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        {preview && (
          <div className="border border-gray-200 rounded p-3 mb-4 max-h-60 overflow-y-auto">
            <div dangerouslySetInnerHTML={{ __html: preview }} />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            Cancel
          </button>
          <button
            onClick={handleInsert}
            disabled={!url.trim()}
            className="px-4 py-2 bg-secondary-500 text-primary-600 text-sm font-bold rounded hover:bg-secondary-400 transition disabled:opacity-50"
          >
            Insert Embed
          </button>
        </div>
      </div>
    </div>
  );
}
