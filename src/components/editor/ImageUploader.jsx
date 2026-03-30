"use client";

import { useState, useRef, useCallback } from "react";
import imageCompression from "browser-image-compression";
import { uploadMedia, generateAltText } from "@/lib/api/editor";
import CropModal from "./CropModal";

export default function ImageUploader({ imageId, imageUrl, cropData, onUpload, onRemove, onCropSave }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const fileRef = useRef(null);

  const compressAndUpload = useCallback(async (file) => {
    setUploading(true);
    setProgress(10);

    try {
      // Client-side compression
      const compressed = await imageCompression(file, {
        maxWidthOrHeight: 1600,
        initialQuality: 0.8,
        useWebWorker: true,
      });
      setProgress(40);

      // Ensure the compressed blob has a proper filename (WordPress rejects files without extensions)
      const fileName = file.name || "image.jpg";
      const fileToUpload = new File([compressed], fileName, { type: compressed.type || file.type });

      // Upload to WordPress
      const result = await uploadMedia(fileToUpload);
      setProgress(70);

      // Generate AI alt text
      let altText = "";
      try {
        const altResult = await generateAltText(result.url);
        altText = altResult.altText;
      } catch {
        altText = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      }
      setProgress(100);

      // Errata #10: Pass all 3 args consistently
      onUpload(result.id, result.url, altText);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [onUpload]);

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      compressAndUpload(file);
    }
  }

  function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) compressAndUpload(file);
  }

  if (imageUrl) {
    return (
      <>
        <div className="relative group">
          <img src={imageUrl} alt="Featured" className="w-full rounded-lg border border-gray-200" />
          <button
            onClick={onRemove}
            className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full text-xs opacity-0 group-hover:opacity-100 transition"
          >
            ✕
          </button>
        </div>
        <button
          onClick={() => setShowCrop(true)}
          className="mt-2 w-full py-1.5 text-xs font-medium text-primary-500 hover:text-primary-600 border border-primary-300 hover:border-primary-400 rounded-lg transition-colors"
        >
          Crop Image
        </button>

        {showCrop && (
          <CropModal
            imageUrl={imageUrl}
            attachmentId={imageId}
            initialCrops={cropData?.crops || null}
            onSave={(data) => {
              onCropSave?.(data);
              setShowCrop(false);
            }}
            onClose={() => setShowCrop(false)}
          />
        )}
      </>
    );
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition ${
        dragOver ? "border-primary-400 bg-primary-50" : "border-gray-300 hover:border-gray-400"
      }`}
    >
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

      {uploading ? (
        <div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div className="bg-primary-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-500">Compressing & uploading...</p>
        </div>
      ) : (
        <>
          <svg className="w-8 h-8 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" /></svg>
          <p className="text-xs text-gray-500">Drag & drop or click to upload</p>
        </>
      )}
    </div>
  );
}
