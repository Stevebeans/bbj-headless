"use client";

import { useState, useCallback } from "react";
import { generateCaption } from "@/lib/api/admin";
import DraftEditor from "./DraftEditor";

export default function CreatePost() {
  const [image, setImage] = useState(null);
  const [mediaType, setMediaType] = useState("image/jpeg");
  const [captions, setCaptions] = useState([]);
  const [selectedCaption, setSelectedCaption] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  const processFile = useCallback((file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setMediaType(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target.result);
      setCaptions([]);
      setSelectedCaption("");
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const handlePaste = useCallback(
    (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          processFile(item.getAsFile());
          return;
        }
      }
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      const file = e.dataTransfer?.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleGenerateCaptions = async () => {
    if (!image) return;
    setGenerating(true);
    setError(null);
    try {
      // Strip the data URL prefix to get raw base64
      const base64 = image.includes(",") ? image.split(",")[1] : image;
      const data = await generateCaption(base64, mediaType);
      const list = data.captions || data.suggestions || [];
      setCaptions(list);
    } catch (err) {
      setError(err.message || "Failed to generate captions");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Image paste zone */}
      <div
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        tabIndex={0}
        className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 transition-colors focus:outline-none focus:border-primary-500"
      >
        {image ? (
          <div className="space-y-3">
            <img
              src={image}
              alt="Pasted"
              className="max-h-64 mx-auto rounded-lg"
            />
            <button
              onClick={() => {
                setImage(null);
                setCaptions([]);
                setSelectedCaption("");
              }}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Remove image
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-4xl text-slate-300 dark:text-slate-600">
              +
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Paste an image (Ctrl+V), drag & drop, or click to upload
            </p>
            <label className="inline-block px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 text-sm font-medium cursor-pointer dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600">
              Choose File
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* Generate caption button */}
      {image && (
        <button
          onClick={handleGenerateCaptions}
          disabled={generating}
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 text-sm font-medium disabled:opacity-50"
        >
          {generating ? "Generating..." : "Generate Caption"}
        </button>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* AI caption suggestions */}
      {captions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            AI Suggestions (click to use):
          </h3>
          <div className="grid gap-2">
            {captions.map((caption, i) => (
              <button
                key={i}
                onClick={() => setSelectedCaption(caption)}
                className={`text-left p-3 rounded-lg border text-sm transition-colors ${
                  selectedCaption === caption
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                    : "border-slate-200 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-600 text-gray-700 dark:text-gray-300"
                }`}
              >
                {caption}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Manual text + Draft Editor */}
      <DraftEditor
        initialBody={selectedCaption}
        initialImage={image ? (image.includes(",") ? image.split(",")[1] : image) : null}
        source="image_paste"
        onPost={() => {
          setImage(null);
          setCaptions([]);
          setSelectedCaption("");
        }}
      />
    </div>
  );
}
