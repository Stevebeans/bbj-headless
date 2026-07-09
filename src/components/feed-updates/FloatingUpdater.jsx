"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import {
  createFeedUpdate,
  getMode,
  setMode as setModeApi,
  getSocialConfig,
} from "@/lib/api/feedUpdates";

// Character limits
const MAX_CONTENT_LENGTH = 1000;
const BLUESKY_LIMIT = 300;

function getCharCountColor(isOverLimit, blueskyWarning) {
  if (isOverLimit) return "text-red-500";
  if (blueskyWarning) return "text-yellow-600 dark:text-yellow-400";
  return "text-gray-500";
}

export function FloatingUpdater() {
  const { user, isAuthenticated } = useAuth();
  const { hasPermission } = usePermissions();

  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [content, setContent] = useState("");
  const [mode, setModeState] = useState("feed"); // feed or show
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Social posting
  const [postToBluesky, setPostToBluesky] = useState(true);
  const [socialConfig, setSocialConfig] = useState(null);

  // Refs
  const fileInputRef = useRef(null);

  // Gate on the real feed_updates permission (matches the backend's
  // checkUpdaterPermission and the admin permission matrix) rather than a
  // hardcoded role list — so the button honors whatever roles you grant.
  const canPost = isAuthenticated && hasPermission("feed_updates");

  // Load user's mode preference and social config
  useEffect(() => {
    if (canPost && user?.token) {
      // Load mode preference
      getMode(user.token)
        .then((data) => {
          if (data.mode) setModeState(data.mode);
        })
        .catch(() => {}); // Silently fail

      // Load social config
      getSocialConfig(user.token)
        .then((data) => {
          setSocialConfig(data);
          // Default on when configured
          setPostToBluesky(data.bluesky?.configured || false);
        })
        .catch(() => {});
    }
  }, [canPost, user?.token]);

  // Don't render if user can't post
  if (!canPost) return null;

  const handleModeToggle = async () => {
    const newMode = mode === "feed" ? "show" : "feed";
    setModeState(newMode);

    // Persist to server
    if (user?.token) {
      setModeApi(newMode, user.token).catch(() => {});
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be under 5MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await createFeedUpdate(
        {
          content: content.trim(),
          mode,
          image: imageFile,
          postToBluesky,
        },
        user.token
      );

      // Show success message
      let successMsg = "Update posted!";
      if (result.social_results?.bluesky?.posted) {
        successMsg += " Also posted to Bluesky.";
      }
      setSuccess(successMsg);

      // Let live feed lists (homepage + hub) prepend this instantly — the
      // poster sees their own update without a refresh, on ANY tier.
      // The create response has raw_content but no rendered `content` key,
      // which the homepage card renders — normalize so the optimistic card
      // isn't body-less (dedupe means a later poll can't repair it).
      if (result.update?.id) {
        window.dispatchEvent(
          new CustomEvent("bbjd:feed-update-created", {
            detail: {
              ...result.update,
              content: result.update.content ?? result.update.raw_content ?? "",
            },
          })
        );
      }

      // Reset form
      setContent("");
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      // Auto-close after success
      setTimeout(() => {
        setSuccess(null);
        setIsOpen(false);
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to post update");
    } finally {
      setIsSubmitting(false);
    }
  };

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CONTENT_LENGTH;
  const blueskyWarning = postToBluesky && charCount > BLUESKY_LIMIT;

  return (
    <div className="relative">
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 h-12 px-5 rounded-full shadow-lg text-white font-semibold text-sm whitespace-nowrap transition-all ${
          mode === "feed"
            ? "bg-primary-500 hover:bg-primary-600"
            : "bg-secondary-600 hover:bg-secondary-500"
        }`}
        aria-label={isOpen ? "Close updater" : "Post feed update"}
      >
        {isOpen ? (
          <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
        <span>{isOpen ? "Close" : "New Feed"}</span>
      </button>

      {/* Expanded Panel — opens above the button so it clears the FAB dock */}
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-3 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div
            className={`flex items-center justify-between px-4 py-2 rounded-t-lg ${
              mode === "feed"
                ? "bg-primary-500 text-white"
                : "bg-secondary-600 text-white"
            }`}
          >
            <span className="font-semibold">
              {mode === "feed" ? "Feed Update" : "Show Update"}
            </span>
            <button
              onClick={handleModeToggle}
              className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors"
            >
              Switch to {mode === "feed" ? "Show" : "Feed"}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-4">
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-3 p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-3 p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-sm">
                {success}
              </div>
            )}

            {/* Content Textarea */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                mode === "feed"
                  ? "What's happening on the feeds?"
                  : "What's happening on the show?"
              }
              className={`w-full p-3 border rounded-lg resize-none focus:ring-2 focus:outline-none dark:bg-gray-700 dark:text-white ${
                isOverLimit
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-600 focus:ring-primary-500"
              }`}
              rows={4}
              maxLength={MAX_CONTENT_LENGTH + 50}
            />

            {/* Character Count */}
            <div className="flex justify-between text-xs mt-1 mb-3">
              <span className={getCharCountColor(isOverLimit, blueskyWarning)}>
                {charCount}/{MAX_CONTENT_LENGTH}
                {blueskyWarning && (
                  <span className="ml-1">(Bluesky limit: {BLUESKY_LIMIT})</span>
                )}
              </span>
            </div>

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative mb-3 inline-block">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={120}
                  height={80}
                  className="rounded-lg object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            )}

            {/* Actions Row */}
            <div className="flex items-center justify-between gap-2 mb-3">
              {/* Image Upload */}
              <label className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300 hover:text-primary-500 cursor-pointer">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Add Image</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </label>

              {/* Social Posting Options */}
              <div className="flex items-center gap-3 text-sm">
                <label
                  className={`flex items-center gap-1 ${
                    socialConfig?.bluesky?.configured
                      ? "cursor-pointer"
                      : "cursor-not-allowed opacity-50"
                  }`}
                  title={
                    socialConfig?.bluesky?.configured
                      ? "Post to Bluesky"
                      : "Bluesky not configured"
                  }
                >
                  <input
                    type="checkbox"
                    checked={postToBluesky && socialConfig?.bluesky?.configured}
                    onChange={(e) => setPostToBluesky(e.target.checked)}
                    disabled={!socialConfig?.bluesky?.configured}
                    className="w-4 h-4 text-blue-500 rounded disabled:opacity-50"
                  />
                  <span className={socialConfig?.bluesky?.configured ? "text-blue-500" : "text-gray-400"}>
                    <svg className="w-4 h-4" viewBox="0 0 568 501" fill="currentColor">
                      <path d="M123.121 33.664C188.241 82.553 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.21C491.866-1.611 568-28.906 568 57.947c0 17.346-9.945 145.713-15.778 166.555-20.275 72.453-94.155 90.933-159.875 79.748C507.222 323.8 536.444 388.56 473.333 453.32c-119.86 122.992-172.272-30.859-185.702-70.281-2.462-7.227-3.614-10.608-3.631-7.733-.017-2.875-1.169.506-3.631 7.733-13.43 39.422-65.842 193.273-185.702 70.281-63.111-64.76-33.89-129.52 80.986-149.071-65.72 11.185-139.6-7.295-159.875-79.748C9.945 203.659 0 75.291 0 57.946 0-28.906 76.135-1.612 123.121 33.664Z" />
                    </svg>
                  </span>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !content.trim() || isOverLimit}
              className={`w-full py-2 rounded-lg font-semibold text-white transition-colors ${
                isSubmitting || !content.trim() || isOverLimit
                  ? "bg-gray-400 cursor-not-allowed"
                  : mode === "feed"
                  ? "bg-primary-500 hover:bg-primary-600"
                  : "bg-secondary-600 hover:bg-secondary-500"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Posting...
                </span>
              ) : (
                `Post ${mode === "feed" ? "Feed" : "Show"} Update`
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
