"use client";

import { useState } from "react";
import { getToken } from "@/lib/auth/cookies";

export default function EmbedModal({ editor, onClose }) {
  const [url, setUrl] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchEmbedHtml() {
    const apiBase = process.env.NEXT_PUBLIC_WORDPRESS_API_URL || "https://wp.bigbrotherjunkies.com/wp-json";
    const token = getToken();
    const res = await fetch(
      `${apiBase}/oembed/1.0/proxy?url=${encodeURIComponent(url.trim())}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) throw new Error("Could not fetch embed");
    const data = await res.json();
    if (!data.html) throw new Error("Provider returned no embed HTML");
    return data.html;
  }

  async function handlePreview() {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      setPreview(await fetchEmbedHtml());
    } catch {
      setPreview(null);
      setError("Couldn't load an embed for that URL — check it, or insert it as a plain link below.");
    } finally {
      setLoading(false);
    }
  }

  function insertHtml(html) {
    editor.chain().focus().insertContent(html).run();
    onClose();
  }

  // Escape URL for safe HTML attribute insertion
  const safeUrl = url
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  async function handleInsert() {
    if (!url.trim()) return;

    // No preview yet? Fetch it now instead of silently degrading to a link —
    // that silent fallback is how embeds shipped as bare links for months.
    let html = preview;
    if (!html) {
      setLoading(true);
      setError("");
      try {
        html = await fetchEmbedHtml();
      } catch {
        setError("Couldn't load an embed for that URL — check it, or insert it as a plain link below.");
        return;
      } finally {
        setLoading(false);
      }
    }

    insertHtml(`<figure class="embed-container" data-embed-url="${safeUrl}">${html}</figure>`);
  }

  function handleInsertAsLink() {
    if (!url.trim()) return;
    insertHtml(`<figure class="embed-container"><a href="${safeUrl}" target="_blank">${safeUrl}</a></figure>`);
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

        {error && (
          <div className="mb-3">
            <p className="text-red-500 text-sm">{error}</p>
            <button
              onClick={handleInsertAsLink}
              className="mt-1 text-sm text-primary-500 underline hover:text-primary-600"
            >
              Insert as plain link instead
            </button>
          </div>
        )}

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
