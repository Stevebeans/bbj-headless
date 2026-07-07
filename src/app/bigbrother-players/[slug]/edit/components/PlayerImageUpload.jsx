"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import imageCompression from "browser-image-compression";
import { uploadMedia } from "@/lib/api/editor";
import { centeredCrop, toPixelCrop } from "@/lib/images/cropUpload";

const MAX_SOURCE_MB = 10;

/**
 * Player photo/banner upload with a pre-upload crop step.
 *
 * Flow: pick/drop a file → crop modal (fixed aspect) → canvas-crop →
 * compress → upload to the WP media library via the editor media endpoint →
 * onUploaded({ id, url }). Cropping happens BEFORE upload so WordPress
 * generates every registered size from the already-cropped image.
 */
export function PlayerImageUpload({ label, initialUrl = "", aspect = 1, helpText, altText, onUploaded }) {
  const [preview, setPreview] = useState(initialUrl);
  const [pending, setPending] = useState(null); // { objectUrl, fileName, type }
  const [crop, setCrop] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const imgRef = useRef(null);

  // Revoke the object URL whenever the pending source changes/unmounts
  useEffect(() => {
    return () => {
      if (pending?.objectUrl) URL.revokeObjectURL(pending.objectUrl);
    };
  }, [pending]);

  const startCrop = (file) => {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_SOURCE_MB * 1024 * 1024) {
      setError(`File must be under ${MAX_SOURCE_MB}MB.`);
      return;
    }
    setPending({ objectUrl: URL.createObjectURL(file), fileName: file.name || "photo.jpg", type: file.type });
    setCrop(null);
  };

  const onImageLoad = (e) => {
    imgRef.current = e.currentTarget;
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setCrop(centeredCrop(aspect, naturalWidth, naturalHeight));
  };

  const confirmCrop = async () => {
    const img = imgRef.current;
    if (!img || !crop) return;
    setBusy(true);
    setError(null);

    try {
      const px = toPixelCrop(crop, img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = px.width;
      canvas.height = px.height;
      canvas.getContext("2d").drawImage(img, px.x, px.y, px.width, px.height, 0, 0, px.width, px.height);

      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Crop failed"))), "image/jpeg", 0.92);
      });

      const compressed = await imageCompression(
        new File([blob], pending.fileName.replace(/\.[^/.]+$/, "") + ".jpg", { type: "image/jpeg" }),
        { maxWidthOrHeight: 1600, initialQuality: 0.85, useWebWorker: true }
      );
      const fileToUpload = new File([compressed], pending.fileName.replace(/\.[^/.]+$/, "") + ".jpg", {
        type: "image/jpeg",
      });

      const result = await uploadMedia(fileToUpload);
      setPreview(result.url);
      setPending(null);
      onUploaded?.({ id: result.id, url: result.url });
    } catch (err) {
      setError(err.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      )}

      {preview ? (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt={altText || label || "Player image"}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 object-cover"
            style={{ aspectRatio: String(aspect) }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full py-1.5 text-xs font-medium text-primary-500 hover:text-primary-600 border border-primary-300 hover:border-primary-400 rounded-lg transition-colors"
          >
            Replace &amp; crop
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            startCrop(e.dataTransfer.files?.[0]);
          }}
          className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 rounded-lg p-6 text-center cursor-pointer transition-colors"
        >
          <svg className="w-8 h-8 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
          </svg>
          <span className="block text-xs text-gray-500">Click or drag &amp; drop to upload</span>
        </button>
      )}

      {helpText && <p className="mt-1 text-xs text-gray-400">{helpText}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          startCrop(e.target.files?.[0]);
          e.target.value = ""; // allow re-picking the same file
        }}
      />

      {pending &&
        createPortal(
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60" onClick={() => !busy && setPending(null)} />
            <div className="relative bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-2xl w-full p-5">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                Crop {label ? label.toLowerCase() : "image"}
              </h3>
              <div className="max-h-[60vh] overflow-auto flex justify-center bg-slate-100 dark:bg-slate-800 rounded-lg">
                <ReactCrop crop={crop} onChange={(_, pc) => setCrop(pc)} aspect={aspect} keepSelection>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={pending.objectUrl} alt="Crop preview" onLoad={onImageLoad} style={{ maxHeight: "58vh" }} />
                </ReactCrop>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setPending(null)}
                  disabled={busy}
                  className="px-4 py-2 text-sm border border-slate-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmCrop}
                  disabled={busy || !crop}
                  className="px-4 py-2 text-sm bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg disabled:opacity-50"
                >
                  {busy ? "Uploading..." : "Crop & upload"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
