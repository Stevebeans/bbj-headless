"use client";

import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { cropImage } from "@/lib/api/editor";

const CROP_CONFIGS = [
  { key: "header", label: "Post Header", width: 928, height: 333, aspect: 928 / 333 },
  { key: "thumbnail", label: "Thumbnail", width: 250, height: 150, aspect: 250 / 150 },
  { key: "og", label: "Social Share", width: 1200, height: 630, aspect: 1200 / 630 },
];

function getDefaultCrop(aspect, imgWidth, imgHeight) {
  const imgAspect = imgWidth / imgHeight;
  let cropWidth, cropHeight;

  if (imgAspect > aspect) {
    cropHeight = 100;
    cropWidth = (aspect * imgHeight / imgWidth) * 100;
  } else {
    cropWidth = 100;
    cropHeight = (imgWidth / aspect / imgHeight) * 100;
  }

  return {
    unit: "%",
    x: (100 - cropWidth) / 2,
    y: (100 - cropHeight) / 2,
    width: cropWidth,
    height: cropHeight,
  };
}

export default function CropModal({ imageUrl, attachmentId, initialCrops, onSave, onClose }) {
  const [activeTab, setActiveTab] = useState(0);
  const [crops, setCrops] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const imgRef = useRef(null);

  const onImageLoad = useCallback((e) => {
    imgRef.current = e.currentTarget;
    const { naturalWidth, naturalHeight } = e.currentTarget;

    const initial = {};
    CROP_CONFIGS.forEach((config) => {
      if (initialCrops?.[config.key]) {
        const saved = initialCrops[config.key];
        initial[config.key] = {
          unit: "%",
          x: (saved.x / naturalWidth) * 100,
          y: (saved.y / naturalHeight) * 100,
          width: (saved.width / naturalWidth) * 100,
          height: (saved.height / naturalHeight) * 100,
        };
      } else {
        initial[config.key] = getDefaultCrop(config.aspect, naturalWidth, naturalHeight);
      }
    });
    setCrops(initial);
  }, [initialCrops]);

  function handleCropChange(key, newCrop) {
    setCrops((prev) => ({ ...prev, [key]: newCrop }));
  }

  async function handleSave() {
    if (!imgRef.current) return;
    setSaving(true);
    setError(null);

    const { naturalWidth, naturalHeight } = imgRef.current;

    const naturalCrops = {};
    CROP_CONFIGS.forEach((config) => {
      const c = crops[config.key];
      if (!c) return;
      naturalCrops[config.key] = {
        x: Math.round((c.x / 100) * naturalWidth),
        y: Math.round((c.y / 100) * naturalHeight),
        width: Math.round((c.width / 100) * naturalWidth),
        height: Math.round((c.height / 100) * naturalHeight),
      };
    });

    try {
      const result = await cropImage(attachmentId, naturalCrops);
      const cropData = { original_id: attachmentId, crops: {} };
      CROP_CONFIGS.forEach((config) => {
        if (result.crops[config.key]) {
          cropData.crops[config.key] = {
            ...naturalCrops[config.key],
            url: result.crops[config.key].url,
          };
        }
      });
      onSave(cropData);
    } catch (err) {
      setError(err.message || "Failed to save crops");
    } finally {
      setSaving(false);
    }
  }

  const activeConfig = CROP_CONFIGS[activeTab];
  const activeCrop = crops[activeConfig.key];

  const sizeWarning = imgRef.current && (
    imgRef.current.naturalWidth < activeConfig.width ||
    imgRef.current.naturalHeight < activeConfig.height
  );

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-osw text-lg font-bold text-gray-800 dark:text-white">Crop Featured Image</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {CROP_CONFIGS.map((config, i) => (
            <button
              key={config.key}
              onClick={() => setActiveTab(i)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                activeTab === i
                  ? "text-primary-500 border-b-2 border-primary-500"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              {config.label}
              <span className="block text-[10px] text-gray-400">{config.width}x{config.height}</span>
            </button>
          ))}
        </div>

        {/* Crop Area */}
        <div className="flex-1 overflow-auto p-4">
          {sizeWarning && (
            <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm text-yellow-700 dark:text-yellow-400">
              Source image is smaller than {activeConfig.width}x{activeConfig.height} — crop may appear blurry.
            </div>
          )}

          {error && (
            <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <ReactCrop
            crop={activeCrop}
            onChange={(_, percentCrop) => handleCropChange(activeConfig.key, percentCrop)}
            aspect={activeConfig.aspect}
            className="max-h-[50vh]"
          >
            <img
              src={imageUrl}
              alt="Crop preview"
              onLoad={onImageLoad}
              className="max-w-full"
                          />
          </ReactCrop>

          {/* Previews */}
          {imgRef.current && Object.keys(crops).length === 3 && (
            <div className="mt-4 flex gap-3 justify-center">
              {CROP_CONFIGS.map((config) => {
                const c = crops[config.key];
                if (!c || !imgRef.current) return null;
                const nat = imgRef.current;
                const previewH = 60;
                const previewW = previewH * config.aspect;
                return (
                  <div key={config.key} className="text-center">
                    <div
                      className="overflow-hidden rounded border border-gray-200 dark:border-gray-700"
                      style={{ width: previewW, height: previewH }}
                    >
                      <img
                        src={imageUrl}
                        alt={config.label}
                        style={{
                          width: nat.naturalWidth * (previewW / ((c.width / 100) * nat.naturalWidth)),
                          height: nat.naturalHeight * (previewH / ((c.height / 100) * nat.naturalHeight)),
                          marginLeft: -(c.x / 100) * nat.naturalWidth * (previewW / ((c.width / 100) * nat.naturalWidth)),
                          marginTop: -(c.y / 100) * nat.naturalHeight * (previewH / ((c.height / 100) * nat.naturalHeight)),
                          maxWidth: "none",
                        }}
                                              />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">{config.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save Crops"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
