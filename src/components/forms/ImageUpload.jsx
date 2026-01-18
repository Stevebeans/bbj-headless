"use client";

import { useState, useRef } from "react";
import Image from "next/image";

/**
 * Image upload component with preview
 */
export function ImageUpload({
  label,
  name,
  value,
  onChange,
  onUpload,
  error,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB default
  aspectRatio = "auto",
  description = "",
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      onChange(name, null, "Please upload an image file");
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      onChange(name, null, `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
      return;
    }

    setIsUploading(true);

    try {
      if (onUpload) {
        // Custom upload handler (e.g., to WordPress media library)
        const result = await onUpload(file);
        onChange(name, result.url, null);
      } else {
        // Create local preview URL
        const previewUrl = URL.createObjectURL(file);
        onChange(name, previewUrl, null);
      }
    } catch (error) {
      onChange(name, null, error.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onChange(name, null, null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </label>
      )}

      <div
        className={`
          relative border-2 border-dashed rounded-lg transition-colors
          ${dragActive ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20" : "border-slate-200 dark:border-slate-700"}
          ${error ? "border-red-500" : ""}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {value ? (
          // Preview state
          <div className="relative p-4">
            <div
              className={`relative mx-auto overflow-hidden rounded-lg ${
                aspectRatio === "auto" ? "" : `aspect-[${aspectRatio}]`
              }`}
              style={{ maxWidth: "300px" }}
            >
              <Image
                src={value}
                alt="Preview"
                width={300}
                height={200}
                className="w-full h-auto object-cover rounded-lg"
              />
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          // Upload state
          <div className="p-6 text-center">
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              onChange={handleChange}
              className="hidden"
              id={`upload-${name}`}
            />
            <label
              htmlFor={`upload-${name}`}
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              {isUploading ? (
                <svg
                  className="w-10 h-10 text-gray-400 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-10 h-10 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              )}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="text-primary-500 font-medium">Click to upload</span> or drag and drop
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                PNG, JPG, GIF up to {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </label>
          </div>
        )}
      </div>

      {description && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
